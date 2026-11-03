#!/usr/bin/env python3
"""Rebuild Waveform's attributed FMA metadata subset; never downloads audio."""
import argparse
import hashlib
import io
import json
import urllib.request
import zipfile
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = 'https://os.unil.cloud.switch.ch/fma/fma_metadata.zip'
ARCHIVE_BYTES = 358412441
RAW = ROOT / 'data/raw/fma'
MEMBERS = ['tracks.csv', 'genres.csv', 'echonest.csv']


class RangeArchive(io.RawIOBase):
    def __init__(self):
        self.position = 0
    def readable(self): return True
    def seekable(self): return True
    def tell(self): return self.position
    def seek(self, offset, whence=0):
        self.position = offset if whence == 0 else self.position + offset if whence == 1 else ARCHIVE_BYTES + offset
        return self.position
    def read(self, count=-1):
        end = ARCHIVE_BYTES if count < 0 else min(self.position + count, ARCHIVE_BYTES)
        if end <= self.position: return b''
        request = urllib.request.Request(SOURCE_URL, headers={'Range':f'bytes={self.position}-{end-1}'})
        with urllib.request.urlopen(request, timeout=60) as response:
            expected = f'bytes {self.position}-{end-1}/{ARCHIVE_BYTES}'
            if response.status != 206 or response.headers.get('Content-Range') != expected:
                raise ValueError('Official archive changed or byte ranges are unsupported; review before downloading')
            data = response.read(end - self.position + 1)
        if len(data) != end - self.position:
            raise ValueError('Truncated archive range')
        self.position = end
        return data


def download_tables():
    RAW.mkdir(parents=True, exist_ok=True)
    provenance = {'archive_url':SOURCE_URL, 'archive_bytes':ARCHIVE_BYTES, 'tables':{}}
    with zipfile.ZipFile(RangeArchive()) as archive:
        for name in MEMBERS:
            info = archive.getinfo('fma_metadata/' + name)
            path = RAW / name
            if not path.exists():
                print(f'Downloading {name}: {info.compress_size:,} compressed bytes', flush=True)
                temporary = path.with_suffix('.csv.part')
                try:
                    with archive.open(info) as source, temporary.open('wb') as output:
                        while chunk := source.read(1024 * 1024): output.write(chunk)
                    temporary.replace(path)
                finally: temporary.unlink(missing_ok=True)
            checksum = 0
            hasher = hashlib.sha256()
            with path.open('rb') as downloaded:
                while chunk := downloaded.read(1024 * 1024):
                    hasher.update(chunk); checksum = zlib.crc32(chunk,checksum)
            if checksum != info.CRC: raise ValueError(f'{name} differs from the official ZIP member; original local file was preserved')
            digest = hasher.hexdigest()
            provenance['tables'][name] = {'bytes':path.stat().st_size, 'zip_crc32':f'{info.CRC:08x}', 'sha256':digest}
            print(f'Available: {name}', flush=True)
    (RAW / 'provenance.json').write_text(json.dumps(provenance, indent=2)+'\n')


