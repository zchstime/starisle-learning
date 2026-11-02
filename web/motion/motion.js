/* Shared presentation preferences only: never changes game state or intercepts input. */
(()=>{
 const root=document.documentElement,media=window.matchMedia('(prefers-reduced-motion: reduce)');
 const sync=()=>{let enabled=true;try{enabled=localStorage.getItem('starisle-scenery-motion')!=='off';}catch{}root.dataset.motion=enabled&&!media.matches?'on':'off';root.dataset.motionVisibility=document.hidden?'hidden':'visible';};
 media.addEventListener('change',sync);window.addEventListener('storage',sync);window.addEventListener('starisle:motion-change',sync);window.addEventListener('pageshow',sync);window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);sync();
})();
