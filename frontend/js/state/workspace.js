import {getProfile, getFeedback, setFeedback} from '../api/client.js';
export const workspace = {profile:null, feedback:{}, ready:false, error:null, pending:new Set()};
const listeners = new Set();
export const subscribeWorkspace = callback => {listeners.add(callback); return () => listeners.delete(callback);};
const notify = () => listeners.forEach(callback => callback());

export async function loadWorkspace() {
  try {
    const [profile, feedback] = await Promise.all([getProfile(), getFeedback()]);
    Object.assign(workspace, {profile, feedback, ready:true, error:null});
  } catch (error) {
    workspace.error = error.message || 'Local preferences are unavailable. Start the backend and retry.';
  }
  notify();
}

export function updateProfile(profile) {workspace.profile = profile; notify();}

export async function toggleFeedback(id, value) {
  if (!workspace.ready || workspace.pending.has(id)) return;
  workspace.pending.add(id); notify();
  try {
    const result = await setFeedback(id, workspace.feedback[id] === value ? null : value);
    if (result.value) workspace.feedback[id] = result.value; else delete workspace.feedback[id];
  } finally {
    workspace.pending.delete(id); notify();
  }
}
