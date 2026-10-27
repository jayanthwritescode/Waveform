import test from 'node:test';
import assert from 'node:assert/strict';
import {bars,dailyChart} from '../js/pages/analysis-charts.js';
test('empty statistics do not fabricate a chart or sample data',()=>{
 assert.ok(!bars([]).includes('<meter'));
 assert.ok(!dailyChart([{day:'2026-10-28',count:0}]).includes('<svg'));
 assert.ok(dailyChart([]).includes('No recorded generations'));
});
test('distribution charts retain actual counts and escape source labels',()=>{
 const rendered=bars([{label:'<script>x</script>',count:3},{label:'Jazz',count:1}]);
 assert.ok(!rendered.includes('<script>'));assert.ok(rendered.includes('&lt;script&gt;'));
 assert.ok(rendered.includes('max="3" value="1"'));
});
test('daily chart exposes a real-count table and honest UTC dates',()=>{
 const rendered=dailyChart([{day:'2026-10-26',count:0},{day:'2026-10-27',count:2},{day:'2026-10-28',count:1}]);
 assert.ok(rendered.includes('3 total; maximum 2'));
 assert.ok(rendered.includes('Daily counts table'));assert.ok(rendered.includes('UTC days'));
 assert.ok(rendered.includes('<td>2026-10-27</td><td>2</td>'));
});
