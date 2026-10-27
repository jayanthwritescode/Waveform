import test from 'node:test';
import assert from 'node:assert/strict';
import {readMoment,restoreMoment,syncLength,signalDetails} from '../js/pages/moment-controls.js';

function controls() {
  const fields={};
  for (const key of ['mood','activity','time_of_day','weather','energy','instrumental','genres','artists','discovery','length','duration']) fields[`#moment-${key}`]={value:''};
  for (const id of ['#duration-control','#count-label','#length-help']) fields[id]={};
  fields['#moment-energy'].options=[{value:''},{value:'0'},{value:'0.2'},{value:'0.5'},{value:'0.85'}];
  fields['#moment-discovery'].options=[{value:''},{value:'0'},{value:'0.5'},{value:'1'}];
  return {fields,root:{querySelector:id=>fields[id]}};
}

test('moment input preserves zero, artist commas and distinct newline labels',()=>{
  const {fields,root}=controls();
  fields['#moment-energy'].value='0';fields['#moment-discovery'].value='0';
  fields['#moment-artists'].value=' Artist, With Comma\nOther\nArtist, With Comma ';
  fields['#moment-genres'].value=' Jazz \n\nFolk\r\nJazz';
  const moment=readMoment(root);
  assert.equal(moment.energy_target,0);assert.equal(moment.discovery,0);
  assert.deepEqual(moment.favorite_artists,['Artist, With Comma','Other']);
  assert.deepEqual(moment.favorite_genres,['Jazz','Folk']);
  fields['#moment-energy'].value='';fields['#moment-discovery'].value='';
  assert.equal(readMoment(root).energy_target,null);assert.equal(readMoment(root).discovery,null);
});

test('recorded moment controls restore context and switch duration constraints back to count',()=>{
  const {fields,root}=controls();
  restoreMoment({context:{mood:'calm',activity:'focus',weather:'rainy',energy_target:.2,discovery:0,favorite_artists:['A, B']},length_mode:'duration',duration_minutes:24},root);
  assert.equal(readMoment(root).mood,'calm');assert.equal(readMoment(root).discovery,0);
  assert.deepEqual(readMoment(root).favorite_artists,['A, B']);
  assert.equal(fields['#duration-control'].hidden,false);assert.equal(fields['#moment-duration'].required,true);
  assert.equal(fields['#moment-duration'].value,24);
  fields['#moment-length'].value='count';syncLength(root);
  assert.equal(fields['#duration-control'].hidden,true);assert.equal(fields['#moment-duration'].required,false);
  assert.equal(fields['#count-label'].textContent,'Number of tracks');
});

test('signal explanations escape source labels and display actual contribution values',()=>{
  const content=signalDetails([{name:'<script>source</script>',value:.5,weight:.25,contribution:.125}]);
  assert.ok(!content.includes('<script>'));assert.ok(content.includes('&lt;script&gt;'));
  assert.ok(content.includes('0.500 × weight 0.250 = 0.125'));
});
