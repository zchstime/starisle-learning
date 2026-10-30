/* Web adapter: keep the Cocos scene and its current curriculum session alive. */
(()=>{
 if(window.starisleArcade)return;
 let frame,returnFocus,parentSound=null,parentSoundEnabled=false,previousOverflow='',currentMode='sling';
 // Temporarily silence the island without changing the player's saved preference.
 const quietIsland=async expected=>{try{const cc=await window.System?.import('cc');if(frame!==expected)return;const host=cc?.director?.getScene()?.getComponentInChildren('StarIsle');const bank=host?.adventure?.sounds;if(bank){parentSound=bank;parentSoundEnabled=bank.status.enabled;bank.setEnabled(false);}}catch(error){console.warn('Island audio handoff unavailable',error);}};
 const close=()=>{if(!frame)return;frame.remove();frame=null;if(parentSound){parentSound.setEnabled(parentSoundEnabled);parentSound=null;}document.body.style.overflow=previousOverflow;returnFocus?.focus?.();window.dispatchEvent(new CustomEvent('starisle:arcade-return',{detail:currentMode}));};
 const open=(mode='sling')=>{if(frame)return;currentMode=mode;returnFocus=document.activeElement;previousOverflow=document.body.style.overflow;frame=document.createElement('iframe');frame.src=mode==='kindergarten'?'/arcade/kindergarten/index.html':'/arcade/index.html?mode='+(['sling','balance','defense'].includes(mode)?mode:'sling');frame.title=mode==='kindergarten'?'星屿幼儿园小岛':'星屿游乐实验室';frame.setAttribute('role','dialog');frame.setAttribute('aria-modal','true');frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:12000;background:#f4f5ed';document.body.append(frame);document.body.style.overflow='hidden';frame.focus();void quietIsland(frame);};
 window.starisleArcade={open,close};
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame?.contentWindow&&e.data?.type==='starisle:arcade-close')close();});
 // Entries are owned by the grade directory in Adventure; no floating controls.
})();
