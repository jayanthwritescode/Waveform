from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.core import get_session
from app.models.workspace import RecommendationSession
from app.schemas.recommendation import RecommendationRequest, ContextRecommendationRequest, HybridRecommendationRequest, ComparisonContentRequest
from app.services.recommendations import generate_recommendations, get_engine, get_context_engine, get_hybrid_engine

router = APIRouter(prefix='/recommendations',tags=['recommendations'])


@router.get('/model')
def model_metadata(engine=Depends(get_engine)):
    return engine.metadata()


@router.post('')
def recommend(payload: RecommendationRequest, db: Session=Depends(get_session), engine=Depends(get_engine)):
    try:
        return generate_recommendations(payload,db,engine)
    except ValueError as error:
        raise HTTPException(422,str(error)) from error


@router.get('/context/model')
def context_model(engine=Depends(get_context_engine)):
    return engine.metadata()


@router.post('/context')
def context_recommend(payload: ContextRecommendationRequest, db: Session=Depends(get_session), engine=Depends(get_context_engine)):
    try:
        return generate_recommendations(payload,db,engine)
    except ValueError as error:
        raise HTTPException(422,str(error)) from error


@router.get('/hybrid/model')
def hybrid_model(engine=Depends(get_hybrid_engine)):
    return engine.metadata()


@router.post('/hybrid')
def hybrid_recommend(payload: HybridRecommendationRequest, db: Session=Depends(get_session), engine=Depends(get_hybrid_engine)):
    try: return generate_recommendations(payload,db,engine)
    except ValueError as error: raise HTTPException(422,str(error)) from error


@router.post('/compare')
def compare_models(payload: HybridRecommendationRequest, db: Session=Depends(get_session)):
    if payload.length_mode != 'count': raise HTTPException(422,'Model comparison uses count mode; choose a track count first.')
    common={key:getattr(payload,key) for key in RecommendationRequest.model_fields}
    requests=[('content',ComparisonContentRequest(**common),get_engine()),
              ('context',ContextRecommendationRequest(**common,context=payload.context),get_context_engine()),
              ('hybrid',payload,get_hybrid_engine())]
    try:
        results={name:generate_recommendations(request,db,engine,record_session=False) for name,request,engine in requests}
    except ValueError as error: raise HTTPException(422,str(error)) from error
    return {'results':results,'recorded':False,'scope':'Same inputs/exclusions; model signals differ. No sessions are created and no relevance accuracy is measured.'}


@router.get('/sessions/{session_id}')
def recorded_session(session_id: str, db: Session=Depends(get_session)):
    record = db.get(RecommendationSession,session_id)
    if record is None: raise HTTPException(404,'Recommendation session not found')
    result = record.context.get('result')
    if not isinstance(result,dict): raise HTTPException(409,'This session has no recorded recommendation response')
    return {**result,'session_id':record.id,'created_at':record.created_at,'historical':True}
