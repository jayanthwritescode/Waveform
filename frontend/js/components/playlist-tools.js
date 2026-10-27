import {draft, recoveryWarning} from '../state/draft.js';
import {getPlaylist, savePlaylist, exportPlaylist, exportSaved, previewImport, deletePlaylist} from '../api/client.js';
import {escapeHtml as html} from '../utils/html.js';
import {toast} from '../utils/toast.js';
let importPreview = null;

export function playlistTools() {
  return `<section class="playlist-tools" aria-label="Save, import and export"><div class="save-actions"><button class="primary-button" id="save-playlist">Save playlist</button><button class="secondary-button" id="save-copy" hidden>Save a copy</button><button class="text-button" id="new-playlist">New playlist</button></div><p id="playlist-save-status" role="status"></p><div class="file-tools"><div><strong>Portable file export</strong><div class="download-actions">${['csv','txt','json'].map(format=>`<button class="secondary-button" data-export-format="${format}">Download ${format.toUpperCase()}</button>`).join('')}</div><small>Files are not direct transfers to a music service. JSON retains full metadata.</small></div><label class="import-label">Import a playlist file<input type="file" id="playlist-file" accept=".csv,.txt,.json"><small>UTF-8 CSV, Waveform TXT v1, or Waveform JSON v1; up to 1 MB and 500 tracks.</small></label></div><div id="import-preview" role="status"></div><div id="replace-editor" hidden></div></section>`;
}

export function refreshPlaylistTools(snapshot, change) {
  const button = document.querySelector('#save-playlist');
  if (!button) return;
  if (change === 'load') document.querySelector('#playlist-save-status').textContent = '';
  button.textContent = snapshot.savedId ? 'Save changes' : 'Save playlist';
  document.querySelector('#save-copy').hidden = !snapshot.savedId;
  const state = document.querySelector('#draft-persistence');
  if (state) state.textContent = recoveryWarning || (snapshot.savedId
    ? `${snapshot.dirty ? 'Unsaved editor changes. ' : 'Saved in Your Library. '}Draft recovery is available in this tab; use Save changes to update the saved playlist.`
    : 'Drafts recover on refresh in this tab. Save to Your Library to keep this playlist permanently.');
}

const payload = snapshot => ({title:snapshot.title.trim() || 'Untitled playlist',description:snapshot.description,tracks:snapshot.tracks});
const fingerprint = snapshot => JSON.stringify(payload(snapshot));

export async function saveEditor(copy = false) {
  const snapshot = draft.snapshot();
  const generation = draft.generation;
  const status = document.querySelector('#playlist-save-status');
  const buttons = [...document.querySelectorAll('#save-playlist,#save-copy')];
  buttons.forEach(button=>button.disabled=true);
  status.textContent = 'Saving playlist…';
  try {
    const saved = await savePlaylist({...payload(snapshot),revision:snapshot.savedRevision}, copy ? null : snapshot.savedId);
    if (draft.generation === generation) {
      const unchanged = fingerprint(snapshot) === fingerprint(draft.snapshot());
      draft.markSaved(saved, unchanged);
      status.textContent = unchanged ? 'Playlist saved in Your Library.' : 'Saved. Your newer editor changes still need saving.';
    }
    window.dispatchEvent(new CustomEvent('waveform-library-changed'));
    toast('Playlist saved locally.');
  } catch (error) {status.textContent = error.message || 'Could not save. Your draft is kept; check the backend and retry.';}
  finally {buttons.forEach(button=>button.disabled=false);}
}

async function download(blob, format) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `waveform-playlist.${format}`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

export async function downloadEditor(format, button) {
  button.disabled = true;
  try {await download(await exportPlaylist(payload(draft.snapshot()), format), format); toast(`${format.toUpperCase()} file prepared. No playlist was transferred to a music service.`);}
  catch (error) {toast(error.message || 'Export failed. Your draft is kept.');}
  finally {button.disabled = false;}
}

export async function downloadSaved(id, format, button) {
  button.disabled = true;
  try {await download(await exportSaved(id,format),format); toast(`${format.toUpperCase()} file prepared.`);}
  catch (error) {toast(error.message || 'Export failed. Please retry.');}
  finally {button.disabled = false;}
}

export async function readImport(file) {
  importPreview = null;
  const panel = document.querySelector('#import-preview');
  if (!file) {panel.replaceChildren(); return;}
  panel.textContent = 'Validating file…';
  if (file.size > 1_000_000) {panel.textContent = 'The file exceeds the 1 MB import limit. Your current draft is unchanged.'; return;}
  const format = file.name.split('.').pop().toLowerCase();
  if (!['csv','txt','json'].includes(format)) {panel.textContent = 'Choose a CSV, TXT or JSON playlist file.'; return;}
  const input = document.querySelector('#playlist-file');
  input.disabled = true;
  try {
    const bytes = await file.arrayBuffer();
    const content = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    const result = await previewImport(content, format);
    if (!panel.isConnected) return;
    importPreview = result.playlist;
    panel.innerHTML = `<div class="import-result"><strong>${html(importPreview.title)}</strong><p>${importPreview.tracks.length} tracks · ${result.catalogue_matches} catalogue matches · ${result.unmatched_tracks} unmatched.</p>${result.warnings.map(warning=>`<p>${html(warning)}</p>`).join('')}<p>Your current editor is unchanged until you load this preview.</p><button class="secondary-button" id="load-import">Replace editor with imported playlist</button></div>`;
  } catch (error) {panel.textContent = `${error.message || 'The file could not be imported.'} Your current draft is unchanged.`;}
  finally {input.disabled=false;}
}

export function loadImport() {
  if (!importPreview) return;
  draft.load(importPreview);
  toast('Imported playlist loaded as an unsaved draft.');
}

export function requestReplacement(action, title) {
  const snapshot = draft.snapshot();
  if (!snapshot.dirty || !snapshot.tracks.length) {action(); return;}
  const panel = document.querySelector('#replace-editor') || document.querySelector('#library-notice');
  panel.hidden = false;
  panel.innerHTML = `<div class="import-result"><strong>${html(title)}</strong><p>The editor has unsaved changes. Save it first or choose Replace to continue.</p><button class="secondary-button" id="confirm-replace">Replace editor</button> <button class="text-button" id="cancel-replace">Cancel</button></div>`;
  panel.querySelector('#confirm-replace').addEventListener('click',()=>{panel.hidden=true;panel.replaceChildren();action();},{once:true});
  panel.querySelector('#cancel-replace').addEventListener('click',()=>{panel.hidden=true;panel.replaceChildren();},{once:true});
  panel.querySelector('#cancel-replace').focus();
}

export async function openSaved(id, isCurrent) {
  try {
    const saved = await getPlaylist(id);
    if (!isCurrent()) return;
    requestReplacement(()=>{draft.load(saved,{saved:true}); location.hash='#/builder';},`Open ${saved.title}?`);
  } catch (error) {toast(error.message || 'Could not open the saved playlist. Your draft is kept.');}
}

export async function removeSaved(id, revision) {
  await deletePlaylist(id,revision);
  draft.unlink(id);
}