def build_subset(target=512):
    expected_path = ROOT / 'data/catalogue/fma_provenance.json'
    expected = json.loads(expected_path.read_text())['source'] if expected_path.exists() else json.loads((RAW/'provenance.json').read_text())
    for name in MEMBERS:
        hasher = hashlib.sha256()
        with (RAW/name).open('rb') as source:
            while chunk := source.read(1024*1024): hasher.update(chunk)
        if hasher.hexdigest() != expected['tables'][name]['sha256']:
            raise ValueError(f'{name} changed from the pinned source; review before rebuilding')
    import ast
    import csv
    import math
    import re
    from collections import Counter
    from datetime import date
    csv.field_size_limit(5_000_000)
    with (RAW / 'genres.csv').open() as source:
        taxonomy = {int(row['genre_id']):row for row in csv.DictReader(source)}
    features = {}
    with (RAW / 'echonest.csv').open() as source:
        reader = csv.reader(source)
        next(reader); group = next(reader); names = next(reader); next(reader)
        columns = {name:i for i,name in enumerate(names) if group[i] == 'audio_features'}
        for row in reader:
            feature = {}
            for output,name in [('bpm','tempo'),('energy','energy'),('valence','valence'),('acousticness','acousticness'),('instrumentalness','instrumentalness')]:
                try: value = float(row[columns[name]])
                except (ValueError,IndexError): value = math.nan
                valid = math.isfinite(value) and (0 < value <= 1000 if output == 'bpm' else 0 <= value <= 1)
                feature[output] = value if valid else None
            features[int(row[0])] = feature
    def labels(value):
        try: values = ast.literal_eval(value)
        except (ValueError,SyntaxError): return []
        return sorted({str(item).strip() for item in values if str(item).strip() and len(str(item).strip())<=120}) if isinstance(values,list) else []
    groups = {}; counts = Counter()
    with (RAW / 'tracks.csv').open() as source:
        reader = csv.reader(source); first = next(reader); second = next(reader); next(reader)
        columns = {(a,b):i for i,(a,b) in enumerate(zip(first,second))}
        for row in reader:
            counts['source_track_rows'] += 1
            track_id = int(row[0])
            if track_id not in features: continue
            def get(group,name): return row[columns[(group,name)]].strip()
            title,artist,album = get('track','title'),get('artist','name'),get('album','title')
            if not title or not artist or len(title)>120 or len(artist)>120 or len(album)>200:
                counts['rejected_title_artist_album'] += 1; continue
            try: duration = int(get('track','duration'))
            except ValueError: duration = 0
            if not 0 < duration <= 86400:
                counts['rejected_duration'] += 1; continue
            ids = labels(get('track','genres'))
            genre_names = sorted({taxonomy[int(value)]['title'] for value in ids if str(value).isdigit() and int(value) in taxonomy})
            primary = get('track','genre_top')
            if not primary:
                roots = sorted({taxonomy[int(taxonomy[int(value)]['top_level'])]['title'] for value in ids if str(value).isdigit() and int(value) in taxonomy})
                primary = roots[0] if roots else ''
            if not primary:
                counts['rejected_genre'] += 1; continue
            genre_names = sorted(set(genre_names+[primary]))
            released = get('album','date_released')
            release_year = int(released[:4]) if re.match(r'^[1-9][0-9]{3}-',released) else None
            try: uploaded = date.fromisoformat(get('track','date_created')[:10]).isoformat()
            except ValueError: uploaded = None
            record = {'id':f'fma-{track_id:06d}', 'isrc':None, 'title':title, 'artist':artist, 'album':album or None,
                      'release_year':release_year, 'genre':primary, 'genres':genre_names, 'duration_seconds':duration,
                      **features[track_id], 'instruments':[], 'tags':labels(get('track','tags')),
                      'artwork':f'assets/images/catalogue-{track_id%8+1}.svg',
                      'source_url':'https://github.com/mdeff/fma#data', 'source_uploaded':uploaded,
                      'license_name':'CC BY 4.0', 'license_scope':'metadata', 'license_url':'https://creativecommons.org/licenses/by/4.0/',
                      'recording_license':get('track','license') or None,
                      'feature_source':'FMA echonest.csv audio_features (2017 archive)',
                      'attribution':'FMA metadata: Defferrard, Benzi, Vandergheynst and Bresson, ISMIR 2017. Metadata licensed CC BY 4.0. Recording licenses are separate; no audio is provided. Artwork is an original Waveform illustration.'}
            groups.setdefault(primary,[]).append(record); counts['eligible_rows'] += 1
    for records in groups.values(): records.sort(key=lambda row:hashlib.sha256(row['id'].encode()).hexdigest())
    selected = []; artist_counts = Counter(); cap = 4
    while len(selected)<target and any(groups.values()):
        progressed = False
        for genre in sorted(groups):
            pool = groups[genre]
            index = next((i for i,row in enumerate(pool) if artist_counts[row['artist']]<cap),None)
            if index is None: continue
            record = pool.pop(index); selected.append(record); artist_counts[record['artist']]+=1; progressed=True
            if len(selected)>=target: break
        if not progressed: cap += 1
    selected.sort(key=lambda row:row['id'])
    manifest = {'name':'FMA metadata subset (2017)', 'version':1, 'retrieved_on':'2026-10-27',
                'metadata_url':SOURCE_URL, 'license_source':'https://github.com/mdeff/fma#acknowledgments-and-licenses', 'tracks':selected}
    output = ROOT / 'data/catalogue/fma.json'
    output.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    source = json.loads((RAW/'provenance.json').read_text())
    report = {'source':source,'selection':'Exact FMA ID join to Echonest audio_features; source genre round-robin, SHA-256 ID order, artist cap starts at 4',
              'target_tracks':target,'selected_tracks':len(selected),'artists':len(artist_counts),'counts':dict(counts),
              'genres':dict(sorted(Counter(row['genre'] for row in selected).items())),
              'feature_known':{key:sum(row.get(key) is not None for row in selected) for key in features[next(iter(features))]},
              'snapshot_sha256':hashlib.sha256(output.read_bytes()).hexdigest()}
    (ROOT/'data/catalogue/fma_provenance.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({key:report[key] for key in ['selected_tracks','artists','counts','genres','feature_known']},indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--build', action='store_true')
    args = parser.parse_args()
    if args.download: download_tables()
    if args.build: build_subset()
