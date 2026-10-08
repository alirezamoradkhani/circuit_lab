const paths={
 hand:'M9 12V5a2 2 0 014 0v6m0-4a2 2 0 014 0v5m0-3a2 2 0 014 0v6c0 4-3 7-7 7h-1c-2 0-4-1-5-3l-4-6a2 2 0 013-2l2 2',
 cable:'M7 3v5m4-5v5M5 8h8v3a4 4 0 01-8 0V8zm4 7v2a4 4 0 008 0v-3m-2 0h4',
 meter:'M6 3h12v18H6zM9 6h6v5H9zm1 10h4m-2-2v4',
 bag:'M5 7h14v14H5zM9 7V4h6v3M5 11h14m-8 0v3h2v-3',
 hint:'M9 18h6m-5 3h4M8 13a6 6 0 118 0l-1 2H9z',
 reset:'M4 10a8 8 0 111 8M4 4v6h6',
 sound:'M3 9h4l5-4v14l-5-4H3zm12-1a6 6 0 010 8m3-11a10 10 0 010 14',
 view:'M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm13 0a3 3 0 11-6 0 3 3 0 016 0',
 battery:'M5 6h13v12H5zm13 4h3v4h-3M8 9v6m4-6v6',
 close:'M6 6l12 12M18 6L6 18',
 receipt:'M6 3h12v18l-3-2-3 2-3-2-3 2zm3 5h6m-6 4h6',
 arrow:'M4 12h16m-6-6l6 6-6 6',
 socket:'M12 3v5m-4 4h8m-8 4h8M5 8h14v13H5z',
 cart:'M3 5h2l3 12h10l3-8H6M9 21h1m7 0h1',
};
export function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ '<path d="'+(paths[name]||paths.socket)+'"/></svg>';}
