"""Run the complete private Waveform app on one loopback port."""
import argparse
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'backend'))
import uvicorn

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=8000)
    parser.add_argument('--host',choices=['127.0.0.1','::1'],default='127.0.0.1')
    args=parser.parse_args()
    if not 1024<=args.port<=65535:parser.error('Choose an unprivileged port from 1024 to 65535')
    print(f'Waveform: http://{args.host if args.host=="127.0.0.1" else "[::1]"}:{args.port}',flush=True)
    uvicorn.run('app.main:app',host=args.host,port=args.port)
