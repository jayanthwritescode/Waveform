from datetime import datetime,timezone
import importlib.util
from pathlib import Path
import math
import pytest
from sqlalchemy.orm import Session
from app.database.core import build_engine
from app.models.workspace import RecommendationSession,Profile
from app.services.insights import taste_insights
from app.services.catalogue import catalogue
from test_workspace import api


def test_empty_insights_are_true_zero_unknown_and_read_only(api):
    request,path=api
    for _ in range(2):
        response=request('GET','/api/insights?days=7');assert response.status_code==200,response.text
        data=response.json()
        assert data['totals']['saved_playlists']==data['totals']['likes']==data['totals']['generations_all_time']==0
        assert data['liked_source_energy']['mean'] is None and data['current_preferences'] is None
        assert len(data['daily_generations'])==7 and all(row['count']==0 for row in data['daily_generations'])
    engine=build_engine(f'sqlite:///{path}')
    with Session(engine) as db:assert db.get(Profile,1) is None
    engine.dispose()
    for days in [1,8,365,'invalid']:
        assert request('GET',f'/api/insights?days={days}').status_code==422


def test_current_feedback_and_saved_occurrences_have_distinct_denominators(api):
    request,_=api
    original=catalogue.get('USUAN1500027').model_dump(mode='json')
    featured=catalogue.get('fma-000134').model_dump(mode='json')
    request('PUT','/api/feedback/'+original['id'],json={'value':'like'})
    request('PUT','/api/feedback/'+featured['id'],json={'value':'like'})
    for title in ['First','Second']:
        assert request('POST','/api/playlists',json={'title':title,'tracks':[original,featured]}).status_code==201
    data=request('GET','/api/insights').json()
    assert data['totals']['saved_track_occurrences']==4 and data['totals']['unique_saved_identities']==2
    assert data['liked_source_energy']['known']==1 and data['liked_source_energy']['missing']==1
    assert data['liked_source_energy']['mean']==pytest.approx(featured['energy'])
    assert data['saved_snapshot_energy']['known']==2 and data['saved_snapshot_energy']['missing']==2
    assert sum(row['count'] for row in data['saved_genres'])==4
    request('PUT','/api/feedback/'+original['id'],json={'value':'dislike'})
    changed=request('GET','/api/insights').json()
    assert changed['totals']['likes']==1 and changed['totals']['dislikes']==1
    request('PUT','/api/feedback/'+featured['id'],json={'value':None})
    assert request('GET','/api/insights').json()['liked_source_energy']['mean'] is None


def test_real_context_sessions_count_but_comparison_and_saves_do_not(api):
    request,_=api
    for _ in range(2):
        assert request('POST','/api/recommendations/hybrid',json={'context':{'mood':'calm','activity':'focus'},'limit':3}).status_code==200
    assert request('POST','/api/recommendations/compare',json={'limit':3}).status_code==200
    data=request('GET','/api/insights').json()
    assert data['totals']['generations_in_window']==2 and data['totals']['recommended_track_appearances_in_window']==6
    assert data['moods']==[{'label':'calm','count':2}] and data['activities']==[{'label':'focus','count':2}]
    assert sum(row['count'] for row in data['models'])==sum(row['count'] for row in data['daily_generations'])==2


def test_utc_window_boundaries_and_legacy_sessions_are_honest(api):
    _,path=api;engine=build_engine(f'sqlite:///{path}')
    with Session(engine) as db:
        for index,stamp in enumerate(['2026-10-21T23:59:59+00:00','2026-10-22T00:00:00+00:00','2026-10-28T23:59:59+00:00','2026-10-29T00:00:00+00:00']):
            db.add(RecommendationSession(id=str(index),created_at=stamp,model_name='Legacy',track_ids=['USUAN1500027'],context={}))
        db.commit()
        data=taste_insights(db,7,datetime(2026,10,28,12,tzinfo=timezone.utc))
        assert data['totals']['generations_in_window']==2 and data['totals']['generations_all_time']==4
        assert data['totals']['recorded_contexts_in_window']==0 and data['moods']==[]
        assert data['daily_generations'][0]['count']==1 and data['daily_generations'][-1]['count']==1
    engine.dispose()


def test_evaluation_endpoint_has_reproducible_separate_artist_scope(api):
    request,_=api
    response=request('GET','/api/evaluation');assert response.status_code==200,response.text
    report=response.json();assert report['report_version']==1 and len(report['splits'])==2
    assert report['catalogue_metrics']['relevance']=='unavailable'
    for split in report['splits']:
        assert split['evaluated_users']==1877 and split['training_interactions']==90957
        for model in split['models'].values():
            assert model['metrics']['precision_at_10']==pytest.approx(model['metrics']['recall_at_10']/10)
            for value in model['metrics'].values():assert math.isfinite(value) and 0<=value<=1
            for lower,upper in model['bootstrap_95pct'].values():assert 0<=lower<=upper<=1
    assert request('GET','/api/library').json()['recommendation_sessions']==[]


def test_missing_evaluation_is_independent_of_live_insights(api,monkeypatch):
    from app.api import insights
    request,_=api
    def missing():raise FileNotFoundError()
    monkeypatch.setattr(insights,'evaluation_report',missing)
    assert request('GET','/api/evaluation').status_code==503
    assert request('GET','/api/insights').status_code==200
    assert request('POST','/api/recommendations/compare',json={'limit':1}).status_code==200


def test_metric_definitions_penalize_short_lists_and_reject_duplicates():
    spec=importlib.util.spec_from_file_location('evaluation_metrics',Path('scripts/evaluate_models.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    metrics=module.ranking_metrics([1,2,3],2)
    assert metrics=={'precision_at_10':.1,'recall_at_10':1.,'ndcg_at_10':pytest.approx(1/math.log2(3)),'mrr_at_10':.5}
    assert module.ranking_metrics([],2)['recall_at_10']==0
    assert module.ranking_metrics(list(range(20)),15)['recall_at_10']==0
    with pytest.raises(ValueError):module.ranking_metrics([1,1],1)
