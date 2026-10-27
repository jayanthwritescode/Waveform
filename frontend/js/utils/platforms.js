/** Search interfaces only: no account tokens, guessed track IDs, or transfer claims. */
export function platformSearches(track) {
  const query = `${track.artist} ${track.title}`.trim();
  return [
    {name:'Spotify', url:`https://open.spotify.com/search/${encodeURIComponent(query)}`},
    {name:'Apple Music', url:`https://music.apple.com/us/search?term=${encodeURIComponent(query)}`},
    {name:'YouTube Music', url:`https://music.youtube.com/search?q=${encodeURIComponent(query)}`},
  ];
}

export const localArtwork = track => /^assets\/images\/(?:mark|catalogue-[1-8])\.svg$/.test(track.artwork) ? track.artwork : 'assets/images/mark.svg';
