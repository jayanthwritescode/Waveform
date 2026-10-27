"""Observed-only content features: categorical/text cosine and numeric distance."""
from dataclasses import dataclass
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MultiLabelBinarizer, normalize

NUMERIC = ('duration_seconds', 'bpm', 'energy', 'valence', 'acousticness', 'instrumentalness')
BOUNDS = {'duration_seconds':(0,86400), 'bpm':(0,1000), **{key:(0,1) for key in NUMERIC[2:]}}


def label(value):
    return ' '.join(str(value or '').casefold().split())


def genre_labels(row):
    return sorted({label(value) for value in (row.get('genres') or [row.get('genre')]) if label(value)})


def metadata_tokens(row):
    return sorted({f'{field}:{label(value)}' for field in ('tags','instruments')
                   for value in (row.get(field) or []) if label(value)})


@dataclass
class PairScores:
    values: dict
    available: dict
    total: np.ndarray
    shared_numeric: np.ndarray


class FeatureIndex:
    def __init__(self, rows, weights, numeric_gamma=4.0):
        if not rows or len({row['id'] for row in rows}) != len(rows):
            raise ValueError('Feature rows must be nonempty and have unique IDs')
        self.rows = rows
        self.ids = {row['id']:index for index,row in enumerate(rows)}
        self.weights = weights
        self.gamma = numeric_gamma
        self.genres = [genre_labels(row) for row in rows]
        self.tokens = [metadata_tokens(row) for row in rows]
        self.artists = np.array([label(row.get('artist')) for row in rows])
        self.genre_encoder = MultiLabelBinarizer(sparse_output=True)
        encoded = self.genre_encoder.fit_transform(self.genres).astype(float)
        self.genre_matrix = normalize(encoded) if encoded.shape[1] else csr_matrix((len(rows),0),dtype=float)
        self.vectorizer = None
        if any(self.tokens):
            self.vectorizer = TfidfVectorizer(analyzer=lambda tokens:tokens, lowercase=False, norm='l2')
            self.text_matrix = self.vectorizer.fit_transform(self.tokens)
        else:
            self.text_matrix = csr_matrix((len(rows),0),dtype=float)
        frame = pd.DataFrame([{key:row.get(key) for key in NUMERIC} for row in rows],columns=NUMERIC)
        frame = frame.apply(pd.to_numeric,errors='coerce').replace([np.inf,-np.inf],np.nan)
        for key,(low,high) in BOUNDS.items():
            valid = frame[key].between(low,high,inclusive='both')
            if key in ('duration_seconds','bpm'): valid &= frame[key].gt(0)
            frame.loc[~valid,key] = np.nan
        self.raw_numeric = frame.to_numpy(dtype=float)
        self.lower = frame.quantile(0.05).to_numpy(dtype=float)
        self.upper = frame.quantile(0.95).to_numpy(dtype=float)
        self.active_numeric = np.isfinite(self.lower) & np.isfinite(self.upper) & (self.upper > self.lower)
        self.known = np.isfinite(self.raw_numeric) & self.active_numeric
        self.scaled = np.zeros_like(self.raw_numeric)
        np.divide(self.raw_numeric-self.lower,self.upper-self.lower,
                  out=self.scaled,where=self.known)
        self.scaled = np.clip(np.nan_to_num(self.scaled),0,1)
        self.coverage = {key:{'known':int(frame[key].notna().sum()), 'missing':int(frame[key].isna().sum()),
                              'used':bool(self.active_numeric[i]),
                              'lower_5pct':float(self.lower[i]) if self.active_numeric[i] else None,
                              'upper_95pct':float(self.upper[i]) if self.active_numeric[i] else None}
                         for i,key in enumerate(NUMERIC)}

    def pair_scores(self, seed_id):
        index = self.ids[seed_id]
        genre_available = np.array([bool(values) and bool(self.genres[index]) for values in self.genres])
        text_available = np.array([bool(values) and bool(self.tokens[index]) for values in self.tokens])
        shared = self.known & self.known[index]
        counts = shared.sum(axis=1)
        squared = np.sum(np.where(shared,(self.scaled-self.scaled[index])**2,0),axis=1)
        distance = np.divide(squared,counts,out=np.zeros(len(self.rows)),where=counts>0)
        values = {
            'genre':np.asarray((self.genre_matrix @ self.genre_matrix[index].T).toarray()).ravel(),
            'metadata':np.asarray((self.text_matrix @ self.text_matrix[index].T).toarray()).ravel(),
            'artist':(self.artists == self.artists[index]).astype(float),
            'numeric':np.exp(-self.gamma*distance),
        }
        available = {'genre':genre_available, 'metadata':text_available,
                     'artist':(self.artists != '') & (self.artists[index] != ''), 'numeric':counts>0}
        numerator = np.zeros(len(self.rows)); denominator = np.zeros(len(self.rows))
        for key,weight in self.weights.items():
            numerator += weight*values[key]*available[key]
            denominator += weight*available[key]
        total = np.divide(numerator,denominator,out=np.full(len(self.rows),np.nan),where=denominator>0)
        return PairScores(values,available,np.clip(total,0,1),counts)

    def similarities(self, seed_ids):
        pairs = [self.pair_scores(seed) for seed in seed_ids]
        if not pairs: return np.full(len(self.rows),np.nan),pairs
        matrix = np.vstack([pair.total for pair in pairs])
        counts = np.isfinite(matrix).sum(axis=0)
        return np.divide(np.nansum(matrix,axis=0),counts,out=np.full(len(self.rows),np.nan),where=counts>0),pairs

    def explain_pair(self, candidate, seed, pair):
        index = self.ids[seed]
        facts = []
        shared_genres = sorted(set(self.genres[candidate]) & set(self.genres[index]))
        if shared_genres and self.weights['genre'] > 0: facts.append('Shared source genre(s): '+', '.join(shared_genres))
        shared_tokens = sorted(set(self.tokens[candidate]) & set(self.tokens[index]))
        if shared_tokens and self.weights['metadata'] > 0: facts.append('Shared source labels: '+', '.join(token.split(':',1)[1] for token in shared_tokens[:4]))
        if self.weights['artist'] > 0 and self.artists[candidate] and self.artists[candidate] == self.artists[index]:
            facts.append('Same artist: '+self.rows[candidate]['artist'])
        near = []
        for column,key in enumerate(NUMERIC):
            if self.known[candidate,column] and self.known[index,column] and abs(self.scaled[candidate,column]-self.scaled[index,column]) <= 0.15:
                near.append(f'{key}: {self.raw_numeric[candidate,column]:g} vs {self.raw_numeric[index,column]:g}')
        if near and self.weights['numeric'] > 0: facts.append('Nearby source values ('+'; '.join(near[:2])+')')
        return {'seed_id':seed, 'seed_title':self.rows[index]['title'], 'facts':facts,
                'shared_numeric_features':int(pair.shared_numeric[candidate]),
                'components':{key:float(pair.values[key][candidate]) for key in pair.values if pair.available[key][candidate]}}
