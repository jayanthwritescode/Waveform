import hashlib
import json
from pathlib import Path
import numpy as np
from pydantic import BaseModel, Field, model_validator
from .features import NUMERIC, FeatureIndex, genre_labels, label


class EngineSettings(BaseModel):
    content_weights: dict[str,float]
    numeric_gamma: float = Field(gt=0,le=100)
    ranking_weights: dict[str,float]
    preference_weights: dict[str,float]
    maximum_liked_seeds: int = Field(ge=1,le=100)

    @model_validator(mode='after')
    def valid_weights(self):
        for values,keys in [(self.content_weights,{'genre','metadata','artist','numeric'}),
                            (self.ranking_weights,{'content','preference'}),
                            (self.preference_weights,{'genres','artists','energy','instrumental'})]:
            if set(values) != keys or any(not np.isfinite(value) or value < 0 for value in values.values()) or sum(values.values()) <= 0:
                raise ValueError('Weights must have the documented keys, be finite/nonnegative and sum to more than zero')
        return self


class ContentEngine:
    def __init__(self, rows, settings=None):
        self.settings = settings or EngineSettings.model_validate_json(Path(__file__).with_name('settings.json').read_text())
        self.index = FeatureIndex(rows,self.settings.content_weights,self.settings.numeric_gamma)
        fingerprint = json.dumps({'rows':rows,'settings':self.settings.model_dump()},sort_keys=True,default=str).encode()
        self.version = 'content-v1-'+hashlib.sha256(fingerprint).hexdigest()[:12]

    def metadata(self):
        return {'model_name':'Content similarity v1', 'model_version':self.version, 'catalogue_tracks':len(self.index.rows),
                'artists':len({artist for artist in self.index.artists if artist}), 'primary_genres':len({row.get('genre') for row in self.index.rows if row.get('genre')}), 'genre_labels':len(self.index.genre_encoder.classes_),
                'fit_kind':'Unsupervised metadata index; no supervised or collaborative training',
                'content_weights':self.settings.content_weights,'ranking_weights':self.settings.ranking_weights,
                'preference_weights':self.settings.preference_weights,'numeric_coverage':self.index.coverage,
                'score_meaning':'Relative weighted content/preference ranking score, not probability or prediction accuracy',
                'context_aware':False,'collaborative':False}

    def preferences(self, profile):
        rows = self.index.rows; size = len(rows)
        values = {}; available = {}; facts = [[] for _ in rows]
        favorite_genres = {label(value) for value in profile.get('favorite_genres',[])}
        favorite_artists = {label(value) for value in profile.get('favorite_artists',[])}
        if favorite_genres:
            values['genres'] = np.array([float(bool(set(genre_labels(row)) & favorite_genres)) for row in rows])
            available['genres'] = np.array([bool(genre_labels(row)) for row in rows])
            for i,row in enumerate(rows):
                matches = sorted(set(genre_labels(row)) & favorite_genres)
                if matches and self.settings.preference_weights['genres'] > 0: facts[i].append('Favorite genre: '+', '.join(matches))
        if favorite_artists:
            values['artists'] = np.array([float(label(row.get('artist')) in favorite_artists) for row in rows])
            available['artists'] = np.array([bool(label(row.get('artist'))) for row in rows])
            for i,row in enumerate(rows):
                if values['artists'][i] and self.settings.preference_weights['artists'] > 0: facts[i].append('Favorite artist: '+row['artist'])
        low, high = profile.get('energy_min',0), profile.get('energy_max',1)
        if low != 0 or high != 1:
            energies = self.index.raw_numeric[:,NUMERIC.index('energy')]
            known = np.isfinite(energies)
            values['energy'] = np.where(known,np.clip(1-np.maximum(np.maximum(low-energies,energies-high),0),0,1),0)
            available['energy'] = known
            for i,row in enumerate(rows):
                if known[i] and self.settings.preference_weights['energy'] > 0:
                    relation = 'within' if low <= energies[i] <= high else 'outside'
                    facts[i].append(f'Source energy {energies[i]:.3f} is {relation} your {low:g}–{high:g} preference')
        instrumental = profile.get('instrumental_preference','any')
        if instrumental != 'any':
            instrumentalness = self.index.raw_numeric[:,NUMERIC.index('instrumentalness')]
            available['instrumental'] = np.isfinite(instrumentalness)
            values['instrumental'] = np.where(available['instrumental'],instrumentalness if instrumental == 'prefer' else 1-instrumentalness,0)
            for i,row in enumerate(rows):
                if available['instrumental'][i] and self.settings.preference_weights['instrumental'] > 0: facts[i].append(f'Source instrumentalness {instrumentalness[i]:.3f}; your preference is {instrumental}')
        numerator = np.zeros(size); denominator = np.zeros(size)
        for key,value in values.items():
            weight = self.settings.preference_weights[key]
            numerator += weight*value*available[key]; denominator += weight*available[key]
        scores = np.divide(numerator,denominator,out=np.full(size,np.nan),where=denominator>0)
        return scores,values,available,facts

    def recommend(self, *, seed_ids, liked_ids, disliked_ids, exclude_ids, profile, use_profile, include_liked, limit):
        unknown = set(seed_ids)-set(self.index.ids)
        if unknown: raise ValueError('Unknown seed track(s): '+', '.join(sorted(unknown)))
        seeds = list(dict.fromkeys(seed_ids or (liked_ids[:self.settings.maximum_liked_seeds] if use_profile else [])))
        content,pairs = self.index.similarities(seeds)
        preference,preference_values,preference_available,preference_facts = self.preferences(profile if use_profile else {})
        exclude = set(exclude_ids) | set(seed_ids)
        if use_profile:
            exclude |= set(disliked_ids)
            if not include_liked: exclude |= set(liked_ids)
        disliked_genres = {label(value) for value in profile.get('disliked_genres',[])} if use_profile else set()
        candidates = [i for i,row in enumerate(self.index.rows) if row['id'] not in exclude and not (set(genre_labels(row)) & disliked_genres)]
        scores = np.full(len(self.index.rows),np.nan)
        contributions = {}
        for key,values in [('content',content),('preference',preference)]:
            contributions[key] = np.where(np.isfinite(values),self.settings.ranking_weights[key],0.0)
        denominator = contributions['content']+contributions['preference']
        numerator = np.nan_to_num(content)*contributions['content']+np.nan_to_num(preference)*contributions['preference']
        np.divide(numerator,denominator,out=scores,where=denominator>0)
        fallback = not candidates or not any(np.isfinite(scores[i]) and scores[i] > 0 for i in candidates)
        notices = []
        if not candidates: notices.append('No eligible tracks remain after exclusions. Nothing was substituted or repeated.')
        if not seed_ids and use_profile and len(liked_ids) > len(seeds): notices.append(f'Using the {len(seeds)} most recently updated known likes out of {len(liked_ids)}.')
        if use_profile and profile.get('discovery_preference',0.5) != 0.5:
            notices.append('Familiarity/discovery blending is not used by this content-only model.')
        if fallback:
            selected = self.balanced(candidates,limit)
            notices.append('No usable positive taste signal: showing deterministic genre/artist-balanced discovery, not personalized scores.')
        else:
            selected = sorted(candidates,key=lambda i:(-float(scores[i]) if np.isfinite(scores[i]) else float('inf'),self.index.rows[i]['id']))[:limit]
        items = []
        for rank,i in enumerate(selected,1):
            reasons = ['Selected by the deterministic genre/artist-balanced fallback.'] if fallback else (list(preference_facts[i]) if contributions['preference'][i] > 0 else [])
            neighbor = None
            if not fallback and seeds and np.isfinite(content[i]) and contributions['content'][i] > 0:
                best = max(range(len(seeds)),key=lambda j:pairs[j].total[i] if np.isfinite(pairs[j].total[i]) else -1)
                neighbor = self.index.explain_pair(i,seeds[best],pairs[best])
                reasons.insert(0,f'Ranked by mean content similarity across {len(seeds)} seed(s); closest seed: {neighbor["seed_title"]}.')
                reasons.extend(neighbor['facts'])
            signals = []
            if not fallback:
                for key,values in [('content',content),('preference',preference)]:
                    if denominator[i] and np.isfinite(values[i]) and contributions[key][i] > 0:
                        weight = float(contributions[key][i]/denominator[i])
                        signals.append({'name':key,'value':float(values[i]),'weight':weight,'contribution':float(values[i]*weight)})
            if not reasons: reasons = ['Ranked using available explicit preference features; no genre or artist match was found.']
            items.append({'track_id':self.index.rows[i]['id'],'rank':rank,'score':None if fallback or not np.isfinite(scores[i]) else float(scores[i]),
                          'content_similarity':None if fallback or not np.isfinite(content[i]) else float(content[i]),
                          'preference_score':None if fallback or not np.isfinite(preference[i]) else float(preference[i]),
                          'signals':signals,'reasons':reasons,'nearest_seed':neighbor,
                          'unavailable_preference_features':[key for key in preference_values if not preference_available[key][i]]})
        return {'items':items,'fallback':fallback,'seed_ids':seeds,'eligible_tracks':len(candidates),'requested_count':limit,
                'returned_count':len(items),'notices':notices,'model':self.metadata()}

    def balanced(self, candidates, limit):
        groups = {}
        for i in sorted(candidates,key=lambda i:self.index.rows[i]['id']):
            groups.setdefault(self.index.rows[i].get('genre') or 'Unknown',[]).append(i)
        chosen=[]; artists=set()
        while len(chosen)<limit and any(groups.values()):
            for genre in sorted(groups):
                pool=groups[genre]
                if not pool: continue
                index=next((j for j,i in enumerate(pool) if self.index.artists[i] not in artists),0)
                candidate=pool.pop(index); chosen.append(candidate); artists.add(self.index.artists[candidate])
                if len(chosen)>=limit: break
        return chosen
