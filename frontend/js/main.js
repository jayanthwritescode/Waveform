import {renderShell, routes} from './components/shell.js';
import {homePage} from './pages/home.js';
import {placeholderPage} from './pages/placeholder.js';
import {renderPlayer, selectSample} from './player/player.js';
import {getHealth} from './api/client.js';
import {toast} from './utils/toast.js';
renderShell();
renderPlayer();
function navigate() {
 const requested = location.hash.replace('#/', '') || 'home';
 const route = routes.some(([id]) => id === requested) ? requested : 'home';
 if (requested !== route || !location.hash) history.replaceState(null, '', '#/home');
 const title = routes.find(([id]) => id === route)[1];
 document.title = `${title} — Waveform`;
 document.querySelector('#breadcrumb').textContent = title;
 document.querySelectorAll('[data-route]').forEach(link => {
  const active = link.dataset.route === route;
  link.classList.toggle('active', active);
  if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
 });
 document.querySelector('#main').innerHTML = route === 'home' ? homePage() : placeholderPage(route);
 document.body.classList.remove('nav-open');
 document.querySelector('.menu-button').setAttribute('aria-expanded', 'false');
 window.scrollTo({top:0, behavior:'instant'});
}
window.addEventListener('hashchange', () => { navigate(); document.querySelector('#main').focus({preventScroll:true}); });
document.addEventListener('keydown', event => {
 if (event.key === 'Escape') { document.body.classList.remove('nav-open'); document.querySelector('.menu-button').setAttribute('aria-expanded', 'false'); }
});
document.addEventListener('click', async event => {
 if (event.target.closest('.skip-link')) { event.preventDefault(); document.querySelector('#main').focus(); return; }
 const card = event.target.closest('[data-track]');
 if (card) {selectSample(card.dataset.track); toast('Sample selected. Audio playback arrives in Phase 2.');}
 if (event.target.closest('#check-health')) {
  const button = document.querySelector('#check-health');
  const status = document.querySelector('#connection-status');
  button.disabled = true; status.textContent = 'Connecting…';
  try {const health = await getHealth(); status.textContent = `${health.app}: ${health.status} · Phase ${health.phase}`;}
  catch {status.textContent = 'Backend unavailable. Start the FastAPI server on port 8000 and try again.';}
  finally {button.disabled = false;}
 }
});
navigate();
