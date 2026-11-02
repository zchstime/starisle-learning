import {PICTURE_GRIDS} from './playful.js';
import {discoveryArt} from './discovery-art.js';
const bear='<g fill="#d6b18a" stroke="#aa8464" stroke-width="2"><circle cx="36" cy="29" r="10"/><circle cx="64" cy="29" r="10"/><ellipse cx="50" cy="67" rx="23" ry="25"/><circle cx="50" cy="42" r="25"/></g><ellipse cx="50" cy="50" rx="12" ry="9" fill="#fff0ce"/><path d="m46 47 4 4 4-4" fill="#856850"/><g fill="#526d71"><circle cx="40" cy="39" r="2.5"/><circle cx="60" cy="39" r="2.5"/></g>';
export const boxArt='<rect x="33" y="40" width="34" height="33" rx="4" fill="#ddc29b" stroke="#ae916e" stroke-width="2"/><path d="M33 48h34m-23-7v7m13-7v7" stroke="#b99b77" stroke-width="2"/>';
const pictures={
 boat:'<rect width="100" height="100" fill="#d9eceb"/><circle cx="77" cy="21" r="11" fill="#f2d18b"/><path d="M0 77q15-9 30 0t30 0 40 0v23H0Z" fill="#9fc9ce"/><path d="m17 68 13 16h42l13-16Z" fill="#d8ae83" stroke="#a7896e" stroke-width="2"/><path d="M49 16v52M46 21 20 61h26Zm7 10v30h24Z" fill="#fff2d3" stroke="#a7896e" stroke-width="2"/>',
 house:'<rect width="100" height="100" fill="#e3edda"/><circle cx="79" cy="19" r="11" fill="#f1d18b"/><path d="M0 82q50-14 100 0v18H0Z" fill="#b3cba2"/><path d="M22 43h56v43H22Z" fill="#f3d9ad" stroke="#ae9676" stroke-width="2"/><path d="m13 43 37-30 37 30Z" fill="#dfa39a" stroke="#af7e76" stroke-width="2"/><path d="M45 86V60h16v26" fill="#95bdb6" stroke="#7c9e96" stroke-width="2"/><rect x="29" y="53" width="12" height="14" rx="2" fill="#b7d7d5"/>',
 fish:'<rect width="100" height="100" fill="#d9ebea"/><path d="m71 50 21-22v44Z" fill="#dfb28c" stroke="#b58e6d" stroke-width="2"/><ellipse cx="44" cy="50" rx="32" ry="24" fill="#efcc88" stroke="#b69867" stroke-width="2"/><path d="M41 35q13 15 0 30M52 34q13 16 0 32" fill="none" stroke="#dfa39a" stroke-width="6"/><circle cx="26" cy="45" r="4" fill="#54757b"/><path d="M26 58q6 5 10 0" fill="none" stroke="#9a805f" stroke-width="2"/><g fill="none" stroke="#a4c8cd" stroke-width="2"><circle cx="17" cy="19" r="6"/><circle cx="8" cy="31" r="3"/></g><path d="M10 100q-5-13 1-22m72 22q9-16 4-26" stroke="#92b69d" stroke-width="5" fill="none"/>'
};
function symmetrical(name){
 if(name==='butterfly')return discoveryArt('butterfly');
 if(name==='leaf')return '<path d="M50 10Q4 45 50 89 96 45 50 10Z" fill="#a7c59b" stroke="#739b7c" stroke-width="3"/><path d="M50 19v68m0-25L29 43m21 19 21-19m-21 2L37 31m13 14 13-14" stroke="#7ea486" stroke-width="3" fill="none"/>';
 if(name==='flower')return '<g fill="#e6b0ba" stroke="#ba8d9b" stroke-width="2"><ellipse cx="50" cy="26" rx="14" ry="21"/><ellipse cx="50" cy="74" rx="14" ry="21"/><ellipse cx="26" cy="50" rx="21" ry="14"/><ellipse cx="74" cy="50" rx="21" ry="14"/></g><circle cx="50" cy="50" r="17" fill="#f1d38b" stroke="#c3a367" stroke-width="2"/>';
 return '<path d="m50 7 32 35-32 39-32-39Z" fill="#efd18c" stroke="#b99a71" stroke-width="3"/><path d="M50 7v74M18 42h64" stroke="#c4a584" stroke-width="2"/><path d="m50 81 0 15m-8-6 8-4 8 4-8 4Z" fill="#dfaba4" stroke="#b68a83" stroke-width="2"/>';
}
export function playfulArt(name){
 if(name==='box-scene')return boxArt;
 if(name.startsWith('bear-')){const pos={above:[34,3],below:[34,70],inside:[35,39],left:[0,39],right:[68,39]}[name.slice(5)];if(!pos)return null;return boxArt+`<svg x="${pos[0]}" y="${pos[1]}" width="32" height="32" viewBox="0 0 100 100">${bear}</svg>`;}
 if(name.startsWith('quantity-')||name.startsWith('dots-')){
  const fruit=name.startsWith('quantity-'),n=Number(name.split('-')[1]),points=[[30,32],[68,32],[30,61],[68,61],[49,78]].slice(0,n);
  return `<rect x="8" y="8" width="84" height="84" rx="15" fill="${fruit?'#fff3d9':'#e8e5d1'}" stroke="#c2af8b" stroke-width="2"/>`+points.map(([x,y])=>fruit?`<path d="M${x} ${y-8}c-14-9-18 11-6 17q6 5 12 0c12-6 8-26-6-17Z" fill="#df9d8c" stroke="#b88073" stroke-width="1.5"/><path d="m${x} ${y-8} 3-7" stroke="#829d70" stroke-width="3"/>`:`<circle cx="${x}" cy="${y}" r="7" fill="#759d91"/>`).join('');
 }
 if(name.startsWith('whole-'))return symmetrical(name.slice(6));
 if(name.startsWith('mirror-')){const [,side,shape]=name.split('-');return `<svg x="0" y="0" width="100" height="100" viewBox="${side==='left'?0:50} 0 50 100" preserveAspectRatio="none">${symmetrical(shape)}</svg>`;}
 if(name.startsWith('picture-'))return pictures[name.slice(8)]||null;
 if(name.startsWith('puzzle-')){const [,pic,index]=name.split('-'),[cols,rows]=PICTURE_GRIDS[pic]||[1,1],i=Number(index);return `<svg width="100" height="100" viewBox="${i%cols*100/cols} ${Math.floor(i/cols)*100/rows} ${100/cols} ${100/rows}" preserveAspectRatio="none">${pictures[pic]||''}</svg>`;}
 const fixed={
  rain:'<path d="M19 49C1 27 33 17 43 28 57 4 89 21 83 40c20 5 9 23-6 20H24Z" fill="#b2cbd0" stroke="#8eacb6" stroke-width="3"/><path d="m28 70-5 10m29-10-5 10m29-10-5 10" stroke="#82b4c7" stroke-width="5" stroke-linecap="round"/>',
  snow:'<g stroke="#8fbbc7" stroke-width="5" stroke-linecap="round"><path d="M50 12v76M17 31l66 38M17 69l66-38m-43-9 10 10 10-10m-20 56 10-10 10 10M23 46l14-4-4-14m34 44-4-14 14-4m-54 0 14 4-4 14m34-44-4 14 14 4"/></g>',
  umbrella:'<path d="M50 20v59q0 16-14 10" fill="none" stroke="#b18c66" stroke-width="5" stroke-linecap="round"/><path d="M10 51q40-68 80 0-13-12-26 0-14-12-28 0-13-12-26 0Z" fill="#9fc3c4" stroke="#72999f" stroke-width="3"/><path d="M50 18q-14 11-14 33m14-33q14 11 14 33" fill="none" stroke="#d9e5d6" stroke-width="3"/>',
  sunhat:'<ellipse cx="50" cy="67" rx="42" ry="15" fill="#edcc8e" stroke="#b99b6c" stroke-width="3"/><path d="M24 61q-2-46 26-43 28-3 26 43Z" fill="#f4dfb0" stroke="#b99b6c" stroke-width="3"/><path d="M24 53q26 9 52 0v10q-26 12-52 0Z" fill="#a0bfb1"/>',
  scarf:'<path d="M24 18h52v22H24Zm16 22h20v48H40Zm20 0h16v34H60Z" fill="#deb2ac" stroke="#ad8584" stroke-width="3"/><path d="M40 55h20m-20 17h20m0-17h16M45 88v6m9-6v6m10-20v6m8-6v6" stroke="#fff0d7" stroke-width="4"/>',
  boots:'<path d="M13 17h27v46l11 9v15H12V70Zm42 0h27v46l11 9v15H54V70Z" fill="#b1c7a1" stroke="#819e80" stroke-width="3"/><path d="M12 24h29m13 0h29M12 80h39m3 0h39" stroke="#e7dfb8" stroke-width="6"/>',
  drum:'<path d="M19 38v39q31 23 62 0V38" fill="#dca79b" stroke="#ad8277" stroke-width="3"/><ellipse cx="50" cy="38" rx="31" ry="12" fill="#fff0cf" stroke="#ad8277" stroke-width="3"/><path d="m22 47 12 30 15-28 16 28 14-30" fill="none" stroke="#f3d2a3" stroke-width="3"/><path d="m25 11 45 18m6-20L35 29" stroke="#b59873" stroke-width="5" stroke-linecap="round"/>',
  bell:'<path d="M28 58c11-13 0-37 22-38 22 1 11 25 22 38l9 11H19Z" fill="#edcc86" stroke="#b99a67" stroke-width="3"/><path d="M43 76q7 14 14 0M50 12v8" fill="none" stroke="#b99a67" stroke-width="5" stroke-linecap="round"/>',
  chime:'<path d="m20 76 60-14" stroke="#b6a07d" stroke-width="7"/><g stroke="#8aa39b" stroke-width="2"><rect x="16" y="27" width="16" height="56" rx="5" fill="#a7c7b7"/><rect x="37" y="26" width="16" height="47" rx="5" fill="#efcf91"/><rect x="58" y="25" width="16" height="39" rx="5" fill="#dfa99f"/></g><path d="m82 15-35 42" stroke="#b59873" stroke-width="5" stroke-linecap="round"/><circle cx="82" cy="15" r="7" fill="#edc78d"/>'
 };
 return fixed[name]||null;
}
export function playfulScene(kind,toy){
 const base='<rect x="38" y="32" width="244" height="155" rx="20" fill="#ead7b6" stroke="#c5aa83" stroke-width="3"/><rect x="47" y="41" width="226" height="137" rx="15" fill="#fff6e0"/>';
 if(kind==='counting')return base+toy('dots-2',58,55,72,72)+toy('quantity-2',58,118,72,60)+toy('dots-4',185,55,72,72)+toy('quantity-4',185,118,72,60);
 if(kind==='spatial')return base+toy('bear-above',65,43,190,140);
 if(kind==='mirror')return base+toy('whole-butterfly',88,46,145,135)+'<path d="M160 43v136" stroke="#bca67e" stroke-width="2" stroke-dasharray="5 5"/>';
 if(kind==='weather')return base+toy('sun',66,45,64,64)+toy('sunhat',65,110,66,66)+toy('rain',190,45,64,64)+toy('umbrella',190,110,66,66);
 if(kind==='puzzle')return base+toy('picture-boat',78,49,164,120)+'<path d="M160 48v122" stroke="#fff5dc" stroke-width="4"/>';
 if(kind==='rhythm')return base+toy('drum',48,75,84,84)+toy('bell',127,58,70,70)+toy('chime',196,85,75,75);
 return '';
}
