import {Level} from './Catalog';
/** The chapter owns the attempt and reward; iframe can only return placements. */
export function openPicture(l:Level,onCheck:(placements:(string|null)[])=>boolean,onBack:()=>void,sound:boolean){
 if(typeof document==='undefined')return ()=>{};
 const frame=document.createElement('iframe');frame.title='星宝图形任务';frame.src='/arcade/chapters/index.html';frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:12000;background:#eaf3ec';frame.setAttribute('aria-label','星宝图形任务');document.body.append(frame);
 const receive=(e:MessageEvent)=>{if(e.source!==frame.contentWindow||e.origin!==location.origin)return;if(e.data?.type==='picture:ready')frame.contentWindow.postMessage({type:'picture:init',level:l,sound},location.origin);if(e.data?.type==='picture:back')onBack();if(e.data?.type==='picture:check'&&Array.isArray(e.data.placements)&&e.data.placements.length<=24&&e.data.placements.every((v:any)=>v===null||typeof v==='string')){const ok=onCheck(e.data.placements);if(frame.isConnected)frame.contentWindow.postMessage({type:'picture:result',ok},location.origin);}};
 window.addEventListener('message',receive);return ()=>{window.removeEventListener('message',receive);frame.remove();};
}
