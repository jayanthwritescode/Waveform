import {icon, logo} from './icons.js';
export const routes = [
 ['home','Home','home'], ['discover','Discover','discover'], ['vibe','Vibe Control','spark'],
 ['builder','Playlist Builder','playlists'], ['library','Your Library','library'],
 ['insights','Taste Insights','insights'], ['explorer','Recommendation Explorer','explorer'], ['settings','Settings','settings'],
];
export function renderShell() {
 document.querySelector('#sidebar').innerHTML = `<a class="brand" href="#/home" aria-label="Waveform home">${logo}<span>waveform<span class="brand-dot">.</span></span></a>
 <div class="nav-label">YOUR SPACE</div><nav>${routes.slice(0,3).map(navLink).join('')}
 <div class="nav-label collection-label">COLLECTION</div>${routes.slice(3,7).map(navLink).join('')}</nav>
 <div class="sidebar-bottom"><div class="foundation-card"><span class="small-overline">A NEW FREQUENCY</span><strong>Made for your moment.</strong><p>Your music. Your moment.</p><a href="#/vibe">Explore Vibe Control ${icon('arrow')}</a></div>${navLink(routes[7])}<div class="profile"><span class="avatar">Y</span><div><strong>Your space</strong><small>Local workspace</small></div><span class="profile-dot"></span></div></div>`;
 document.querySelector('#topbar').innerHTML = `<div class="topbar-left"><button class="icon-button menu-button" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button><span class="breadcrumb">Your space <span>/</span> <strong id="breadcrumb">Home</strong></span></div><div class="topbar-right"><span class="phase-badge"><span></span> Playlist workspace</span><a class="top-avatar" href="#/settings" aria-label="Open settings">Y</a></div>`;
 document.querySelector('.menu-button').addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('nav-open');
  document.querySelector('.menu-button').setAttribute('aria-expanded', String(isOpen));
 });
}
function navLink([id,label,symbol]) {return `<a class="nav-link" href="#/${id}" data-route="${id}">${icon(symbol)}<span>${label}</span>${id==='vibe'?'<span class="new-dot"></span>':''}</a>`;}
