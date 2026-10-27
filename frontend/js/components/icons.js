const paths = {
 home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 discover: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/>',
 library: '<path d="M4 4v16M9 4v16m5-15 5-1 3 15-5 1z"/>',
 playlists: '<path d="M4 6h12M4 11h10M4 16h7m7-5v10m-4-5h8"/>',
 insights: '<path d="M5 20V10m7 10V4m7 16v-8"/>',
 explorer: '<path d="m8 4-5 8 5 8m8-16 5 8-5 8M14 3l-4 18"/>',
 settings: '<circle cx="12" cy="12" r="3"/><path d="m10 3-1 3-3 1-3 3 2 3-1 4 4 1 2 3 3-2 4 1 1-4 3-2-2-3 1-4-4-1-2-3z"/>',
 search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
 arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
 play: '<path d="m9 5 11 7-11 7z"/>',
 previous: '<path d="M5 5v14m14-14L8 12l11 7z"/>',
 next: '<path d="M19 5v14M5 5l11 7-11 7z"/>',
 shuffle: '<path d="M3 6h3l12 12h3m-4-4 4 4-4 3M3 18h3l4-4m4-4 4-4h3m-4-3 4 3-4 4"/>',
 repeat: '<path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3"/>',
 volume: '<path d="M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 heart: '<path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-4 4 1 9 8 15 7-6 12-11 8-15z"/>',
 menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
 spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
 sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
 headphones: '<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12h3v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1m16 0h-3v9h3a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1"/>',
};
export const icon = (name, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
export const logo = '<span class="wave-mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';
