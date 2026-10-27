"""Full-cohort fixed multi-split artist benchmark; never evaluates track mood quality."""
import hashlib,json,math,sys
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'backend'))
from app.recommender.collaborative import ArtistKNN


def ranking_metrics(predicted,target,k=10):
    if len(predicted)!=len(set(predicted)):raise ValueError('Duplicate ranking identities')
    rank=predicted.index(target)+1 if target in predicted[:k] else None
    hit=int(rank is not None)
    return {'precision_at_10':hit/k,'recall_at_10':float(hit),'ndcg_at_10':1/math.log2(rank+1) if rank else 0.,'mrr_at_10':1/rank if rank else 0.}


def summarize(rows,items,fallbacks,pool):
    keys=list(rows[0])
    values=np.array([[row[key] for key in keys] for row in rows])
    # Paired-user resampling within each split; deterministic descriptive intervals.
    rng=np.random.default_rng(7027)
    means=np.array([values[rng.integers(0,len(rows),len(rows))].mean(axis=0) for _ in range(500)])
    return {'users':len(rows),'metrics':{key:float(values[:,i].mean()) for i,key in enumerate(keys)},
            'bootstrap_95pct':{key:[float(value) for value in np.quantile(means[:,i],[.025,.975])] for i,key in enumerate(keys)},
            'unique_recommended_artists':len(items),'candidate_coverage':len(items)/pool,'fallback_users':fallbacks}


def evaluate_split(full,seed):
    train=full.matrix.tolil(copy=True);heldout={}
    for row,user in enumerate(full.user_ids):
        columns=full.matrix[row].indices.tolist()
        if len(columns)<5:continue
        target=min(columns,key=lambda col:hashlib.sha256(f'{seed}:{user}:{full.artist_ids[col]}'.encode()).hexdigest())
        train[row,target]=0;heldout[row]=full.artist_ids[target]
    train=train.tocsr();train.eliminate_zeros()
    model=ArtistKNN(train,full.artist_ids,full.names,full.user_ids)
    scores={key:[] for key in ['user_knn','popularity']};unique={key:set() for key in scores};fallbacks=0;unseen=0
    groups={name:{key:[] for key in scores} for name in ['4–19 train artists','20–48 train artists','49+ train artists']}
    for row,target in heldout.items():
        columns=train[row].indices;seeds=[full.artist_ids[col] for col in columns]
        assert target not in seeds
        result=model.recommend(seeds,limit=10,exclude_user=full.user_ids[row]);predicted=[item['artist_id'] for item in result['items']]
        assert not set(predicted)&set(seeds)
        fallbacks+=result['fallback'];unseen+=model.popularity[model.columns[target]]==0
        popularity=model.popularity-train[row].toarray().ravel()
        candidates=np.flatnonzero(popularity>0).tolist();excluded=set(seeds)
        candidates=[i for i in candidates if full.artist_ids[i] not in excluded]
        candidates.sort(key=lambda i:(-popularity[i],full.artist_ids[i]))
        rankings={'user_knn':predicted,'popularity':[full.artist_ids[i] for i in candidates[:10]]}
        bucket='4–19 train artists' if len(seeds)<20 else '20–48 train artists' if len(seeds)<49 else '49+ train artists'
        for key,ranking in rankings.items():
            metrics=ranking_metrics(ranking,target);scores[key].append(metrics);unique[key].update(ranking);groups[bucket][key].append(metrics)
    pool=int(np.count_nonzero(model.popularity))
    return {'seed':seed,'model_version':model.version,'training_interactions':train.nnz,'evaluated_users':len(heldout),
            'cold_heldout_artists':int(unseen),'candidate_artists':pool,
            'models':{key:summarize(rows,unique[key],fallbacks if key=='user_knn' else 0,pool) for key,rows in scores.items()},
            'profile_groups':{group:{key:{'users':len(rows),'recall_at_10':sum(row['recall_at_10'] for row in rows)/len(rows)} for key,rows in models.items()} for group,models in groups.items() if models['user_knn']}}


def main():
    full=ArtistKNN.load(ROOT/'data/processed/lastfm')
    splits=[evaluate_split(full,seed) for seed in ['waveform-phase7-a','waveform-phase7-b']]
    report={'report_version':1,'dataset':'HetRec 2011 Last.fm','scope':'Separate historical artist benchmark; no measured track/content/context/hybrid relevance labels exist.',
            'source_archive_sha256':json.loads((ROOT/'data/catalogue/lastfm_provenance.json').read_text())['archive_sha256'],
            'full_model_version':full.version,'k':10,
            'protocol':'All users with >=5 positives; one SHA-256-selected held-out artist per user per split; all holdouts removed before fitting; train-only features/popularity; query user excluded from neighbors and baseline counts; known artists excluded.',
            'uncertainty':'500 fixed-seed user-bootstrap resamples per split, percentile 95% intervals. Splits reuse users and are not independent replicates; intervals are descriptive, not significance tests.',
            'splits':splits,'limitations':['Historical, non-commercial artist data; no verified catalogue track mapping.','No temporal order, explicit negatives or randomized user relevance judgments. Unobserved is not disliked.','Weights/k were frozen from Phase 6; no tuning on these holdouts. Candidate cold targets are retained as misses.','Confidence intervals do not capture dataset/split/selection bias; splits must not be pooled as independent users.'],
            'catalogue_metrics':{'relevance':'unavailable','reason':'No held-out track judgments or aligned collaborative interactions; live comparison shows descriptive overlap/diversity and actual contribution accounting only.'}}
    print(json.dumps(report,indent=2,ensure_ascii=False))


if __name__=='__main__':main()
