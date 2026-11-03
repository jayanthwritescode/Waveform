import {escapeHtml as html} from '../utils/html.js';
export const defaultWeights={content:.25,preference:.25,context:.30,discovery:.10,collaborative:.10};
export function hybridControls() {
  return `<fieldset class="moment-controls"><legend>Choose your model</legend><label>Catalogue model<select id="catalogue-model"><option value="hybrid">Hybrid · available catalogue signals</option><option value="context">Context suitability · Phase 5</option></select></label><p class="generation-help">The hybrid blends content, saved taste, context and discovery. Collaborative track scores are unavailable: the separate research dataset contains artist interactions with no verified track mapping.</p><a class="text-link" href="#/lab">Open the collaborative artist lab ↗</a><details id="hybrid-weight-panel"><summary>Hybrid signal weights</summary><p class="generation-help">Starting weights, not tuned accuracy claims. Available signals are renormalized per track; collaborative weight is omitted for this catalogue.</p><div class="moment-grid">${Object.entries(defaultWeights).map(([key,value])=>`<label>${html(key[0].toUpperCase()+key.slice(1))} weight<input id="weight-${key}" type="number" min="0" max="1" step="any" value="${value}" required></label>`).join('')}</div></details></fieldset>`;
}
export function readWeights(root=document) {return Object.fromEntries(Object.keys(defaultWeights).map(key=>[key,Number(root.querySelector(`#weight-${key}`).value)]));}
export function restoreWeights(request,root=document) {
  root.querySelector('#catalogue-model').value=Object.hasOwn(request,'weights') ? 'hybrid' : 'context';
  for(const [key,value] of Object.entries(request.weights || defaultWeights)) root.querySelector(`#weight-${key}`).value=value;
}
