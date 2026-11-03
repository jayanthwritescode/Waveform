import json
from app.services.catalogue import catalogue
from test_workspace import api


def test_single_origin_deployment_routes_and_private_paths(api):
    request,_=api
    for path in ['/','/index.html']:
        response=request('GET',path)
        assert response.status_code==200 and 'name="waveform-api-base" content=""' in response.text
        assert response.headers['cache-control']=='no-store'
    assert request('HEAD','/').status_code==200
    assert request('GET','/js/main.js').status_code==200
    assert request('GET','/css/global.css').headers['cache-control']=='no-cache'
    assert request('GET','/api/ready').json()=={'status':'ready','catalogue_tracks':520}
    response=request('GET','/api/tracks?limit=24',headers={'Accept-Encoding':'gzip'})
    assert response.headers['content-encoding']=='gzip' and response.headers['cache-control']=='no-store'
    assert response.headers['x-content-type-options']=='nosniff'
    for path in ['/.env','/data/waveform.db','/data/audio/USUAN1300010.mp3','/backend/app/config.py','/api/not-a-route']:
        assert request('GET',path).status_code==404


def test_conflicting_stable_ids_are_rejected_across_write_and_import(api):
    request,_=api
    a=catalogue.get('USUAN1500027').model_dump(mode='json');a['catalogue_id']='USUAN1100844'
    payload={'title':'Conflict','tracks':[a]}
    for path in ['/api/playlists','/api/playlist-export?format=json']:
        response=request('POST',path,json=payload)
        assert response.status_code==422 and 'Conflicting catalogue' in response.text
    content=json.dumps({'format':'waveform-playlist','version':1,'playlist':payload})
    assert request('POST','/api/playlist-import',json={'format':'json','content':content}).status_code==422
    assert request('GET','/api/playlists').json()==[]


def test_import_evidence_distinguishes_stable_match_from_manual_suggestion(api):
    request,_=api
    csv='Track Title,Artist,ISRC\nDreams Become Real,Kevin MacLeod,\nDifferent input,Someone else,USUAN1100844\n'
    data=request('POST','/api/playlist-import',json={'format':'csv','content':csv}).json()
    assert data['catalogue_matches']==1 and data['unmatched_tracks']==1
    unmatched,matched=data['match_report']
    assert unmatched['status']=='unmatched' and unmatched['candidates'][0]['id']=='USUAN1500027'
    assert data['playlist']['tracks'][0]['provenance']=='user_import'
    assert matched['metadata_replaced'] and matched['basis']==['isrc']
    assert data['playlist']['tracks'][1]['title']=='Cipher'
    assert any('different title/artist' in warning for warning in data['warnings'])


def test_strict_portable_fields_and_ambiguous_hash_delimiters(api):
    request,_=api
    invalid=[('csv','Track Title,Artist,Artist\nA,B,C\n'),
             ('csv','Playlist Title,Track Title,Artist\nOne,A,B\nTwo,C,D\n'),
             ('json','{"format":"waveform-playlist","format":"waveform-playlist","version":1,"playlist":{}}'),
             ('txt','Waveform playlist v1\nTitle: "A"\nDescription: ""\nTrack 2:\n  Track Title: "Song"\n  Artist: "A"\n')]
    for format,content in invalid:
        assert request('POST','/api/playlist-import',json={'format':format,'content':content}).status_code==422
    payload={'title':'Delimiter safety','tracks':[{'title':'A|B','artist':'C'},{'title':'A','artist':'B|C'}]}
    exported=request('POST','/api/playlist-export?format=json',json=payload)
    assert exported.status_code==200
    tracks=json.loads(exported.text)['playlist']['tracks']
    assert len(tracks)==2 and tracks[0]['id']!=tracks[1]['id']


def test_cached_catalogue_isolation_and_zero_padded_source_identifiers():
    first=catalogue.get('fma-000134');first.title='Changed only in this copy'
    assert catalogue.get('fma-000134').title!='Changed only in this copy'
    assert catalogue.resolve_source('FMA metadata subset (2017)','000134').id=='fma-000134'
    assert catalogue.resolve_source('Unrelated dataset','134') is None
