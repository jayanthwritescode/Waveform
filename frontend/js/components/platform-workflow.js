import {escapeHtml as html} from '../utils/html.js';
import {platformSearches} from '../utils/platforms.js';
import {draft} from '../state/draft.js';
export const searchList = tracks => tracks.map(track=>`${track.artist} - ${track.title}`).join('\n');
export function platformWorkflow(snapshot) {
  return `<section id="platform-workflow" class="music-section">${workflowBody(snapshot)}</section>`;
}
export function workflowBody(snapshot){
  if(!snapshot.tracks.length)return '';
  return `<details class="transfer-guide" id="transfer-guide"><summary>Transfer your playlist · CSV / Soundiiz</summary><p>Waveform downloads metadata only. No streaming account or subscription is required to use Waveform.</p><ol><li>Download CSV above (title, artist, album, ISRC and duration in seconds).</li><li>Open <a href="https://soundiiz.com/" target="_blank" rel="noopener noreferrer">Soundiiz ↗</a> and sign in there if you choose to use it.</li><li>In Playlists, select Import Playlist → From File, then upload your CSV. Or use From Plain Text with the copied Artist - Title list.</li><li>Review matches, choose the destination and follow Soundiiz’s confirmation steps. It may require connecting a streaming account there.</li><li>Check missing songs, alternate versions and destination availability. Waveform cannot verify that a transfer succeeded.</li></ol><p>Soundiiz is an independent optional service with its own account, policies and plan limits; some features may require payment. Manual track search links below remain available without a transfer service.</p><a class="text-link" href="https://support.soundiiz.com/hc/en-us/articles/360010006793-What-is-the-CSV-format-to-import-playlists-and-favorites" target="_blank" rel="noopener noreferrer">Official CSV format ↗</a> · <a class="text-link" href="https://support.soundiiz.com/hc/en-us/articles/37958924057234-How-to-Import-a-Playlist-from-a-URL-CSV-File-or-Plain-Text" target="_blank" rel="noopener noreferrer">Official import steps ↗</a></details><details class="search-workflow"><summary>Find this playlist on your music service</summary><p>Search one track at a time and review artist, version and duration in the destination. These links do not verify availability or create a playlist.</p><label>Search service<select id="search-service">${['Spotify','Apple Music','YouTube Music'].map((name,index)=>`<option value="${index}">${name}</option>`).join('')}</select></label><button class="secondary-button" id="copy-search-list" type="button">Copy artist/title list</button><p id="search-copy-status" role="status"></p><textarea id="search-list-fallback" aria-label="Artist and title list to copy manually" rows="5" readonly hidden></textarea><ol>${snapshot.tracks.map((track,index)=>{const query=`${track.artist} ${track.title}`;const provider=platformSearches(track)[0];return `<li><label>Search query ${index+1}<input data-platform-query maxlength="400" value="${html(query)}"></label><a class="text-link" data-platform-open href="${html(provider.url)}" target="_blank" rel="noopener noreferrer">Search Spotify ↗</a><small>${html(track.artist)} · ${html(track.title)} · ${track.duration_seconds ? track.duration_seconds+' seconds' : 'duration unknown'}</small></li>`;}).join('')}</ol></details>`;
}
export function updateSearchLinks(){
  const providerIndex=Number(document.querySelector('#search-service')?.value || 0);
  document.querySelectorAll('#platform-workflow li').forEach(row=>{
    const query=row.querySelector('[data-platform-query]').value;
    const provider=platformSearches({artist:'',title:''},query)[providerIndex];
    const link=row.querySelector('[data-platform-open]');link.href=provider.url;link.textContent=`Search ${provider.name} ↗`;
  });
}
export async function copySearchList(){
  const value=searchList(draft.snapshot().tracks),status=document.querySelector('#search-copy-status');
  try{await navigator.clipboard.writeText(value);if(status.isConnected)status.textContent='Artist/title list copied. No playlist was transferred.';}
  catch {if(!status.isConnected)return;const field=document.querySelector('#search-list-fallback');field.hidden=false;field.value=value;field.focus();field.select();status.textContent='Automatic copy is unavailable. Select and copy the list below.';}
}
