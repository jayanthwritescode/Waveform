import json
from functools import lru_cache
from fastapi import APIRouter,Depends,HTTPException,Query
from sqlalchemy.orm import Session
from app.config import ROOT
from app.database.core import get_session
from app.services.insights import taste_insights
router=APIRouter(tags=['insights and evaluation'])


@router.get('/insights')
def insights(days:int=Query(30,ge=7,le=90),db:Session=Depends(get_session)):
    if days not in {7,30,90}:raise HTTPException(422,'Choose 7, 30 or 90 days')
    return taste_insights(db,days)


@lru_cache(maxsize=1)
def evaluation_report():
    raw=(ROOT/'docs/evaluation-report.json').read_bytes()
    if len(raw)>1_000_000:raise ValueError('Oversized evaluation report')
    report=json.loads(raw)
    if not isinstance(report,dict) or report.get('report_version')!=1 or not isinstance(report.get('splits'),list) or not report['splits']:raise ValueError('Invalid evaluation report')
    return report


@router.get('/evaluation')
def evaluation():
    try:return evaluation_report()
    except (OSError,ValueError,KeyError):raise HTTPException(503,'Evaluation report unavailable. Run scripts/evaluate_models.py and restart. Live catalogue comparisons and Taste Insights remain available.')
