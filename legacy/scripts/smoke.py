"""HTTP release smoke check. --write creates/deletes only its own QA playlist."""
import argparse,gzip,json,time,urllib.request


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--base-url',default='http://127.0.0.1:8000');parser.add_argument('--write',action='store_true');args=parser.parse_args()
    base=args.base_url.rstrip('/');timings=[]
    def call(path,method='GET',data=None):
        body=json.dumps(data).encode() if data is not None else None
        request=urllib.request.Request(base+path,data=body,method=method,headers={'Content-Type':'application/json','Accept-Encoding':'gzip'})
        start=time.perf_counter()
        with urllib.request.urlopen(request,timeout=20) as response:
            raw=response.read();headers={key.lower():value for key,value in response.headers.items()};status=response.status
        elapsed=(time.perf_counter()-start)*1000;timings.append({'path':path.split('?')[0],'milliseconds':round(elapsed,2)})
        decoded=gzip.decompress(raw) if headers.get('content-encoding')=='gzip' else raw
        return status,decoded,headers, len(raw)
    assert call('/api/ready')[0]==200
    _,html,_,_=call('/');assert b'name="waveform-api-base" content=""' in html
    assert call('/js/main.js')[0]==200
    _,body,headers,wire=call('/api/tracks?limit=24');page=json.loads(body);assert len(page['items'])==24
    assert headers.get('cache-control')=='no-store'
    compression={'encoding':headers.get('content-encoding','identity'),'wire_bytes':wire,'decoded_bytes':len(body)}
    _,body,_,_=call('/api/recommendations/compare','POST',{'context':{'mood':'calm'},'limit':3})
    comparison=json.loads(body);assert not comparison['recorded']
    tracks=comparison['results']['hybrid']['items'];assert len(tracks)==3
    exports=[];saved=None
    if args.write:
        try:
            _,body,_,_=call('/api/playlists','POST',{'title':'Waveform release smoke QA','tracks':[item['track'] for item in tracks]});saved=json.loads(body)
            for format in ['csv','txt','json']:
                _,body,_,_=call(f'/api/playlists/{saved["id"]}/export?format={format}')
                _,preview,_,_=call('/api/playlist-import','POST',{'format':format,'content':body.decode('utf-8')})
                restored=json.loads(preview)['playlist']['tracks']
                assert [item['catalogue_id'] for item in restored]==[item['track_id'] for item in tracks]
                exports.append(format)
            update={**saved,'title':'Waveform release smoke reordered','tracks':list(reversed(saved['tracks']))}
            _,body,_,_=call('/api/playlists/'+saved['id'],'PUT',update);saved=json.loads(body);assert saved['revision']==2
        finally:
            if saved:assert call(f'/api/playlists/{saved["id"]}?revision={saved["revision"]}','DELETE')[0]==204
    print(json.dumps({'checks':'passed','write_scope':'Owned temporary QA playlist only' if args.write else 'Read-only comparisons; no generation sessions',
                      'portable_round_trips':exports,'compression':compression,'timings':timings,
                      'performance_scope':'Single local process warm/request diagnostics, not a load test or cross-machine performance promise'},indent=2))


if __name__=='__main__':main()
