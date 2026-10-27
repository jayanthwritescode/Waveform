"""Fixed held-out artist experiment against a train-only popularity baseline."""
import hashlib
import json
import math
from pathlib import Path
import sys
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'backend'))
from app.recommender.collaborative import ArtistKNN


def main():
    full=ArtistKNN.load(ROOT/'data/processed/lastfm')
    train=full.matrix.tolil(copy=True);heldout={}
    for row,user in enumerate(full.user_ids):
        columns=full.matrix[row].indices.tolist()
        if len(columns)<5: continue
        hidden=min(columns,key=lambda column:hashlib.sha256(f'waveform-phase6:{user}:{full.artist_ids[column]}'.encode()).hexdigest())
        train[row,hidden]=0;heldout[user]=full.artist_ids[hidden]
    train=train.tocsr();train.eliminate_zeros()
    model=ArtistKNN(train,full.artist_ids,full.names,full.user_ids)
    cohort=sorted(heldout,key=lambda user:hashlib.sha256(f'cohort:{user}'.encode()).hexdigest())[:100]
    hits=0;ndcg=0;baseline_hits=0;baseline_ndcg=0;fallbacks=0;coverage=set()
    for user in cohort:
        row=full.user_ids.index(user)
        seeds=[full.artist_ids[column] for column in train[row].indices]
        assert heldout[user] not in seeds
        result=model.recommend(seeds,limit=10,exclude_user=user)
        ids=[item['artist_id'] for item in result['items']]
        assert len(ids)==len(set(ids)) and not set(ids)&set(seeds)
        fallbacks+=result['fallback'];coverage.update(ids)
        if heldout[user] in ids:
            hits+=1;ndcg+=1/math.log2(ids.index(heldout[user])+2)
        popularity=model.popularity-train[row].toarray().ravel()
        candidates=[i for i,value in enumerate(popularity) if value>0 and full.artist_ids[i] not in seeds]
        candidates.sort(key=lambda i:(-popularity[i],full.artist_ids[i]))
        baseline=[full.artist_ids[i] for i in candidates[:10]]
        if heldout[user] in baseline:
            baseline_hits+=1;baseline_ndcg+=1/math.log2(baseline.index(heldout[user])+2)
    report={'dataset':'HetRec 2011 Last.fm user-artist interactions','scope':'Separate artist experiment; these metrics do not evaluate Waveform track playlists',
            'protocol':'One SHA-256-selected artist held out for every user with >=5 positives; fixed SHA-256 cohort of 100 users; train-only features/popularity; query user excluded from neighbors',
            'training_interactions':train.nnz,'heldout_users':len(heldout),'evaluated_users':len(cohort),'k':10,
            'user_knn':{'hit_rate_at_10':hits/len(cohort),'ndcg_at_10':ndcg/len(cohort),'unique_recommended_artists':len(coverage),'fallback_users':fallbacks},
            'popularity':{'hit_rate_at_10':baseline_hits/len(cohort),'ndcg_at_10':baseline_ndcg/len(cohort)},
            'model_version':model.version,'limitations':['Small fixed cohort, one positive per user, no negatives or temporal split; unobserved does not mean disliked.','Historical artist benchmark, no verified track mapping, no tuning/test separation study or track-quality claim.']}
    print(json.dumps(report,indent=2)+'\n')


if __name__=='__main__': main()
