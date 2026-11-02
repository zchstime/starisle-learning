import {icon} from './icons.js';
import {EXPLORATIONS} from './discovery.js';
import {discoveryScene} from './discovery-art.js';
import {playfulScene} from './playful-art.js';
export const ACTIVITIES={
 shop:{name:'准备早餐',theme:'peach',symbol:'bag',voice:'shop',hint:'shop-hint'},
 tidy:{name:'收拾小房间',theme:'blue',symbol:'shelf',voice:'tidy',hint:'tidy-hint'},
 garden:{name:'种一盆花',theme:'green',symbol:'flower',voice:'garden',hint:'garden-hint'},
 feed:{name:'照顾小兔子',theme:'green',symbol:'bunny',voice:'feed'},
 sort:{name:'分类小侦探',theme:'peach',symbol:'apple',voice:'sort'},
 build:{name:'搭一间小屋',theme:'blue',symbol:'triangle',voice:'build'},
 ...EXPLORATIONS
};
// Nested SVGs keep the same native toy artwork in both scene previews and play.
const toy=(name,x,y,w,h)=>`<g transform="translate(${x} ${y}) scale(${w/100} ${h/100})">${icon(name).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g>`;
export function scene(kind){let art=playfulScene(kind,toy)||discoveryScene(kind,toy);
 if(kind==='shop')art=`<path d="M71 63h178v119H71Z" fill="#fff4d9" stroke="#c1a38a" stroke-width="3"/><path d="m55 62 24-37h160l26 37Z" fill="#eaa79f"/><path d="m95 25-8 37m46-37-4 37m45-37 3 37m31-37 14 37" stroke="#fff1d8" stroke-width="20"/><path d="M54 62q15 21 30 0 16 21 31 0 15 21 30 0 16 21 31 0 16 21 31 0 15 21 30 0 16 21 30 0" fill="#ecc0ad"/><rect x="82" y="112" width="155" height="57" rx="8" fill="#d6ba93"/>${toy('apple',81,88,50,50)}${toy('banana',132,87,49,50)}${toy('bread',181,86,50,52)}${toy('bag',236,129,60,60)}<path d="M72 178h178" stroke="#a88c71" stroke-width="7" stroke-linecap="round"/>`;
 if(kind==='tidy')art=`<rect x="54" y="29" width="210" height="154" rx="15" fill="#f9efd9"/><rect x="64" y="40" width="76" height="127" rx="6" fill="#d7bfa0"/><path d="M70 98h63M70 157h63" stroke="#b89e7c" stroke-width="5"/>${toy('book',75,51,55,49)}${toy('teddy',74,101,51,55)}<path d="M159 116h89l-8 57h-75Z" fill="#a6c2bd" stroke="#7faaa7" stroke-width="3"/>${toy('ball',170,81,56,56)}${toy('shirt',208,32,55,55)}<path d="M45 184h232" stroke="#d6b792" stroke-width="8" stroke-linecap="round"/>`;
 if(kind==='garden')art=`<path d="M50 167V77l108-54 110 54v90Z" fill="#e9f4e4" stroke="#9eb9a5" stroke-width="4"/><path d="M158 25v141M53 82h212M93 57v108m131-108v108" stroke="#afc7b3" stroke-width="4"/><path d="m122 126 7 56h62l8-56Z" fill="#dba78d" stroke="#b48471" stroke-width="3"/>${toy('flower',112,39,97,107)}${toy('water',205,126,76,66)}<path d="M39 185h246" stroke="#d8c59e" stroke-width="7" stroke-linecap="round"/>`;
 if(kind==='feed')art=`<path d="M30 165q128-59 257 0v35H30Z" fill="#b5cda3"/><path d="M35 122h255m-250 26h245M53 102v72m35-72v57m159-57v57m35-57v72" fill="none" stroke="#ddc7a4" stroke-width="7" stroke-linecap="round"/>${toy('bunny',106,32,111,126)}<ellipse cx="166" cy="174" rx="50" ry="15" fill="#a4c7c5"/>${toy('apple',46,134,55,55)}${toy('apple',222,142,49,49)}`;
 if(kind==='sort')art=`<path d="M38 178h246" stroke="#d5bc96" stroke-width="8" stroke-linecap="round"/><path d="M50 103h85l-9 72H60Zm133 0h85l-9 72h-65Z" fill="#eacb96" stroke="#bb9a74" stroke-width="3"/><path d="M59 105q-3-51 33-46 38-5 35 46m65 0q-3-51 33-46 38-5 35 46" fill="none" stroke="#bb9a74" stroke-width="6"/>${toy('apple',61,92,64,64)}${toy('banana',194,92,64,64)}${toy('berry',129,37,58,58)}`;
 if(kind==='build')art=`<ellipse cx="158" cy="187" rx="117" ry="11" fill="#c4d2c3"/>${toy('square',77,109,87,83)}${toy('square',153,109,87,83)}${toy('triangle',109,34,98,96)}${toy('circle',234,147,51,51)}<path d="M40 190h246" stroke="#c5a884" stroke-width="7" stroke-linecap="round"/>`;
 return `<svg class="scene-art" viewBox="0 0 320 210" aria-hidden="true"><ellipse cx="270" cy="37" rx="18" ry="17" fill="#fff2c5" opacity=".8"/><path d="m34 45 3 7 8 1-6 5 1 8-6-4-7 4 2-8-6-5 8-1Z" fill="#fff8d8"/>${art}</svg>`;
}
export function homeArt(id){const types={bookshelf:'book',toybox:'teddy',wardrobe:'shirt'},type=types[id];return `<span class="storage-symbol">${icon(type)}</span><span class="storage-cubby"></span><span class="stored-items"></span>`;}
export function potArt(count=0,level=0){const colors=['#daa58e','#b3bd8e','#a0bdce'];return `<svg class="pot-art" viewBox="0 0 240 235" aria-hidden="true"><ellipse cx="120" cy="217" rx="83" ry="12" fill="#c3ccad" opacity=".4"/><path d="m61 130 13 82h92l14-82Z" fill="${colors[level]}" stroke="#a18777" stroke-width="4"/><ellipse cx="120" cy="130" rx="61" ry="15" fill="${count?'#92765f':'#e9d4b3'}" stroke="#a18777" stroke-width="4"/>${count===2?'<ellipse cx="120" cy="129" rx="7" ry="5" fill="#d0ae76"/>':''}${count===3?'<path d="M86 119q8 13 16 0m25 3q8 13 16 0m20-5q8 13 16 0" fill="none" stroke="#8bcbd4" stroke-width="5" stroke-linecap="round"/>':''}${count===4?'<path d="M120 127V93m0 25q-20 0-20-16 18 0 20 16m0-8q20 0 20-16-18 0-20 16" fill="#98bd91" stroke="#759b78" stroke-width="3"/><circle cx="190" cy="41" r="18" fill="#f5d374"/><path d="M190 10v12m0 38v12m-31-31h12m38 0h12" stroke="#e0b85a" stroke-width="6" stroke-linecap="round"/>':''}${count===5?toy('flower',55,7,130,133):''}<path d="m118 160 6 10 12 2-9 8 2 12-11-5-10 5 2-12-9-8 12-2Z" fill="#fff0d0" opacity=".9"/></svg>`;}
