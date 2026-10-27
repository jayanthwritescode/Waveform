import test from 'node:test';
import assert from 'node:assert/strict';
import {platformSearches, localArtwork} from '../js/utils/platforms.js';

test('platform searches encode the complete artist/title query without inventing track IDs', () => {
  const track = {artist:'A&B / 東京',title:'Song? #1 "test"'};
  const searches = platformSearches(track);
  const expected = `${track.artist} ${track.title}`;
  assert.deepEqual(searches.map(p=>new URL(p.url).hostname), ['open.spotify.com','music.apple.com','music.youtube.com']);
  assert.equal(decodeURIComponent(new URL(searches[0].url).pathname.slice('/search/'.length)),expected);
  assert.equal(new URL(searches[1].url).searchParams.get('term'),expected);
  assert.equal(new URL(searches[2].url).searchParams.get('q'),expected);
  assert.ok(searches.every(p=>new URL(p.url).hash===''));
});
test('imported/recovered artwork cannot create remote requests or path traversal', () => {
  assert.equal(localArtwork({artwork:'https://example.invalid/track.png'}),'assets/images/mark.svg');
  assert.equal(localArtwork({artwork:'../data/audio/file.mp3'}),'assets/images/mark.svg');
  assert.equal(localArtwork({artwork:'assets/images/catalogue-2.svg'}),'assets/images/catalogue-2.svg');
});
