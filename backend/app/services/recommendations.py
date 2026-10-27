from functools import lru_cache
from uuid import uuid4
from sqlalchemy import select
from app.models.workspace import Profile, RecommendationSession, TrackFeedback
from app.recommender.engine import ContentEngine
from app.schemas.workspace import ProfileOut
from app.services.catalogue import catalogue


@lru_cache(maxsize=1)
def get_engine():
    rows = [catalogue.present(record).model_dump(mode='json') for record in catalogue.records.values()]
    return ContentEngine(rows)


def generate_recommendations(payload, db, engine):
    profile = db.get(Profile,1) if payload.use_profile else None
    values = ProfileOut.model_validate(profile).model_dump() if profile is not None else {}
    feedback = db.scalars(select(TrackFeedback).order_by(TrackFeedback.updated_at.desc(),TrackFeedback.track_id)).all() if payload.use_profile else []
    likes = [row.track_id for row in feedback if row.value == 'like' and row.track_id in engine.index.ids]
    dislikes = [row.track_id for row in feedback if row.value == 'dislike']
    result = engine.recommend(seed_ids=payload.seed_ids, liked_ids=likes, disliked_ids=dislikes,
                              exclude_ids=payload.exclude_ids, profile=values, use_profile=payload.use_profile,
                              include_liked=payload.include_liked,limit=payload.limit)
    for item in result['items']:
        item['track'] = catalogue.get(item['track_id']).model_dump(mode='json')
    result['request'] = payload.model_dump()
    result['profile_revision'] = profile.revision if profile is not None else None
    result['session_id'] = None
    result['created_at'] = None
    if result['items']:
        identifier = str(uuid4())
        name = 'Genre-balanced fallback' if result['fallback'] else 'Content similarity v1'
        record = RecommendationSession(id=identifier,model_name=name,
                    track_ids=[item['track_id'] for item in result['items']],
                    context={'kind':'content-generation','request':payload.model_dump(),
                             'feedback':{row.track_id:row.value for row in feedback},
                             'profile_features':{key:value for key,value in values.items() if key not in {'name','revision'}}})
        db.add(record); db.flush()
        result['session_id'] = identifier; result['created_at'] = record.created_at
        # Store the actual response snapshot; reopening never recomputes old scores.
        record.context = {**record.context,'result':{**result}}
        db.commit()
    return result
