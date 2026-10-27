import pytest
from app.recommender.engine import ContentEngine
from app.recommender.context import ContextEngine
from app.recommender.hybrid import HybridEngine
from test_context import track
from test_workspace import api


def engine(): return HybridEngine(ContextEngine(ContentEngine([track('seed',.2,artist='A'),track('quiet',.2,artist='A'),track('loud',.9,artist='B')])))
def run(model,weights=None,**extra):
    args=dict(context={'energy_target':.9},seed_ids=['seed'],liked_ids=[],disliked_ids=[],exclude_ids=[],profile={},use_profile=False,include_liked=False,limit=2)
    args.update(extra)
    return model.recommend(weights=weights,**args)
def only(key): return {name:float(name==key) for name in ['content','preference','context','discovery','collaborative']}


def test_hybrid_weight_changes_rank_and_all_contributions_account():
    model=engine()
    content=run(model,only('content'));context=run(model,only('context'))
    assert content['items'][0]['track_id']=='quiet'
    assert context['items'][0]['track_id']=='loud'
    assert content['model']['model_version']!=context['model']['model_version']
    assert all('heuristic' not in reason for item in content['items'] for reason in item['reasons'])
    result=run(model)
    for item in result['items']:
        assert 0<=item['score']<=1
        assert item['score']==pytest.approx(sum(signal['contribution'] for signal in item['signals']))
        assert sum(signal['weight'] for signal in item['signals'])==pytest.approx(1)
        assert not any(signal['name']=='collaborative' for signal in item['signals'])
        assert 'collaborative' in item['unavailable_hybrid_signals']
    assert result==run(model)


def test_unavailable_collaborative_only_returns_unscored_balanced_fallback():
    result=run(engine(),only('collaborative'))
    assert result['fallback'] and all(item['score'] is None and item['signals']==[] for item in result['items'])
    assert result['model']['collaborative_status']['verified_track_mappings']==0
    assert result['model']['collaborative'] is False


def test_hybrid_preferences_exclusions_and_duration_stay_real():
    model=engine()
    result=run(model,only('preference'),use_profile=True,profile={'favorite_artists':['B']})
    assert result['items'][0]['track_id']=='loud'
    assert run(model,exclude_ids=['quiet','loud'])['items']==[]
    assert run(model,length_mode='duration',duration_minutes=1)['items']==[]
    assert run(model,length_mode='duration',duration_minutes=4)['length']['total_known_seconds']<=240


def test_hybrid_api_snapshot_and_comparison_are_separate_from_artist_experiment(api):
    request,_=api
    payload={'context':{'activity':'workout'},'limit':3,'weights':only('context')}
    response=request('POST','/api/recommendations/hybrid',json=payload)
    assert response.status_code==200,response.text
    generated=response.json()
    assert generated['model']['hybrid'] and generated['hybrid_weights']==only('context')
    history=request('GET','/api/recommendations/sessions/'+generated['session_id']).json()
    assert history['items']==generated['items'] and history['request']['weights']==only('context')
    before=request('GET','/api/library').json()['recommendation_sessions']
    assert before[0]['context']['kind']=='hybrid-generation'
    compared=request('POST','/api/recommendations/compare',json=payload)
    assert compared.status_code==200,compared.text
    data=compared.json()
    assert not data['recorded'] and set(data['results'])=={'content','context','hybrid'}
    assert all(result['session_id'] is None for result in data['results'].values())
    assert request('GET','/api/library').json()['recommendation_sessions']==before
    from app.services.catalogue import catalogue
    excluded=request('POST','/api/recommendations/compare',json={'exclude_ids':list(catalogue.records)})
    assert excluded.status_code==200,excluded.text
    assert all(not result['items'] for result in excluded.json()['results'].values())


def test_hybrid_invalid_weights_and_comparison_length_are_rejected(api):
    request,_=api
    for values in [{name:0 for name in only('content')},{'content':-1},{'unknown':1},{'context':2}]:
        assert request('POST','/api/recommendations/hybrid',json={'weights':values}).status_code==422
    assert request('POST','/api/recommendations/compare',json={'length_mode':'duration','duration_minutes':10}).status_code==422
