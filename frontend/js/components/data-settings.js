import {store} from '../playlists/storage.js';
import {draft} from '../state/draft.js';
import {createBackup,parseBackup,mergeBackup,BACKUP_LIMIT} from '../playlists/backup.js';
import {escapeHtml as html} from '../utils/html.js';
import {loadWorkspace} from '../state/workspace.js';
export function mountDataSettings() {
  const panel=document.querySelector('#data-settings');if(!panel)return;
  panel.innerHTML=`<section class="form-panel data-panel"><div><div class="eyebrow">YOUR MUSIC, IN YOUR HANDS</div><h2>A little peace of mind.</h2><p>Your collection lives on this device. A library backup keeps playlists, favorites, preferences and your current draft together in one portable file.</p></div><div class="data-actions"><button class="secondary-button" id="backup-library">Download library backup ↓</button><label class="restore-input">Restore a backup<input type="file" id="restore-library-file" accept=".json,application/json"><small>Waveform library JSON · up to 5 MB</small></label></div><p id="backup-status" role="status"></p><div id="restore-preview"></div></section>`;
  panel.querySelector('#backup-library').onclick=()=>{
    const status=panel.querySelector('#backup-status');
    try{const text=createBackup(store.read(),draft.snapshot());const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`waveform-library-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Your library backup is ready. Keep this file somewhere safe.';}
    catch(error){status.textContent=error.message;}
  };
  let version=0;
  panel.querySelector('#restore-library-file').onchange=async event=>{
    const request=++version,file=event.target.files[0],preview=panel.querySelector('#restore-preview');preview.replaceChildren();if(!file)return;
    try{
      if(file.size>BACKUP_LIMIT)throw Error('Choose a backup smaller than 5 MB.');
      const backup=parseBackup(new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()));
      if(!preview.isConnected||request!==version)return;
      preview.innerHTML=`<div class="import-result"><h3>Bring your collection back.</h3><p>${backup.state.playlists.length} playlists · ${Object.values(backup.state.feedback).filter(v=>v==='like').length} favorites. Existing playlists stay; any conflicting versions are restored as separate copies.</p><label class="restore-option"><input type="checkbox" id="restore-preferences"> Also use the preferences from this backup</label><button class="primary-button" id="confirm-library-restore">Restore to this library</button><button class="text-button" id="cancel-library-restore">Cancel</button><p id="restore-status" role="status"></p></div>`;
      preview.querySelector('#cancel-library-restore').onclick=()=>{++version;preview.replaceChildren();};
      preview.querySelector('#confirm-library-restore').onclick=()=>{
        try{const merged=mergeBackup(store.read(),backup,{includePreferences:preview.querySelector('#restore-preferences').checked});store.change(state=>Object.assign(state,merged.state));
          if(backup.draft?.tracks?.length){const copy={title:backup.draft.title.slice(0,80),description:backup.draft.description.slice(0,500),tracks:backup.draft.tracks,context:backup.draft.context || null};
            // Keep the current editor untouched; make the old draft an explicit downloadable copy.
            const draftButton=document.createElement('button');draftButton.className='text-button';draftButton.textContent='Download the backup’s draft';draftButton.onclick=async()=>{const {downloadPlaylist}=await import('../playlists/export.js');downloadPlaylist(copy,'json');};preview.append(draftButton);}
          preview.querySelector('#restore-status').textContent=store.warning || `${merged.added} playlists restored${merged.copied?` (${merged.copied} as separate copies)`:''}. Your current editor is unchanged.`;
          preview.querySelector('#confirm-library-restore').disabled=true;loadWorkspace();if(preview.querySelector('#restore-preferences').checked)document.querySelector('#profile-form')?.dispatchEvent(new CustomEvent('waveform-profile-restored',{detail:store.read().profile}));window.dispatchEvent(new Event('waveform-library-changed'));
        }catch(error){preview.querySelector('#restore-status').textContent=error.message;}
      };
    }catch(error){if(preview.isConnected&&request===version)preview.textContent=`${error.message} Your library hasn’t changed.`;}
  };
}
