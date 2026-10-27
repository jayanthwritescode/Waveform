"""Fetch/fit official HetRec Last.fm data for a separate non-commercial experiment."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import sys
import urllib.request
import zipfile
import numpy as np
from scipy.sparse import csr_matrix, save_npz
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'backend'))
from app.recommender.collaborative import ArtistKNN
URL='https://files.grouplens.org/datasets/hetrec2011/hetrec2011-lastfm-2k.zip'
SHA='6738f48195667ff03caaab4d32ca9a3133d8cc026b7c3cdaf6ce1010e913c59c'
RAW=ROOT/'data/raw/lastfm'; OUT=ROOT/'data/processed/lastfm'


def source():
    raw=(RAW/'source.zip').read_bytes()
    if hashlib.sha256(raw).hexdigest()!=SHA: raise ValueError('Official archive hash mismatch')
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        # Explicit members only; ZipFile.read validates CRC and never extracts arbitrary paths.
        return {name:archive.read(name) for name in ['artists.dat','user_artists.dat','readme.txt']}


def build():
    files=source()
    artists=list(csv.DictReader(io.StringIO(files['artists.dat'].decode('utf-8')),delimiter='\t'))
    interactions=list(csv.DictReader(io.StringIO(files['user_artists.dat'].decode('utf-8')),delimiter='\t'))
    artist_ids=sorted(int(row['id']) for row in artists);user_ids=sorted({int(row['userID']) for row in interactions})
    names={str(row['id']):row['name'] for row in artists}
    columns={value:i for i,value in enumerate(artist_ids)}; rows={value:i for i,value in enumerate(user_ids)}
    pairs=[]
    for row in interactions:
        if int(row['weight'])<=0: raise ValueError('Nonpositive source interaction')
        pairs.append((rows[int(row['userID'])],columns[int(row['artistID'])]))
    if len(pairs)!=len(set(pairs)): raise ValueError('Duplicate user-artist source relation')
    matrix=csr_matrix((np.ones(len(pairs)),tuple(zip(*pairs))),shape=(len(user_ids),len(artist_ids)))
    model=ArtistKNN(matrix,artist_ids,names,user_ids)
    OUT.mkdir(parents=True,exist_ok=True)
    temp=OUT/'interactions.tmp.npz';save_npz(temp,matrix);temp.replace(OUT/'interactions.npz')
    metadata={'artist_ids':artist_ids,'user_ids':user_ids,'names':names,'model_version':model.version,
              'matrix_sha256':hashlib.sha256((OUT/'interactions.npz').read_bytes()).hexdigest()}
    temp=OUT/'model.tmp.json';temp.write_text(json.dumps(metadata,ensure_ascii=False));temp.replace(OUT/'model.json')
    provenance={**model.metadata(),'archive_url':URL,'archive_sha256':SHA,'retrieved_on':'2026-10-28',
                'source_members':{key:hashlib.sha256(value).hexdigest() for key,value in files.items()},
                'transform':'Positive listening counts binarized per user-artist pair; no friends/tags/images or user names used',
                'redistribution':'Raw data and fitted user-profile artifacts stay Git-ignored; only provenance/aggregate evaluation are tracked'}
    (ROOT/'data/catalogue/lastfm_provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
    for name,value in files.items(): (RAW/name).write_bytes(value)
    print(json.dumps(model.metadata(),indent=2))


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--download',action='store_true');parser.add_argument('--build',action='store_true');args=parser.parse_args()
    if args.download:
        RAW.mkdir(parents=True,exist_ok=True)
        raw=urllib.request.urlopen(URL,timeout=90).read(5_000_001)
        if len(raw)>5_000_000 or hashlib.sha256(raw).hexdigest()!=SHA: raise ValueError('Archive exceeds size bound or hash mismatch')
        temp=RAW/'source.part';temp.write_bytes(raw);temp.replace(RAW/'source.zip')
    if args.build: build()


if __name__=='__main__': main()
