import json
from pathlib import Path
import numpy as np
import pytest
from app.recommender.engine import ContentEngine, EngineSettings
from app.recommender.features import FeatureIndex
from app.services.catalogue import catalogue
from test_workspace import api


def row(identifier,genre='Jazz',artist='Artist',tags=None,tempo=100,energy=.2):
    return {'id':identifier,'title':identifier,'artist':artist,'genre':genre,'genres':[genre] if genre else [],
            'tags':tags or [],'instruments':[],'duration_seconds':180,'bpm':tempo,'energy':energy,
            'valence':None,'acousticness':None,'instrumentalness':None}


def rank(engine,**overrides):
    params=dict(seed_ids=[],liked_ids=[],disliked_ids=[],exclude_ids=[],profile={},use_profile=True,include_liked=False,limit=10)
    params.update(overrides)
    return engine.recommend(**params)


def test_cosine_blocks_numeric_distance_and_missing_values():
    rows=[row('a',tags=['Piano']),row('b',tags=['Piano']),row('c',genre='Rock',artist='Other',tags=['Guitar'],tempo=180,energy=.9)]
    index=FeatureIndex(rows,{'genre':.4,'metadata':.25,'artist':.1,'numeric':.25})
    pair=index.pair_scores('a')
    assert pair.values['genre'][1] == pytest.approx(1)
    assert pair.values['metadata'][1] == pytest.approx(1)
    assert pair.values['genre'][2] == 0
    assert pair.total[1] > pair.total[2]
    # Missing source values stay missing and are not imputed into the numerical comparison.
    rows[1]['bpm']=None;rows[1]['energy']=None
    missing=FeatureIndex(rows,{'genre':.4,'metadata':.25,'artist':.1,'numeric':.25})
    assert not missing.known[1,1] and not missing.known[1,2]
    assert np.isnan(missing.raw_numeric[1,1])
    assert missing.pair_scores('a').shared_numeric[1] == 0  # Duration is constant, so it is dropped.


def test_empty_metadata_constant_features_and_invalid_numeric_values_do_not_crash():
    records=[row('a',genre='',artist='',tempo=None,energy=None),row('b',genre='',artist='',tempo=float('inf'),energy=5)]
    index=FeatureIndex(records,{'genre':.4,'metadata':.25,'artist':.1,'numeric':.25})
    assert not index.active_numeric.any()
    assert np.isnan(index.pair_scores('a').total).all()
    result=rank(ContentEngine(records),seed_ids=['a'],use_profile=False)
    assert result['fallback'] is True
    assert result['items'][0]['score'] is None


def test_likes_and_preferences_change_actual_ranking_and_exclusions_hold():
    engine=ContentEngine([row('jazz',artist='J'),row('near',artist='J'),row('rock',genre='Rock',artist='R',tempo=180,energy=.9)])
    liked=rank(engine,liked_ids=['jazz'])
    assert liked['items'][0]['track_id']=='near'
    assert 'jazz' not in [item['track_id'] for item in liked['items']]
    preferred=rank(engine,profile={'favorite_genres':['Rock']})
    assert preferred['items'][0]['track_id']=='rock'
    excluded=rank(engine,profile={'favorite_genres':['Rock'],'disliked_genres':['Jazz']},disliked_ids=['rock'])
    assert excluded['items']==[]
    energy=rank(engine,profile={'energy_min':.8,'energy_max':1})
    assert energy['items'][0]['track_id']=='rock'


def test_determinism_no_duplicates_and_contributions_reproduce_scores():
    engine=ContentEngine([row('a'),row('b'),row('c',genre='Rock',artist='R',tempo=160,energy=.8)])
    kwargs={'liked_ids':['a'],'profile':{'favorite_genres':['Jazz']}}
    first=rank(engine,**kwargs);second=rank(engine,**kwargs)
    assert first==second
    ids=[item['track_id'] for item in first['items']]
    assert len(ids)==len(set(ids))
    for item in first['items']:
        assert item['score']==pytest.approx(sum(signal['contribution'] for signal in item['signals']))
        assert sum(signal['weight'] for signal in item['signals'])==pytest.approx(1)
        assert item['reasons']


def test_cold_start_is_labeled_without_personalized_scores():
    engine=ContentEngine([row('a'),row('b',genre='Rock',artist='B'),row('c',genre='Folk',artist='C')])
    result=rank(engine)
    assert result['fallback']
    assert all(item['score'] is None and not item['signals'] for item in result['items'])
    assert result==rank(engine)
    assert {item['track_id'] for item in result['items']}=={'a','b','c'}


