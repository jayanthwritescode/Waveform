import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultWeights,readWeights,restoreWeights} from '../js/pages/hybrid-controls.js';
test('hybrid controls preserve zero weights and recorded custom configuration',()=>{
 const values=Object.fromEntries(Object.keys(defaultWeights).map(key=>['#weight-'+key,{value:0}]));
 values['#catalogue-model']={value:'hybrid'};const root={querySelector:key=>values[key]};
 values['#weight-context'].value=1;
 assert.equal(readWeights(root).context,1);assert.equal(readWeights(root).collaborative,0);
 restoreWeights({weights:{content:0,preference:0,context:1,discovery:0,collaborative:0}},root);
 assert.equal(values['#catalogue-model'].value,'hybrid');assert.equal(readWeights(root).context,1);
 restoreWeights({context:{}},root);assert.equal(values['#catalogue-model'].value,'context');
});
