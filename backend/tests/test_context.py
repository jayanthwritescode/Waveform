import math
import pytest
from app.recommender.context import ContextEngine
from app.recommender.engine import ContentEngine
from test_workspace import api


def track(identifier,energy,*,valence=.5,tempo=100,acoustic=.5,instrumental=.5,artist='Artist',duration=180):
    return dict(id=identifier,title=identifier,artist=artist,genre='Jazz',genres=['Jazz'],tags=[],instruments=[],
                energy=energy,valence=valence,bpm=tempo,acousticness=acoustic,instrumentalness=instrumental,duration_seconds=duration)


def run(engine,context=None,**overrides):
    arguments=dict(seed_ids=[],liked_ids=[],disliked_ids=[],exclude_ids=[],profile={},use_profile=True,include_liked=False,limit=3)
    arguments.update(overrides)
    return engine.recommend(context=context or {},**arguments)


def test_mood_activity_and_explicit_energy_change_rank_with_same_genre():
    engine=ContextEngine(ContentEngine([track('quiet',.2,tempo=75),track('mid',.5),track('loud',.9,tempo=140)]))
    assert run(engine,{'mood':'calm'})['items'][0]['track_id']=='quiet'
    assert run(engine,{'mood':'energetic'})['items'][0]['track_id']=='loud'
    assert run(engine,{'activity':'relax'})['items'][0]['track_id']=='quiet'
    assert run(engine,{'activity':'workout'})['items'][0]['track_id']=='loud'
    result=run(engine,{'mood':'calm','energy_target':.9})
    assert result['items'][0]['track_id']=='loud'
    assert not any(signal['name']=='mood calm: energy' for signal in result['items'][0]['context_signals'])
    assert any(signal['name']=='Moment energy: energy' for signal in result['items'][0]['context_signals'])


def test_time_weather_and_instrumental_are_real_numeric_signals():
    engine=ContextEngine(ContentEngine([track('rain',.3,valence=.4,tempo=75,acoustic=.65,instrumental=.95),
                                       track('sun',.6,valence=.75,tempo=120,acoustic=.1,instrumental=.05)]))
    assert run(engine,{'weather':'rainy'})['items'][0]['track_id']=='rain'
    assert run(engine,{'weather':'clear'})['items'][0]['track_id']=='sun'
    assert run(engine,{'time_of_day':'night'})['items'][0]['track_id']=='rain'
    assert run(engine,{'time_of_day':'morning'})['items'][0]['track_id']=='sun'
    assert run(engine,{'instrumental_preference':'prefer'})['items'][0]['track_id']=='rain'
    assert run(engine,{'instrumental_preference':'avoid'})['items'][0]['track_id']=='sun'


def test_missing_context_values_stay_unknown_and_contributions_reproduce_scores():
    engine=ContextEngine(ContentEngine([track('known',.2),track('unknown',None,valence=None,acoustic=None)]))
    result=run(engine,{'mood':'calm'})
    unknown=next(item for item in result['items'] if item['track_id']=='unknown')
    assert unknown['score'] is None and not unknown['context_signals']
    assert len(unknown['unavailable_context_features'])==3
    assert engine.index.rows[1]['energy'] is None
    known=result['items'][0]
    assert known['score']==pytest.approx(sum(signal['contribution'] for signal in known['signals']))
    assert sum(signal['contribution'] for signal in known['context_signals'])==pytest.approx(known['signals'][0]['value'])
    assert sum(signal['weight'] for signal in known['context_signals'])==pytest.approx(1)
    assert run(engine,{'mood':'calm'})==result
    assert run(engine)['fallback']
    assert all(item['score'] is None for item in run(engine)['items'])


def test_discovery_uses_catalogue_familiarity_and_saved_slider_only_with_known_taste():
    engine=ContextEngine(ContentEngine([track('liked',.5,artist='Familiar'),track('familiar',.5,artist='Familiar'),track('new',.5,artist='Other')]))
    familiar=run(engine,{'discovery':0},liked_ids=['liked'])
    novel=run(engine,{'discovery':1},liked_ids=['liked'])
    assert familiar['items'][0]['track_id']=='familiar'
    assert novel['items'][0]['track_id']=='new'
    assert run(engine,{'discovery':0},liked_ids=['liked'])['items'][0]['track_id']=='familiar'
    assert run(engine,{'discovery':1},liked_ids=['liked'])['items'][0]['track_id']=='new'
    assert run(engine,liked_ids=['liked'],profile={'discovery_preference':1})['items'][0]['track_id']=='new'
    cold=run(engine,{'discovery':1},use_profile=False,liked_ids=['liked'])
    assert cold['fallback'] and any('omitted' in notice for notice in cold['notices'])
    assert any('does not prove' in reason for reason in novel['items'][0]['reasons'])


