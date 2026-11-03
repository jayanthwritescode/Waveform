"""Explicit, inspectable moment heuristics over observed source features."""
import hashlib
import json
import math
from pathlib import Path
import numpy as np
from .features import NUMERIC, genre_labels, label


class ContextEngine:
    def __init__(self, content):
        self.content = content
        self.index = content.index
        self.rules = json.loads(Path(__file__).with_name('context_rules.json').read_text())
        self._validate_rules()
        digest = hashlib.sha256(json.dumps(self.rules,sort_keys=True).encode()).hexdigest()[:10]
        self.version = f'context-v1-{digest}-{content.version}'

    def _validate_rules(self):
        weights = self.rules['ranking_weights']
        if set(weights) != {'base','context','discovery'} or any(not math.isfinite(w) or w < 0 for w in weights.values()) or sum(weights.values()) <= 0:
            raise ValueError('Invalid context ranking weights')
        for key,tolerance in self.rules['numeric_tolerances'].items():
            if key not in NUMERIC or not math.isfinite(tolerance) or tolerance <= 0:
                raise ValueError('Invalid context feature tolerance')
        for section in ('mood','activity','time_of_day','weather'):
            for targets in self.rules[section].values():
                for key,target in targets.items():
                    if key not in self.rules['numeric_tolerances'] or not math.isfinite(target) or not 0 <= target <= (1000 if key == 'bpm' else 1):
                        raise ValueError('Invalid context target')

    def metadata(self):
        return {**self.content.metadata(),'model_name':'Context suitability v1','model_version':self.version,
                'context_aware':True,'context_rules':self.rules,
                'score_meaning':'Weighted metadata similarity, explicit moment heuristics and catalogue-relative discovery; not probability or measured mood accuracy',
                'weather_source':'Manual optional choice; no location or live weather request',
                'duration_policy':'Greedy ranking order within the requested duration budget, at most 30 tracks; no overshoot'}

    def context_signals(self, row_index, context):
        row = self.index.rows[row_index]
        numeric = self.index.raw_numeric[row_index]
        signals = []
        missing = []
        requested_weight = 0
        def add_target(name, key, target, weight=1):
            nonlocal requested_weight
            requested_weight += weight
            value = numeric[NUMERIC.index(key)]
            if not np.isfinite(value):
                missing.append(f'{name}: {key}')
                return
            similarity = math.exp(-0.5*((value-target)/self.rules['numeric_tolerances'][key])**2)
            signals.append({'name':f'{name}: {key}', 'value':similarity,'raw_weight':weight,
                            'reason':f'{name} heuristic: source {key} {value:g}, target {target:g}.'})
        for section in ('mood','activity','time_of_day','weather'):
            chosen = context.get(section,'any')
            for key,target in self.rules[section].get(chosen,{}).items():
                # Explicit feature choices replace inferred targets for that feature.
                if key == 'energy' and context.get('energy_target') is not None: continue
                if key == 'instrumentalness' and context.get('instrumental_preference','any') != 'any': continue
                add_target(f'{section.replace("_"," ")} {chosen}',key,target)
        if context.get('energy_target') is not None:
            add_target('Moment energy', 'energy',context['energy_target'],2)
        instrumental = context.get('instrumental_preference','any')
        if instrumental != 'any':
            add_target(f'Instrumental {instrumental}','instrumentalness',1 if instrumental == 'prefer' else 0,2)
        for field,key in [('favorite_genres','genre'),('favorite_artists','artist')]:
            chosen = {label(value) for value in context.get(field,[])}
            if not chosen: continue
            requested_weight += 2
            actual = set(genre_labels(row)) if key == 'genre' else {label(row.get('artist'))}-{''}
            if not actual:
                missing.append(f'Moment {key}')
                continue
            matches = actual & chosen
            signals.append({'name':f'Moment {key}', 'value':float(bool(matches)),'raw_weight':2,
                            'reason':f'Moment {key}: '+('matched '+', '.join(sorted(matches)) if matches else 'no exact source-label match')+'.'})
        available_weight = sum(signal['raw_weight'] for signal in signals)
        for signal in signals:
            signal['weight'] = signal.pop('raw_weight')/requested_weight
            signal['contribution'] = signal['value']*signal['weight']
        return signals,missing,available_weight/requested_weight if requested_weight else None

    def recommend(self, *, context, length_mode='count', duration_minutes=None, **kwargs):
        requested = kwargs['limit']
        base = self.content.recommend(**{**kwargs,'limit':len(self.index.rows)})
        discovery = context.get('discovery')
        if discovery is None:
            discovery = kwargs['profile'].get('discovery_preference',0.5) if kwargs['use_profile'] else 0.5
        known_ids = {identifier for identifier in kwargs['liked_ids'] if identifier in self.index.ids} if kwargs['use_profile'] else set()
        familiar_artists = {label(value) for value in kwargs['profile'].get('favorite_artists',[])} if kwargs['use_profile'] else set()
        familiar_artists |= {self.index.artists[self.index.ids[identifier]] for identifier in known_ids if identifier in self.index.ids}
        familiar_artists.discard('')
        has_familiarity = bool(known_ids or familiar_artists)
        candidates = []
        for original in base['items']:
            item = {**original}
            i = self.index.ids[item['track_id']]
            details,missing,coverage = self.context_signals(i,context)
            blocks = []
            if item['score'] is not None:
                blocks.append(('base',item['score']))
            if details:
                blocks.append(('context',sum(signal['contribution'] for signal in details)))
            familiar = item['track_id'] in known_ids or self.index.artists[i] in familiar_artists
            if discovery != 0.5 and has_familiarity:
                blocks.append(('discovery',(1-discovery) if familiar else discovery))
            weights = self.rules['ranking_weights']
            total = sum(weights[key] for key,_ in blocks)
            item['signals'] = [{'name':key,'value':value,'weight':weights[key]/total,'contribution':value*weights[key]/total}
                               for key,value in blocks if total and weights[key] > 0]
            item['score'] = sum(signal['contribution'] for signal in item['signals']) if item['signals'] else None
            item['base_signals'] = original['signals'] if weights['base'] > 0 else []
            if weights['base'] == 0: item['nearest_seed']=None
            item['context_signals'] = details if weights['context'] > 0 else []
            item['unavailable_context_features'] = missing
            item['context_coverage'] = coverage
            reasons = list(original['reasons']) if original['score'] is not None and weights['base'] > 0 else []
            if weights['context'] > 0:
                reasons.extend(signal['reason'] for signal in details)
                if details and missing: reasons.append(f'Context evidence covers {coverage:.3f} of requested target weight; missing features reduce the context contribution without being imputed.')
            if discovery != 0.5 and has_familiarity and weights['discovery'] > 0:
                reasons.append(f'Catalogue-relative discovery {discovery:g}: '+('liked track or familiar artist label.' if familiar else 'outside your liked/favorite artist labels; this does not prove you have never heard it.'))
            item['reasons'] = reasons or ['No usable positive signal; retained from deterministic balanced discovery.']
            candidates.append(item)
        fallback = not any(item['score'] is not None and item['score'] > 0 for item in candidates)
        if not fallback:
            candidates.sort(key=lambda item:(-item['score'] if item['score'] is not None else float('inf'),item['track_id']))
        else:
            # Preserve the content engine's genre/artist balance when all scores lack signal.
            for item in candidates:
                item['score']=None; item['signals']=[]; item['context_signals']=[]
                item['reasons']=['Selected by deterministic balanced discovery; no positive context/taste signal.']
        notices = [notice for notice in base['notices'] if 'No usable positive' not in notice and 'blending is not used' not in notice]
        if fallback: notices.append('No usable positive context or taste signal: balanced discovery has no personalized score.')
        if discovery != 0.5 and not has_familiarity:
            notices.append('Discovery preference omitted: no known likes or favorite artist labels establish familiarity. Familiarity is not listening history.')
        total_seconds = 0
        selected = []
        unknown_duration = 0
        budget = duration_minutes*60 if length_mode == 'duration' else None
        for item in candidates:
            duration = self.index.rows[self.index.ids[item['track_id']]].get('duration_seconds')
            known_duration = duration is not None and math.isfinite(duration) and duration > 0
            if budget is not None and (not known_duration or total_seconds+duration > budget): continue
            selected.append(item)
            if known_duration: total_seconds += duration
            else: unknown_duration += 1
            if len(selected) >= requested: break
        for rank,item in enumerate(selected,1): item['rank']=rank
        if budget is not None:
            notices.append(f'Duration budget: {total_seconds:g} of {budget:g} seconds selected, {budget-total_seconds:g} seconds unfilled. Ranking-order greedy selection, maximum {requested} tracks; exact fit is not guaranteed. Unknown durations are omitted.')
        elif len(selected) < requested:
            notices.append(f'Only {len(selected)} of {requested} tracks are eligible; exclusions were not relaxed.')
        notices.append('Moment targets are configurable heuristics over source features, not measured mood/activity labels. Time and weather are your manual choices.')
        return {**base,'items':selected,'fallback':fallback,'requested_count':requested,'returned_count':len(selected),
                'model':self.metadata(),'notices':notices,'moment':context,
                'length':{'mode':length_mode,'requested_minutes':duration_minutes,'total_known_seconds':total_seconds,
                          'unknown_duration_tracks':unknown_duration,'maximum_tracks':requested,
                          'remaining_seconds':budget-total_seconds if budget is not None else None}}
