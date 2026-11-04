import {store} from '../playlists/storage.js';
import {draft,recoveryWarning} from '../state/draft.js';
import {savePlaylist,getPlaylist,deletePlaylist} from '../playlists/manager.js';
import {escapeHtml as html} from '../utils/html.js';
import {toast} from '../utils/toast.js';
export const playlistTools=()=>`<section class="playlist-tools"><div class="save-actions"><button class="primary-button" id="save-playlist">Save playlist</button><button class="secondary-button" id="save-copy" hidden>Save a copy</button><button class="text-button" id="new-playlist">Start fresh</button><span id="editor-save-indicator"></span></div><p id="playlist-save-status" role="status"></p><details class="export-panel" open><summary>Take your playlist with you <span>Download or transfer</span></summary><div class="file-tools"><div><p>Choose a format. Keep a copy, or import your tracklist into a music service.</p><div class="download-actions">${[['csv','CSV','For playlist transfers'],['txt','Tracklist','Simple artist & title list'],['json','JSON','Full playlist backup']].map(([f,label,note])=>`<button class="export-format" data-export-format="${f}"><strong>${label} ↓</strong><small>${note}</small></button>`).join('')}</div></div><label class="import-label">Bring a playlist in<input id="playlist-file" type="file" accept=".csv,.txt,.json"><small>CSV, TXT or Waveform JSON · up to 1 MB</small></label></div></details><div id="import-preview" role="status"></div><div id="replace-editor" hidden></div></section>`;
export function refreshPlaylistTools(snapshot) {
  if(!document.querySelector('#save-playlist'))return;
  document.querySelector('#save-playlist').textContent=snapshot.savedId?'Save changes':'Save playlist';
  document.querySelector('#save-copy').hidden=!snapshot.savedId;
  document.querySelector('#editor-save-indicator').textContent=snapshot.savedId&&!snapshot.dirty?'✓ Saved on this device':snapshot.tracks.length?'Unsaved changes':'';
  document.querySelector('#draft-persistence').textContent=recoveryWarning || 'Your draft is kept on this device. Save it to add it to your library.';
}
let saving=false;
export async function saveEditor(copy=false) {
  if(saving)return;saving=true;
  const snapshot=draft.snapshot(),generation=draft.generation,status=document.querySelector('#playlist-save-status');
  const buttons=[...document.querySelectorAll('#save-playlist,#save-copy')];buttons.forEach(b=>b.disabled=true);
  try {const saved=await savePlaylist({...snapshot,revision:snapshot.savedRevision},copy?null:snapshot.savedId);
    if(generation===draft.generation){const unchanged=JSON.stringify({...snapshot,dirty:false})===JSON.stringify({...draft.snapshot(),dirty:false});draft.markSaved(saved,unchanged);}
    if(status?.isConnected)status.textContent=store.warning || 'Saved in this browser’s library.';
    window.dispatchEvent(new Event('waveform-library-changed'));toast(store.warning?'Kept temporarily. Download a backup before leaving.':'Playlist saved locally.');
  }catch(error){if(status?.isConnected)status.textContent=error.message;}
  finally{saving=false;buttons.forEach(b=>b.disabled=false);}
}
export function requestReplacement(action,title) {
  if(!draft.snapshot().dirty || !draft.snapshot().tracks.length){action();return;}
  const panel=document.querySelector('#replace-editor') || document.querySelector('#library-notice');
  if(!panel){if(window.confirm(`${title} Replace the unsaved editor?`))action();return;}
  panel.hidden=false;panel.innerHTML=`<div class="import-result"><strong>${html(title)}</strong><p>Your editor has unsaved changes.</p><button class="secondary-button" id="confirm-replace">Replace editor</button> <button class="text-button" id="cancel-replace">Cancel</button></div>`;
  const previous=document.activeElement;
  panel.querySelector('#confirm-replace').onclick=()=>{panel.hidden=true;panel.replaceChildren();action();};
  panel.querySelector('#cancel-replace').onclick=()=>{panel.hidden=true;panel.replaceChildren();previous?.isConnected&&previous.focus();};
  panel.querySelector('#cancel-replace').focus();
}
export async function openSaved(id,isCurrent){try{const saved=await getPlaylist(id);if(isCurrent())requestReplacement(()=>{draft.load(saved,{saved:true});location.hash='#/builder';},`Open ${saved.title}?`);}catch(e){toast(e.message);}}
export async function removeSaved(id,revision){await deletePlaylist(id,revision);draft.unlink(id);}

export async function downloadEditor(format){try{const {downloadPlaylist}=await import('../playlists/export.js');const file=downloadPlaylist(draft.snapshot(),format);document.querySelector('#playlist-save-status').textContent=`Your file is ready: ${file.filename}.`;}catch(e){toast(e.message);}}
export async function downloadSaved(id,format){try{const {downloadPlaylist}=await import('../playlists/export.js');downloadPlaylist(await getPlaylist(id),format);}catch(e){toast(e.message);}}
let preview=null,importVersion=0;
export async function readImport(file) {
  const version=++importVersion;preview=null;const panel=document.querySelector('#import-preview');if(!file){panel.replaceChildren();return;}
  const generation=draft.generation;panel.textContent='Reading file…';
  try {if(file.size>1_000_000)throw Error('Import limit is 1 MB.');const {importText}=await import('../playlists/import.js');const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());const result=importText(text,file.name.split('.').pop().toLowerCase());if(!panel.isConnected || generation!==draft.generation || version!==importVersion)return;preview=result.playlist;panel.innerHTML=`<div class="import-result"><strong>${html(preview.title)}</strong><p>${preview.tracks.length} tracks. Ready to preview.</p>${result.warnings.map(w=>`<p>${html(w)}</p>`).join('')}<p>Your draft is unchanged until you load this file.</p><button class="secondary-button" id="load-import">Load as a new draft</button></div>`;}
  catch(e){if(panel.isConnected && version===importVersion)panel.textContent=`${e.message} Your draft is unchanged.`;}
}
export function loadImport(){if(preview)requestReplacement(()=>{draft.load(preview);preview=null;document.querySelector('#import-preview')?.replaceChildren();},'Load the imported playlist?');}
export async function replaceEditorTrack(id) {
  const snapshot=draft.snapshot(),generation=draft.generation;
  try {const [{fallbackTracks,registerTracks},{rankCandidates,replacementFor},{store}]=await Promise.all([import('../api/catalogue.js'),import('../recommender/ranking.js'),import('../playlists/storage.js')]);const d=store.read();const context=snapshot.context || d.settings.lastContext || {mood:'calm',activity:'relaxing',count:30,genres:[],energy:.5,discovery:.5,variety:.6};const pool=[...Object.values(d.tracks),...await fallbackTracks()];const result=rankCandidates(pool,{...context,count:30},d.profile,d.feedback,d.tracks);const next=replacementFor(snapshot.tracks,result.ranked,id,result.artistLimit);if(draft.generation!==generation)return;if(!next){toast('No compatible replacement remains. Broaden your preferences or generate again.');return;}draft.replace(id,next);registerTracks([next]);toast(`Replaced with ${next.title} · ${next.availability} metadata.`);}
  catch(e){toast(e.message);}
}
