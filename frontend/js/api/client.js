// Browser-visible configuration; never place credentials here.
const base = (window.WAVEFORM_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function request(path, {method = 'GET', body, signal, blob = false} = {}) {
  let response;
  try {response = await fetch(`${base}${path}`, {
    method, signal:signal || AbortSignal.timeout(10000),
    headers:body === undefined ? {} : {'Content-Type':'application/json'},
    body:body === undefined ? undefined : JSON.stringify(body),
  });} catch (error) {
    throw new Error(error.name === 'AbortError' || error.name === 'TimeoutError'
      ? 'The backend request timed out. Your draft is kept; retry.'
      : 'Cannot reach the Waveform backend. Start it on port 8000 and retry; your draft is kept.');
  }
  if (!response.ok) {
    let detail;
    try {detail = (await response.json()).detail;} catch { /* Use the HTTP fallback. */ }
    if (Array.isArray(detail)) detail = detail.map(item => item.msg).join('; ');
    const error = new Error(typeof detail === 'string' ? detail : `Server returned ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  if (blob) return response.blob();
  return response.status === 204 ? null : response.json();
}

export const getHealth = () => request('/api/health');
export const getTracks = (filters = {}, signal) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '' && value != null) params.set(key, String(value));
  }
  return request(`/api/tracks?${params}`, {signal});
};
export const getTrack = id => request(`/api/tracks/${encodeURIComponent(id)}`);
export const getProfile = () => request('/api/profile');
export const saveProfile = profile => request('/api/profile', {method:'PUT',body:profile});
export const getFeedback = () => request('/api/feedback');
export const setFeedback = (id, value) => request(`/api/feedback/${encodeURIComponent(id)}`, {method:'PUT',body:{value}});
export const getLibrary = () => request('/api/library');
export const getPlaylist = id => request(`/api/playlists/${encodeURIComponent(id)}`);
export const savePlaylist = (payload, id) => request(id ? `/api/playlists/${encodeURIComponent(id)}` : '/api/playlists', {method:id ? 'PUT' : 'POST',body:payload});
export const deletePlaylist = (id, revision) => request(`/api/playlists/${encodeURIComponent(id)}?revision=${revision}`, {method:'DELETE'});
export const exportPlaylist = (payload, format) => request(`/api/playlist-export?format=${format}`, {method:'POST',body:payload,blob:true});
export const previewImport = (content, format) => request('/api/playlist-import', {method:'POST',body:{content,format}});

export const exportSaved = (id, format) => request(`/api/playlists/${encodeURIComponent(id)}/export?format=${format}`, {blob:true});
export const getRecommendationModel = () => request('/api/recommendations/model');
export const generateRecommendations = payload => request('/api/recommendations', {method:'POST',body:payload});
export const getRecommendationSession = id => request(`/api/recommendations/sessions/${encodeURIComponent(id)}`);

export const getContextModel = () => request('/api/recommendations/context/model');
export const generateContextRecommendations = payload => request('/api/recommendations/context', {method:'POST',body:payload});

export const getHybridModel = () => request('/api/recommendations/hybrid/model');
export const generateHybridRecommendations = payload => request('/api/recommendations/hybrid', {method:'POST',body:payload});
export const compareRecommendations = payload => request('/api/recommendations/compare', {method:'POST',body:payload});
export const getArtistModel = () => request('/api/experiments/collaborative/model');
export const findArtists = q => request('/api/experiments/collaborative/artists?q='+encodeURIComponent(q));
export const recommendArtists = payload => request('/api/experiments/collaborative', {method:'POST',body:payload});

export const getInsights = (days=30) => request('/api/insights?days='+days);
export const getEvaluation = () => request('/api/evaluation');
