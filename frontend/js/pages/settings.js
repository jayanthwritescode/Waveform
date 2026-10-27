import {escapeHtml as html} from '../utils/html.js';
import {workspace, updateProfile} from '../state/workspace.js';
import {getProfile, saveProfile} from '../api/client.js';

export const settingsPage = () => `<section class="page-intro"><div><div class="eyebrow">MAKE IT YOURS</div><h1>Settings<span class="title-dot">.</span></h1><p>Your local profile and musical preferences.</p></div></section><div id="profile-panel" class="catalogue-state" role="status">Loading your preferences…</div>`;

export async function mountSettings(isCurrent) {
  try {
    const profile = await getProfile();
    if (!isCurrent()) return;
    updateProfile(profile);
    document.querySelector('#profile-panel').outerHTML = profileForm(profile);
    const form = document.querySelector('#profile-form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const status = form.querySelector('[role=status]');
      const button = form.querySelector('button');
      const fields = new FormData(form);
      const lines = name => fields.get(name).split('\n').map(value=>value.trim()).filter(Boolean);
      const payload = {name:fields.get('name'), favorite_genres:lines('favorite_genres'), disliked_genres:lines('disliked_genres'), favorite_artists:lines('favorite_artists'),
        energy_min:Number(fields.get('energy_min')) / 100, energy_max:Number(fields.get('energy_max')) / 100,
        discovery_preference:Number(fields.get('discovery_preference')) / 100,
        instrumental_preference:fields.get('instrumental_preference'), revision:profile.revision};
      button.disabled = true; status.textContent = 'Saving preferences…';
      try {
        const saved = await saveProfile(payload);
        Object.assign(profile, saved); updateProfile(saved);
        status.textContent = 'Preferences saved locally.';
      } catch (error) {status.textContent = error.message || 'Preferences could not be saved. Your form is kept; check the backend and retry.';}
      finally {button.disabled = false;}
    });
  } catch (error) {
    if (isCurrent()) document.querySelector('#profile-panel').innerHTML = '<h2>Preferences unavailable.</h2><p>Start the backend and check the database configuration, then retry.</p><button class="secondary-button" data-retry-page>Try again</button>';
  }
}

function profileForm(profile) {
  const list = (name,label) => `<label>${label}<textarea name="${name}" rows="3" maxlength="12000">${html(profile[name].join('\n'))}</textarea><small>One per line.</small></label>`;
  return `<form id="profile-form" class="profile-form"><section class="form-panel"><h2>Your profile</h2><label>Profile name<input name="name" required maxlength="80" value="${html(profile.name)}"></label><p>Stored in your local Waveform database. No platform account is connected.</p></section>
    <section class="form-panel"><h2>Your musical taste</h2><div class="preference-grid">${list('favorite_genres','Favorite genres')}${list('disliked_genres','Disliked genres')}${list('favorite_artists','Favorite artists')}</div><div class="preference-grid"><label>Minimum energy (%)<input type="number" name="energy_min" min="0" max="100" required value="${profile.energy_min*100}"></label><label>Maximum energy (%)<input type="number" name="energy_max" min="0" max="100" required value="${profile.energy_max*100}"></label><label>Discovery preference (%)<input type="number" name="discovery_preference" min="0" max="100" required value="${profile.discovery_preference*100}"><small>0 = familiar, 100 = more discovery.</small></label><label>Instrumental preference<select name="instrumental_preference">${[['any','No preference'],['prefer','Prefer instrumental'],['avoid','Prefer vocals']].map(([value,label])=>`<option value="${value}" ${profile.instrumental_preference===value?'selected':''}>${label}</option>`).join('')}</select></label></div><p>Generate content recommendations to apply these preferences to available features. Catalogue browsing order stays fixed. Familiarity/discovery blending remains reserved for a later phase.</p></section><div class="form-actions"><button class="primary-button" type="submit">Save preferences</button><span role="status" aria-live="polite"></span></div></form>`;
}
