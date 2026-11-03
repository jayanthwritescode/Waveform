import hashlib
import json
from app.schemas.workspace import PlaylistInput, PlaylistTrack
from app.services.catalogue import catalogue


class IdentityConflict(ValueError):
    pass


def resolve_identity(track):
    candidates=[]
    for field in ['catalogue_id','isrc','id']:
        value=getattr(track,field)
        known=catalogue.get(value) if value else None
        if known:candidates.append((field,known))
    source=catalogue.resolve_source(track.dataset_source,track.source_identifier)
    if source:candidates.append(('dataset/source identifier',source))
    if len({known.id for _,known in candidates})>1:
        raise IdentityConflict('Conflicting catalogue identifiers. Review the track ID, ISRC and dataset/source identifier before importing or saving.')
    return (candidates[0][1] if candidates else None),[field for field,_ in candidates]


def normalize_playlist(payload:PlaylistInput,with_report=False):
    tracks=[];seen=set();reports=[]
    for track in payload.tracks:
        known,basis=resolve_identity(track)
        changed=False
        if known:
            changed=any(' '.join(getattr(track,key).casefold().split())!=' '.join(getattr(known,key).casefold().split()) for key in ['title','artist'])
            values=known.model_dump(mode='json');values.update(catalogue_id=known.id,isrc=known.isrc,provenance='catalogue')
            normalized=PlaylistTrack.model_validate(values)
        else:
            values=track.model_dump(mode='json')
            parts=[track.isrc or '',track.title.casefold(),track.artist.casefold()]
            identity='v2:'+json.dumps(parts,ensure_ascii=False) if any('|' in part for part in parts) else '|'.join(parts)
            values.update(id='import:'+hashlib.sha256(identity.encode()).hexdigest()[:24],catalogue_id=None,provenance='user_import')
            normalized=PlaylistTrack.model_validate(values)
        if normalized.id in seen:continue
        seen.add(normalized.id);tracks.append(normalized)
        if with_report:
            suggestions=[] if known else catalogue.identity_candidates(track.title,track.artist)
            reports.append({'track_id':normalized.id,'title':track.title,'artist':track.artist,'status':'catalogue' if known else 'unmatched',
                            'basis':basis,'metadata_replaced':changed,'candidates':[{'id':item.id,'title':item.title,'artist':item.artist,'album':item.album,'duration_seconds':item.duration_seconds} for item in suggestions[:3]]})
    result=PlaylistInput(title=payload.title,description=payload.description,tracks=tracks)
    return (result,reports) if with_report else result
