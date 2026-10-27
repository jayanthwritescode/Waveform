import numpy as np
import pytest
from scipy.sparse import csr_matrix
from app.recommender.collaborative import ArtistKNN
from app.api import experiments
from test_workspace import api


def model():
    return ArtistKNN(csr_matrix([[1,1,0,0],[1,1,0,0],[0,0,1,1]],dtype=float),[11,22,33,44],{'11':'A','22':'B','33':'C','44':'D'},[100,200,300],neighbors=40,minimum_support=2)


def test_user_neighborhood_uses_real_cooccurrence_and_excludes_seeds():
    result=model().recommend([11])
    assert not result['fallback'] and result['neighbor_count']==2
    assert [item['artist_id'] for item in result['items']]==[22]
    assert result['items'][0]['score']==pytest.approx(1)
    assert result['items'][0]['neighbor_support']==2
    assert result==model().recommend([11])
    assert model().recommend([11],exclude_ids=[22])['fallback']


def test_no_profile_and_low_support_are_honest_popularity_fallbacks():
    for seeds in [[],[33]]:
        result=model().recommend(seeds)
        assert result['fallback'] and all(item['score'] is None for item in result['items'])
        assert not set(seeds)&{item['artist_id'] for item in result['items']}
    assert model().recommend([],exclude_ids=[11,22,33,44])['items']==[]
    with pytest.raises(ValueError): model().recommend([999])


def test_evaluation_excludes_query_user_and_is_not_self_retrieval():
    result=model().recommend([11],exclude_user=100)
    assert result['neighbor_count']==1 and result['fallback']
    # Only one remaining supporting neighbor cannot pass the two-neighbor threshold.
    with pytest.raises(ValueError): ArtistKNN(csr_matrix([[2]]),[1],{'1':'A'},[1])


def test_artist_api_keeps_experiment_ids_out_of_tracks_and_workspace(api,monkeypatch):
    request,_=api;monkeypatch.setattr(experiments,'experiment',model)
    metadata=request('GET','/api/experiments/collaborative/model').json()
    assert metadata['available'] and not metadata['collaborative_track_mapping']
    assert request('GET','/api/experiments/collaborative/artists?q=B').json()['items']==[{'artist_id':22,'name':'B'}]
    response=request('POST','/api/experiments/collaborative',json={'seed_ids':[11]})
    assert response.status_code==200 and response.json()['items'][0]['artist_id']==22
    assert request('GET','/api/library').json()['recommendation_sessions']==[]
    assert request('POST','/api/experiments/collaborative',json={'seed_ids':[999]}).status_code==422
    assert request('POST','/api/experiments/collaborative',json={'seed_ids':[11],'track_ids':['fma-000134']}).status_code==422


def test_missing_experiment_does_not_disable_catalogue(api,monkeypatch):
    request,_=api;monkeypatch.setattr(experiments,'experiment',lambda:None)
    assert request('GET','/api/experiments/collaborative/model').json()['available'] is False
    assert request('POST','/api/experiments/collaborative',json={}).status_code==503
    assert request('POST','/api/recommendations/hybrid',json={'context':{'mood':'calm'},'limit':3}).status_code==200
