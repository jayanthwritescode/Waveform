import {draft,recoveryWarning} from '../state/draft.js';
import {savePlaylist,getPlaylist,deletePlaylist} from '../playlists/manager.js';
import {escapeHtml as html} from '../utils/html.js';
import {toast} from '../utils/toast.js';
export const playlistTools=()=>`<section class="playlist-tools"><div class="save-actions"><button class="primary-button" id="save-playlist">Save playlist</button><button class="secondary-button" id="save-copy" hidden>Save a copy</button><button class="text-button" id="new-playlist">New playlist</button></div><p id="playlist-save-status" role="status"></p><div id="replace-editor" hidden></div></section>`;
export function refreshPlaylistTools(snapshot) {
  if(!document.querySelector('#save-playlist'))return;
  document.querySelector('#save-playlist').textContent=snapshot.savedId?'Save changes':'Save playlist';
  document.querySelector('#save-copy').hidden=!snapshot.savedId;
  document.querySelector('#draft-persistence').textContent=recoveryWarning || 'Kept in this browser. Save a named playlist to Your Library. Clearing site data removes local copies.';
}
export async function saveEditor(copy=false) {
  const snapshot=draft.snapshot(), status=document.querySelector('#playlist-save-status');
  try {const saved=await savePlaylist({...snapshot,revision:snapshot.savedRevision},copy?null:snapshot.savedId);draft.markSaved(saved);status.textContent='Saved in this browser’s library.';window.dispatchEvent(new Event('waveform-library-changed'));toast('Playlist saved locally.');}
  catch(error){status.textContent=error.message;}
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
