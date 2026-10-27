import test from 'node:test';
import assert from 'node:assert/strict';
import {nextIndex, nextRepeat} from '../js/player/queue.js';
import {escapeHtml, formatTime} from '../js/utils/html.js';

test('queue progresses, stops at the end, and handles an empty collection', () => {
  assert.equal(nextIndex(0, 3), 1);
  assert.equal(nextIndex(2, 3), -1);
  assert.equal(nextIndex(-1, 0), -1);
});
test('repeat all wraps and repeat one applies only to natural ending', () => {
  assert.equal(nextIndex(2, 3, {repeat:'all'}), 0);
  assert.equal(nextIndex(1, 3, {repeat:'one', ended:true}), 1);
  assert.equal(nextIndex(1, 3, {repeat:'one'}), 2);
  assert.equal(nextRepeat(nextRepeat(nextRepeat('off'))), 'off');
});
test('shuffle avoids the current track and handles a single track', () => {
  for (const random of [() => 0, () => 0.999]) {
    assert.notEqual(nextIndex(1, 3, {shuffle:true, random}), 1);
  }
  assert.equal(nextIndex(0, 1, {shuffle:true}), -1);
});
test('metadata rendering escapes markup and duration formatting handles unknown values', () => {
  assert.equal(escapeHtml('<img "a" & \'b\'>'), '&lt;img &quot;a&quot; &amp; &#39;b&#39;&gt;');
  assert.equal(formatTime(410), '6:50');
  assert.equal(formatTime(NaN), '0:00');
});
test('shuffle exhausts unplayed tracks and only wraps when repeat all is enabled', () => {
  assert.equal(nextIndex(1, 3, {shuffle:true, visited:[0,1], random:() => 0}), 2);
  assert.equal(nextIndex(2, 3, {shuffle:true, visited:[0,1,2]}), -1);
  assert.notEqual(nextIndex(2, 3, {shuffle:true, repeat:'all', visited:[0,1,2]}), -1);
});