def test_zero_weight_signals_are_not_fabricated_in_explanations():
    config=json.loads(Path('backend/app/recommender/settings.json').read_text())
    config['ranking_weights']={'content':0,'preference':1}
    config['preference_weights']={'genres':0,'artists':1,'energy':0,'instrumental':0}
    engine=ContentEngine([row('a'),row('b')],EngineSettings.model_validate(config))
    result=rank(engine,seed_ids=['a'],profile={'favorite_genres':['Jazz'],'favorite_artists':['Artist']})
    reasons=result['items'][0]['reasons']
    assert reasons==['Favorite artist: Artist']
    with pytest.raises(ValueError):
        config['content_weights']['genre']=-1
        EngineSettings.model_validate(config)


def test_api_generates_and_records_only_real_successful_results(api):
    request,_=api
    first=request('POST','/api/recommendations',json={'limit':5,'use_profile':False})
    assert first.status_code==200,first.text
    result=first.json()
    assert result['fallback'] is True and len(result['items'])==5
    assert result['session_id'] and result['created_at']
    assert all(catalogue.get(item['track_id']) for item in result['items'])
    history=request('GET','/api/recommendations/sessions/'+result['session_id']).json()
    assert history['items']==result['items'] and history['historical']
    assert history['session_id']==result['session_id'] and history['created_at']==result['created_at']
    from app.models.workspace import RecommendationSession
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    _, path = api
    check_engine=create_engine(f'sqlite:///{path}')
    with Session(check_engine) as db:
        stored=db.get(RecommendationSession,result['session_id']).context['result']
        assert stored['session_id']==result['session_id'] and stored['created_at']==result['created_at']
    check_engine.dispose()
    assert len(request('GET','/api/library').json()['recommendation_sessions'])==1
    assert request('POST','/api/recommendations',json={'seed_ids':['unknown']}).status_code==422
    assert len(request('GET','/api/library').json()['recommendation_sessions'])==1


def test_api_seed_exclusion_count_bounds_and_model_metadata(api):
    request,_=api
    seed='USUAN1500027'
    data=request('POST','/api/recommendations',json={'seed_ids':[seed],'use_profile':False,'limit':6}).json()
    assert len(data['items'])==6 and all(item['track_id']!=seed for item in data['items'])
    assert not data['fallback'] and data['model']['context_aware'] is False
    assert request('POST','/api/recommendations',json={'limit':0}).status_code==422
    assert request('POST','/api/recommendations',json={'limit':31}).status_code==422
    assert request('POST','/api/recommendations',json={'mood':'calm'}).status_code==422
    before=len(request('GET','/api/library').json()['recommendation_sessions'])
    request('GET','/api/profile')
    profile=request('GET','/api/profile').json()
    profile['disliked_genres']=sorted({record.genre for record in catalogue.records.values()})
    assert request('PUT','/api/profile',json=profile).status_code==200
    empty=request('POST','/api/recommendations',json={'limit':5}).json()
    assert empty['items']==[] and empty['session_id'] is None
    assert len(request('GET','/api/library').json()['recommendation_sessions'])==before
    assert request('GET','/api/recommendations/sessions/missing').status_code==404
    model=request('GET','/api/recommendations/model').json()
    assert model['catalogue_tracks']==520
    assert model['numeric_coverage']['energy']['known']==512
    assert model['numeric_coverage']['energy']['missing']==8
    assert model['collaborative'] is False


def test_fma_export_import_keeps_exact_dataset_identity(api):
    request,_=api
    item=next(record for record in catalogue.records.values() if record.id.startswith('fma-'))
    track=catalogue.get(item.id).model_dump(mode='json')
    assert track['isrc'] is None
    for format in ['csv','txt','json']:
        exported=request('POST',f'/api/playlist-export?format={format}',json={'title':'FMA identity','tracks':[track]})
        preview=request('POST','/api/playlist-import',json={'format':format,'content':exported.text})
        assert preview.status_code==200,preview.text
        restored=preview.json()['playlist']['tracks'][0]
        assert restored['catalogue_id']==track['id'] and restored['isrc'] is None
        assert restored['license_scope']=='metadata'


def test_dataset_snapshot_and_known_original_records_are_preserved():
    import hashlib
    provenance=json.loads(Path('data/catalogue/fma_provenance.json').read_text())
    assert hashlib.sha256(Path('data/catalogue/fma.json').read_bytes()).hexdigest()==provenance['snapshot_sha256']
    assert provenance['selected_tracks']==512 and provenance['artists']==367
    assert catalogue.get('USUAN1500027').artist=='Kevin MacLeod'
    assert len(catalogue.records)==520
