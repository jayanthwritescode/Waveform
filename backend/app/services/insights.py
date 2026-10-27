"""Read-only statistics from actual persisted state; no listening inference."""
from collections import Counter
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func
from app.models.workspace import Profile, SavedPlaylist, TrackFeedback, RecommendationSession
from app.services.catalogue import catalogue


def counts(counter):
    return [{'label':key,'count':value} for key,value in sorted(counter.items(),key=lambda item:(-item[1],item[0].casefold(),item[0]))]


def energy_summary(values):
    known=[value for value in values if isinstance(value,(int,float)) and 0<=value<=1]
    return {'mean':sum(known)/len(known) if known else None,'known':len(known),'missing':len(values)-len(known)}


def taste_insights(db, days=30, now=None):
    now=now or datetime.now(timezone.utc)
    today=now.astimezone(timezone.utc).replace(hour=0,minute=0,second=0,microsecond=0)
    start=today-timedelta(days=days-1);end=today+timedelta(days=1)
    feedback=db.scalars(select(TrackFeedback)).all()
    playlists=db.scalars(select(SavedPlaylist).order_by(SavedPlaylist.updated_at.desc(),SavedPlaylist.id)).all()
    sessions=db.scalars(select(RecommendationSession).where(RecommendationSession.created_at>=start.isoformat(),RecommendationSession.created_at<end.isoformat())).all()
    all_sessions=db.scalar(select(func.count()).select_from(RecommendationSession))
    liked_genres=Counter();liked_artists=Counter();liked_energy=[];unresolved_feedback=0
    for row in feedback:
        track=catalogue.get(row.track_id)
        if track is None: unresolved_feedback+=1
        if row.value=='like':
            liked_energy.append(track.energy if track else None)
            if track: liked_genres[track.genre]+=1;liked_artists[track.artist]+=1
    saved_genres=Counter();saved_artists=Counter();saved_energy=[];identities=set();playlist_rows=[]
    for playlist in playlists:
        known_seconds=0;unknown_durations=0
        for track in playlist.tracks:
            identity=track.get('catalogue_id') or track.get('id')
            if identity: identities.add(identity)
            saved_genres[track.get('genre') or 'Unknown']+=1
            saved_artists[track.get('artist') or 'Unknown']+=1
            saved_energy.append(track.get('energy'))
            duration=track.get('duration_seconds')
            if isinstance(duration,(int,float)) and duration>0:known_seconds+=duration
            else:unknown_durations+=1
        playlist_rows.append({'id':playlist.id,'title':playlist.title,'tracks':len(playlist.tracks),'known_duration_seconds':known_seconds,'unknown_duration_tracks':unknown_durations})
    daily=Counter({(start+timedelta(days=i)).date().isoformat():0 for i in range(days)})
    moods=Counter();activities=Counter();models=Counter();fallbacks=0;appearances=0;recorded_contexts=0
    for session in sessions:
        stamp=datetime.fromisoformat(session.created_at.replace('Z','+00:00')).astimezone(timezone.utc).date().isoformat()
        if stamp in daily: daily[stamp]+=1
        result=session.context.get('result',{})
        model_name=result.get('model',{}).get('model_name') or session.model_name
        models[model_name]+=1;appearances+=len(session.track_ids)
        fallbacks+=result.get('fallback') is True
        moment=result.get('moment') or session.context.get('request',{}).get('context')
        if isinstance(moment,dict):
            recorded_contexts+=1
            if moment.get('mood') and moment['mood']!='any': moods[moment['mood']]+=1
            if moment.get('activity') and moment['activity']!='any': activities[moment['activity']]+=1
    profile=db.get(Profile,1)
    return {'scope':{'state':'Current saved playlists and feedback, including imported metadata; not an event log.',
                     'generations':'Actual nonempty recorded generations in the selected UTC-day window; comparison/artist requests are not sessions.',
                     'days':days,'start_utc':start.isoformat(),'end_utc_exclusive':end.isoformat(),'no_listening_history':True},
            'totals':{'saved_playlists':len(playlists),'saved_track_occurrences':len(saved_energy),'unique_saved_identities':len(identities),
                      'likes':sum(row.value=='like' for row in feedback),'dislikes':sum(row.value=='dislike' for row in feedback),
                      'unresolved_feedback_tracks':unresolved_feedback,'generations_in_window':len(sessions),'generations_all_time':all_sessions,
                      'fallback_generations_in_window':fallbacks,'recommended_track_appearances_in_window':appearances,'recorded_contexts_in_window':recorded_contexts},
            'current_preferences':{'favorite_genres':profile.favorite_genres,'favorite_artists':profile.favorite_artists,'energy_min':profile.energy_min,'energy_max':profile.energy_max} if profile else None,
            'liked_genres':counts(liked_genres),'liked_artists':counts(liked_artists),'liked_source_energy':energy_summary(liked_energy),
            'saved_genres':counts(saved_genres),'saved_artists':counts(saved_artists),'saved_snapshot_energy':energy_summary(saved_energy),'playlists':playlist_rows,
            'moods':counts(moods),'activities':counts(activities),'models':counts(models),
            'daily_generations':[{'day':day,'count':daily[day]} for day in sorted(daily)]}
