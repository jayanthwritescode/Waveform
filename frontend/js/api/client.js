// Local default; override before module load using window.WAVEFORM_API_BASE.
const base = (window.WAVEFORM_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
export async function getHealth() {
 const response = await fetch(`${base}/api/health`, {signal: AbortSignal.timeout(5000)});
 if (!response.ok) throw new Error(`Backend returned ${response.status}`);
 return response.json();
}
