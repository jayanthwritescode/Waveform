from functools import lru_cache
from typing import Annotated
from zipfile import BadZipFile
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from app.config import ROOT
from app.recommender.collaborative import ArtistKNN
router=APIRouter(prefix='/experiments/collaborative',tags=['separate artist experiment'])


@lru_cache(maxsize=1)
def experiment():
    try: return ArtistKNN.load(ROOT/'data/processed/lastfm')
    except (OSError,ValueError,KeyError,TypeError,EOFError,BadZipFile): return None


def require_model():
    model=experiment()
    if model is None: raise HTTPException(503,'Artist experiment unavailable. Run scripts/prepare_collaborative.py --download --build, then restart the backend. Catalogue recommendations remain available.')
    return model


@router.get('/model')
def metadata():
    model=experiment()
    return model.metadata() if model else {'available':False,'scope':'Separate non-commercial artist experiment','setup':'Run .venv/bin/python scripts/prepare_collaborative.py --download --build, then restart. No track mapping is enabled.'}


@router.get('/artists')
def artists(q: str=Query('',max_length=120),limit: int=Query(8,ge=1,le=20)):
    model=require_model();query=q.casefold().strip()
    matches=[{'artist_id':identifier,'name':model.names[str(identifier)]} for identifier in model.artist_ids if query in model.names[str(identifier)].casefold()]
    return {'items':matches[:limit],'total':len(matches)}


ArtistId=Annotated[int,Field(strict=True,gt=0)]


class ArtistRequest(BaseModel):
    model_config=ConfigDict(extra='forbid')
    seed_ids: list[ArtistId]=Field(default_factory=list,max_length=20)
    exclude_ids: list[ArtistId]=Field(default_factory=list,max_length=500)
    limit: int=Field(default=10,ge=1,le=30)


@router.post('')
def recommend(payload: ArtistRequest):
    try: return require_model().recommend(payload.seed_ids,payload.limit,payload.exclude_ids)
    except ValueError as error: raise HTTPException(422,str(error)) from error
