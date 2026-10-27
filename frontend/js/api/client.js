// Browser-visible configuration; never place credentials here.
const base = (window.WAVEFORM_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function request(path, signal) {
  const response = await fetch(`${base}${path}`, {signal: signal || AbortSignal.timeout(8000)});
  if (!response.ok) {
    const error = new Error(response.status === 404 ? 'Track not found.' : `Server returned ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export const getHealth = () => request('/api/health');
export const getTracks = (filters = {}, signal) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '' && value != null) params.set(key, String(value));
  }
  return request(`/api/tracks?${params}`, signal);
};
export const getTrack = id => request(`/api/tracks/${encodeURIComponent(id)}`);
