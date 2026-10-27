"""Available-signal hybrid; no artist-to-track interaction mapping is invented."""
import hashlib
import json
import math
from pathlib import Path
import numpy as np
from app.schemas.recommendation import HybridWeights
from .features import label


class HybridEngine:
    def __init__(self, context):
        self.context = context
        self.content = context.content
        self.index = context.index
        self.weights = HybridWeights.model_validate_json(Path(__file__).with_name('hybrid_weights.json').read_text()).model_dump()
        digest=hashlib.sha256(json.dumps(self.weights,sort_keys=True).encode()).hexdigest()[:10]
        self.version=f'hybrid-v1-{digest}-{context.version}'

    def metadata(self):
        return {**self.context.metadata(),'model_name':'Available-signal hybrid v1','model_version':self.version,
                'hybrid':True,'hybrid_weights':self.weights,'collaborative':False,
                'collaborative_status':{'available':False,'verified_track_mappings':0,
                    'reason':'HetRec interactions are artist-level and have no verified mapping to this track catalogue. The collaborative experiment is separate.'},
                'normalization':'Analytically bounded [0,1] components; available positive weights renormalized per candidate, no batch min-max',
                'score_meaning':'Relative available-signal ranking, not probability or measured relevance accuracy'}

    def recommend(self, *, context, weights=None, length_mode='count', duration_minutes=None, **kwargs):
        weights=HybridWeights.model_validate(weights or self.weights).model_dump()
        base=self.content.recommend(**{**kwargs,'limit':len(self.index.rows)})
        content,pairs=self.index.similarities(base['seed_ids'])
        preference,_,_,pref_facts=self.content.preferences(kwargs['profile'] if kwargs['use_profile'] else {})
        discovery=context.get('discovery')
        if discovery is None: discovery=kwargs['profile'].get('discovery_preference',.5) if kwargs['use_profile'] else .5
        likes={value for value in kwargs['liked_ids'] if value in self.index.ids} if kwargs['use_profile'] else set()
        artists={label(value) for value in kwargs['profile'].get('favorite_artists',[])} if kwargs['use_profile'] else set()
        artists |= {self.index.artists[self.index.ids[value]] for value in likes};artists.discard('')
        familiarity=bool(likes or artists)
        items=[]
        for original in base['items']:
            item={**original}; i=self.index.ids[item['track_id']]
            details,missing,coverage=self.context.context_signals(i,context)
            familiar=item['track_id'] in likes or self.index.artists[i] in artists
            values={'content':float(content[i]) if np.isfinite(content[i]) else None,
                    'preference':float(preference[i]) if np.isfinite(preference[i]) else None,
                    'context':sum(signal['contribution'] for signal in details) if details else None,
                    'discovery':((1-discovery) if familiar else discovery) if familiarity and discovery != .5 else None,
                    'collaborative':None}
            denominator=sum(weights[key] for key,value in values.items() if value is not None)
            signals=[{'name':key,'value':value,'weight':weights[key]/denominator,'contribution':value*weights[key]/denominator}
                     for key,value in values.items() if value is not None and weights[key] > 0 and denominator > 0]
            enabled={signal['name'] for signal in signals}; reasons=[]; neighbor=None
            if 'content' in enabled and pairs:
                nearest=max(range(len(pairs)),key=lambda j:pairs[j].total[i] if np.isfinite(pairs[j].total[i]) else -1)
                neighbor=self.index.explain_pair(i,base['seed_ids'][nearest],pairs[nearest])
                reasons.append(f'Content is mean similarity across {len(pairs)} seed(s); closest seed: {neighbor["seed_title"]}.')
                reasons.extend(neighbor['facts'])
            if 'preference' in enabled: reasons.extend(pref_facts[i] or ['No exact positive genre/artist preference match.'])
            if 'context' in enabled:
                reasons.extend(signal['reason'] for signal in details)
                if missing: reasons.append(f'Context evidence coverage {coverage:.3f}; missing targets reduce the context contribution.')
            if 'discovery' in enabled: reasons.append('Catalogue-relative discovery: '+('liked track or familiar artist label.' if familiar else 'outside liked/favorite artist labels; prior listening is unknown.'))
            item.update(score=sum(signal['contribution'] for signal in signals) if signals else None,
                        signals=signals,reasons=reasons,nearest_seed=neighbor,base_signals=[],
                        context_signals=details if 'context' in enabled else [],context_coverage=coverage,
                        unavailable_context_features=missing,unavailable_hybrid_signals=[key for key,value in values.items() if value is None and weights[key]>0])
            items.append(item)
        fallback=not any(item['score'] is not None and item['score']>0 for item in items)
        if fallback:
            by_id={item['track_id']:item for item in items}
            order=self.content.balanced([self.index.ids[value] for value in by_id],len(items))
            items=[by_id[self.index.rows[i]['id']] for i in order]
            for item in items: item.update(score=None,signals=[],context_signals=[],nearest_seed=None,reasons=['No usable enabled hybrid signal; deterministic balanced discovery.'])
        else: items.sort(key=lambda item:(-item['score'] if item['score'] is not None else float('inf'),item['track_id']))
        selected=[]; total=0; unknown=0
        budget=duration_minutes*60 if length_mode=='duration' else None
        for item in items:
            duration=self.index.rows[self.index.ids[item['track_id']]].get('duration_seconds')
            known=duration is not None and math.isfinite(duration) and duration>0
            if budget is not None and (not known or total+duration>budget): continue
            selected.append(item)
            if known: total+=duration
            else: unknown+=1
            if len(selected)>=kwargs['limit']: break
        for rank,item in enumerate(selected,1): item['rank']=rank
        notices=['Collaborative signal unavailable: artist-level HetRec interactions have no verified track mapping. Available enabled signals are renormalized; no collaborative track scores are fabricated.',
                 'Context uses explicit source-feature heuristics. Discovery is catalogue-relative, not listening history.']
        notices.extend(notice for notice in base['notices'] if 'most recently updated known likes' in notice)
        if not familiarity and discovery!=.5: notices.append('Discovery omitted: no known familiarity labels.')
        if fallback: notices.append('No positive enabled signal; unscored balanced discovery.')
        if budget is not None: notices.append(f'Duration ceiling {budget:g}s; selected {total:g}s; gap {budget-total:g}s. Greedy order, maximum {kwargs["limit"]} tracks; no exact-fit guarantee.')
        if len(selected)<kwargs['limit']: notices.append(f'Returned {len(selected)} tracks; exclusions and length limits were not relaxed.')
        metadata={**self.metadata(),'hybrid_weights':weights}
        if weights!=self.weights: metadata['model_version']+='-w'+hashlib.sha256(json.dumps(weights,sort_keys=True).encode()).hexdigest()[:8]
        return {**base,'items':selected,'fallback':fallback,'requested_count':kwargs['limit'],'returned_count':len(selected),
                'model':metadata,'hybrid_weights':weights,'notices':notices,'moment':context,
                'length':{'mode':length_mode,'requested_minutes':duration_minutes,'total_known_seconds':total,
                          'unknown_duration_tracks':unknown,'maximum_tracks':kwargs['limit'],'remaining_seconds':budget-total if budget is not None else None}}
