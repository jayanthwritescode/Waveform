"""Separate HetRec artist experiment: binary cosine user-neighborhood model."""
import hashlib
import json
import numpy as np
from scipy.sparse import csr_matrix, load_npz
from sklearn.preprocessing import normalize


class ArtistKNN:
    def __init__(self, matrix, artist_ids, names, user_ids, neighbors=40, minimum_support=2):
        self.matrix=csr_matrix(matrix,dtype=float)
        if self.matrix.shape!=(len(user_ids),len(artist_ids)) or not self.matrix.nnz or not np.all(self.matrix.data==1):
            raise ValueError('Artist model requires a nonempty binary interaction matrix with aligned identities')
        if len(set(artist_ids))!=len(artist_ids) or len(set(user_ids))!=len(user_ids): raise ValueError('Duplicate experiment IDs')
        if any(not isinstance(names.get(str(value)),str) or not names[str(value)].strip() for value in artist_ids): raise ValueError('Missing artist source labels')
        self.artist_ids=list(artist_ids); self.names=names; self.user_ids=list(user_ids)
        self.columns={identifier:i for i,identifier in enumerate(artist_ids)}
        self.normalized=normalize(self.matrix); self.popularity=np.asarray(self.matrix.sum(axis=0)).ravel()
        self.neighbors=neighbors; self.minimum_support=minimum_support
        digest=hashlib.sha256(self.matrix.indptr.tobytes()+self.matrix.indices.tobytes()+json.dumps([artist_ids,user_ids,neighbors,minimum_support]).encode()).hexdigest()[:12]
        self.version='artist-userknn-v1-'+digest

    def metadata(self):
        return {'available':True,'model_name':'HetRec artist user-KNN','model_version':self.version,'users':len(self.user_ids),
                'artists':len(self.artist_ids),'positive_interactions':self.matrix.nnz,'neighbors':self.neighbors,'minimum_neighbor_support':self.minimum_support,
                'scope':'Separate artist-level non-commercial research experiment; not the playlist track catalogue',
                'license':'HetRec Last.fm data: non-commercial use; contact Last.fm for commercial use',
                'source':'https://lenskit.grouplens.org/datasets/hetrec-2011/','collaborative_track_mapping':False}

    def recommend(self, seed_ids, limit=10, exclude_ids=(), exclude_user=None):
        unknown=set(seed_ids)-set(self.columns)
        if unknown: raise ValueError('Unknown experiment artist ID(s): '+', '.join(map(str,sorted(unknown))))
        seeds=sorted(set(seed_ids)); excluded=set(exclude_ids)|set(seeds)
        similarities=np.zeros(len(self.user_ids))
        if seeds:
            columns=[self.columns[value] for value in seeds]
            similarities=np.asarray(self.normalized[:,columns].sum(axis=1)).ravel()/np.sqrt(len(columns))
        if exclude_user is not None and exclude_user in self.user_ids: similarities[self.user_ids.index(exclude_user)]=0
        neighbors=sorted((i for i,value in enumerate(similarities) if value>0),key=lambda i:(-similarities[i],self.user_ids[i]))[:self.neighbors]
        scores=np.zeros(len(self.artist_ids)); support=np.zeros(len(self.artist_ids))
        if neighbors:
            scores=np.asarray(self.matrix[neighbors].T @ similarities[neighbors]).ravel()/sum(similarities[neighbors])
            support=np.asarray(self.matrix[neighbors].sum(axis=0)).ravel()
        candidates=[i for i,value in enumerate(scores) if value>0 and support[i]>=self.minimum_support and self.artist_ids[i] not in excluded]
        fallback=not candidates
        if fallback:
            popularity=self.popularity.copy()
            if exclude_user is not None and exclude_user in self.user_ids: popularity-=self.matrix[self.user_ids.index(exclude_user)].toarray().ravel()
            candidates=[i for i,value in enumerate(popularity) if value>0 and self.artist_ids[i] not in excluded]
            candidates.sort(key=lambda i:(-popularity[i],self.artist_ids[i]))
        else: candidates.sort(key=lambda i:(-scores[i],self.artist_ids[i]))
        return {'items':[{'artist_id':self.artist_ids[i],'name':self.names[str(self.artist_ids[i])],
                          'score':None if fallback else float(scores[i]),'neighbor_support':int(support[i]) if not fallback else None,
                          'reason':'Training-set artist popularity fallback; no personalized collaborative score.' if fallback else f'Weighted co-occurrence among {len(neighbors)} similar training profiles; {int(support[i])} support this artist.'}
                         for i in candidates[:limit]],'fallback':fallback,'seed_ids':seeds,'neighbor_count':len(neighbors),
                'model':self.metadata(),'score_meaning':'Weighted fraction of selected neighbors with this artist; not a probability of liking it',
                'recorded':False,'notices':['Artist results cannot be inserted as playlist tracks. No artist-to-track mapping or listening history for you is inferred.']}

    @classmethod
    def load(cls, folder):
        meta=json.loads((folder/'model.json').read_text())
        raw=folder/'interactions.npz'
        if hashlib.sha256(raw.read_bytes()).hexdigest()!=meta['matrix_sha256']: raise ValueError('Artist artifact checksum mismatch')
        model=cls(load_npz(raw),meta['artist_ids'],meta['names'],meta['user_ids'])
        if model.version!=meta['model_version']: raise ValueError('Artist artifact identity mismatch')
        return model
