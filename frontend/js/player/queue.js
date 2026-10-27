/** Pure queue policy, shared by the audio controller and deterministic tests. */
export function nextIndex(index, length, options = {}) {
  const {shuffle = false, repeat = 'off', ended = false, random = Math.random, visited = [index]} = options;
  if (!length || index < 0) return -1;
  if (ended && repeat === 'one') return index;
  if (shuffle && length > 1) {
    let candidates = Array.from({length}, (_, item) => item).filter(item => item !== index && !visited.includes(item));
    if (!candidates.length && repeat === 'all') {
      candidates = Array.from({length}, (_, item) => item).filter(item => item !== index);
    }
    return candidates.length ? candidates[Math.floor(random() * candidates.length)] : -1;
  }
  if (index + 1 < length) return index + 1;
  return repeat === 'all' ? 0 : -1;
}

export const nextRepeat = repeat => ({off:'all', all:'one', one:'off'})[repeat];
