import test from 'node:test';
import assert from 'node:assert/strict';
import {overlap,renderComparison} from '../js/pages/explorer-results.js';
const item=(id,title=id)=>({track_id:id,rank:1,score:.5,track:{title,artist:'Artist',genre:'Jazz'},signals:[{name:'context',value:.5,weight:1,contribution:.5}],reasons:['Actual source energy'],context_signals:[]});
test('overlap is based on identities and has an honest undefined empty denominator',()=>{
 assert.deepEqual(overlap([item('a'),item('b')],[item('b'),item('c')]),{shared:1,union:3,jaccard:1/3});
 assert.equal(overlap([],[]).jaccard,null);assert.equal(overlap([item('a')],[]).jaccard,0);
 assert.equal(overlap([item('a','Same title')],[item('b','Same title')]).shared,0);
});
test('full explorer escapes source labels, shows real contributions and avoids fake accuracy',()=>{
 const result={items:[item('a','<img src=x onerror=alert(1)>')],returned_count:1,fallback:false,model:{model_version:'real-version'}};
 const content=renderComparison({scope:'Same inputs',results:{content:result,hybrid:{...result,items:[item('b')]}}},true);
 assert.ok(!content.includes('<img'));assert.ok(content.includes('&lt;img'));
 assert.ok(content.includes('contribution 0.500'));assert.ok(content.includes('outside returned set'));
 assert.ok(content.includes('data-use-comparison="hybrid"'));assert.ok(content.includes('No collaborative track evidence'));
});
