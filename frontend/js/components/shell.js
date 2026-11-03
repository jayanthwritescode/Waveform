import {icon, logo} from './icons.js';
export const routes = [['home','Home','home'],['discover','Discover','discover'],['vibe','Vibe Control','spark'],['builder','Playlist Builder','playlists'],['library','Your Library','library'],['settings','Settings','settings'],['insights','Taste Insights','insights']];
export function renderShell() {
 document.querySelector('#sidebar').innerHTML = `<a class="brand" href="#/home" aria-label="Waveform home">${logo}<span>waveform<span class="brand-dot">.</span></span></a>
 <div class="nav-label">YOUR SPACE</div><nav>${routes.slice(0,3).map(navLink).join('')}
 <div class="nav-label collection-label">COLLECTION</div>${[routes[3],routes[4],routes[6]].map(navLink).join('')}</nav>
 <div class="sidebar-bottom"><div class="foundation-card"><span class="small-overline">A NEW FREQUENCY</span><strong>Made for your moment.</strong><p>Your music. Your moment.</p><a href="#/vibe">Explore Vibe Control ${icon('arrow')}</a></div>${navLink(routes[5])}<div class="profile"><span class="avatar">Y</span><div><strong>Your space</strong><small>Local workspace</small></div><span class="profile-dot"></span></div></div>`;
 document.querySelector('#topbar').innerHTML = `<div class="topbar-left"><button class="icon-button menu-button" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button><span class="breadcrumb">Your space <span>/</span> <strong id="breadcrumb">Home</strong></span></div><div class="topbar-right"><span class="phase-badge"><span></span> Playlist workspace</span><a class="top-avatar" href="#/settings" aria-label="Open settings">Y</a></div>`;
 document.querySelector('.menu-button').addEventListener('click',()=>setNavigationOpen(!document.body.classList.contains('nav-open'),true));
 const mobile=matchMedia('(max-width:680px)');mobile.addEventListener('change',()=>setNavigationOpen(false));setNavigationOpen(false);
}
function navLink([id,label,symbol]) {return `<a class="nav-link" href="#/${id}" data-route="${id}">${icon(symbol)}<span>${label}</span>${id==='vibe'?'<span class="new-dot"></span>':''}</a>`;}

export function setNavigationOpen(open,focus=false) {
  const mobile=matchMedia('(max-width:680px)').matches,sidebar=document.querySelector('#sidebar'),button=document.querySelector('.menu-button');
  document.body.classList.toggle('nav-open',mobile&&open);sidebar.inert=mobile&&!open;
  if(mobile&&!open)sidebar.setAttribute('aria-hidden','true');else sidebar.removeAttribute('aria-hidden');
  button.setAttribute('aria-expanded',String(mobile&&open));button.setAttribute('aria-label',mobile&&open?'Close navigation':'Open navigation');
  if(mobile&&open&&focus)sidebar.querySelector('[aria-current=page]')?.focus();
}
