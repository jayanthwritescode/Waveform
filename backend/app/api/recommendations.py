from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.core import get_session
from app.models.workspace import RecommendationSession
from app.schemas.recommendation import RecommendationRequest, ContextRecommendationRequest
from app.services.recommendations import generate_recommendations, get_engine, get_context_engine

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


@router.get('/sessions/{session_id}')
def recorded_session(session_id: str, db: Session=Depends(get_session)):
    record = db.get(RecommendationSession,session_id)
    if record is None: raise HTTPException(404,'Recommendation session not found')
    result = record.context.get('result')
    if not isinstance(result,dict): raise HTTPException(409,'This session has no recorded recommendation response')
    return {**result,'session_id':record.id,'created_at':record.created_at,'historical':True}