def test_duration_budget_count_cap_and_unfillable_targets_never_overshoot():
    engine=ContextEngine(ContentEngine([track('a',.2,duration=180),track('b',.3,duration=100),track('c',.4,duration=80),track('d',.5,duration=None)]))
    result=run(engine,{'energy_target':.2},length_mode='duration',duration_minutes=4,limit=3)
    assert result['length']['total_known_seconds']<=240
    assert result['length']['remaining_seconds']==60
    assert [item['track_id'] for item in result['items']]==['a']
    assert 'd' not in [item['track_id'] for item in result['items']]
    assert len(run(engine,{'energy_target':.2},length_mode='duration',duration_minutes=10,limit=1)['items'])==1
    empty=run(engine,{'energy_target':.2},length_mode='duration',duration_minutes=1)
    assert empty['items']==[] and empty['length']['remaining_seconds']==60
    assert run(engine,limit=4)['length']['unknown_duration_tracks']==1


def test_moment_preferences_are_soft_but_dislikes_and_exclusions_are_hard():
    rows=[track('a',.5,artist='A'),track('b',.5,artist='B'),track('c',.5,artist='C')]
    rows[1]['genres']=['Rock'];rows[1]['genre']='Rock'
    engine=ContextEngine(ContentEngine(rows))
    assert run(engine,{'favorite_artists':['B']})['items'][0]['track_id']=='b'
    assert run(engine,{'favorite_genres':['Rock']})['items'][0]['track_id']=='b'
    result=run(engine,{'favorite_artists':['B']},profile={'disliked_genres':['Rock']},exclude_ids=['a'],disliked_ids=['c'])
    assert result['items']==[]


def test_context_api_records_exact_context_and_regenerates_without_repeats(api):
    request,_=api
    payload={'context':{'mood':'calm','activity':'focus','weather':'rainy'},'limit':5}
    first=request('POST','/api/recommendations/context',json=payload)
    assert first.status_code==200,first.text
    data=first.json()
    assert len(data['items'])==5 and data['model']['context_aware']
    assert data['model']['collaborative'] is False
    assert any(signal['name']=='context' for signal in data['items'][0]['signals'])
    ids=[item['track_id'] for item in data['items']]
    again=request('POST','/api/recommendations/context',json={**payload,'exclude_ids':ids}).json()
    assert len(again['items'])==5 and not set(ids)&{item['track_id'] for item in again['items']}
    before=len(request('GET','/api/library').json()['recommendation_sessions'])
    history=request('GET','/api/recommendations/sessions/'+data['session_id']).json()
    assert history['request']['context']['weather']=='rainy'
    assert history['items']==data['items'] and history['created_at']==data['created_at']
    sessions=request('GET','/api/library').json()['recommendation_sessions']
    assert len(sessions)==before and sessions[0]['context']['kind']=='context-generation'
    model=request('GET','/api/recommendations/context/model').json()
    assert model['context_rules']['mood']['calm']['energy']==.2


def test_context_api_length_validation_and_empty_generation_does_not_record(api):
    request,_=api
    for payload in [{'context':{'mood':'invented'}},{'context':{'weather':'live'}},{'context':{'energy_target':2}},
                    {'context':{'discovery':-1}},{'context':{'location':'secret'}},{'length_mode':'duration'},
                    {'duration_minutes':5},{'length_mode':'duration','duration_minutes':181}]:
        assert request('POST','/api/recommendations/context',json=payload).status_code==422
    result=request('POST','/api/recommendations/context',json={'context':{'mood':'calm'},'length_mode':'duration','duration_minutes':1}).json()
    assert result['length']['total_known_seconds']<=60
    # A synthetic all-excluded fixture above covers the engine; real source 1-minute tracks may exist.
    assert len({item['track_id'] for item in result['items']})==len(result['items'])


def test_empty_context_session_and_saved_negative_preferences(api):
    from app.services.catalogue import catalogue
    request,_=api
    profile=request('GET','/api/profile').json()
    profile['disliked_genres']=sorted({record.genre for record in catalogue.records.values()})
    assert request('PUT','/api/profile',json=profile).status_code==200
    result=request('POST','/api/recommendations/context',json={'context':{'mood':'happy','favorite_genres':['Jazz']}}).json()
    assert result['items']==[] and result['session_id'] is None
    assert request('GET','/api/library').json()['recommendation_sessions']==[]


def test_partial_evidence_cannot_claim_full_context_fit():
    engine=ContextEngine(ContentEngine([track('complete',.35,tempo=95,instrumental=.95),
                                       track('partial',None,tempo=95,instrumental=None)]))
    result=run(engine,{'activity':'focus'})
    assert result['items'][0]['track_id']=='complete'
    partial=result['items'][1]
    assert partial['context_coverage']==pytest.approx(1/3)
    assert partial['score']==pytest.approx(1/3)
    assert partial['score']==pytest.approx(sum(signal['contribution'] for signal in partial['context_signals']))
    assert len(partial['unavailable_context_features'])==2
