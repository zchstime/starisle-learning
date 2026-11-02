import {SoundBank} from './SoundBank';
import {CompanionLine} from './CompanionLines';
type State={screen:string;key:string;valid:boolean;done:number;listening:boolean;levelUp?:boolean;grade?:number;subject?:string;title?:string;question?:string;hint?:string;attempt?:string};
/** One scene-owned entry: all conversations use the shared live dialogue panel. */
export class Companion {
 private el:HTMLDivElement;private timer:ReturnType<typeof setInterval>;private dialogueOpen=false;
 private dialogue=(event:Event)=>{this.dialogueOpen=!!(event as CustomEvent).detail;this.tick();};
 constructor(private bank:SoundBank,private state:()=>State,_hint:()=>void){
  if(typeof document==='undefined')return;
  (window as any).starisleCompanionContext=()=>this.state();
  (window as any).starisleCompanionAudio=()=>({enabled:this.bank.enabled,volume:.8});
  const style=document.createElement('style');style.id='xingbao-companion-style';style.textContent=`
  #xingbao-companion{position:fixed;left:max(16px,calc((100vw - 100dvh * 1.77778)/2 + 16px));bottom:12px;z-index:12;font:14px/1.5 system-ui;color:#355465}
  #xingbao-companion[hidden]{display:none}#xingbao-companion button{font:inherit;cursor:pointer;border:2px solid #fff5cf;border-radius:20px;padding:6px 11px;color:#48645b;background:linear-gradient(135deg,#ffedb1,#fff9ed);box-shadow:0 3px 14px #356b7b22;font-weight:700}#xingbao-companion button:focus-visible{outline:3px solid #2c9dbe}
  @media(min-width:850px){#xingbao-companion[data-screen="map"]{bottom:130px}}@media(max-height:520px){#xingbao-companion{font-size:12px;bottom:5px;left:8px}}
  `;document.head.appendChild(style);
  this.el=document.createElement('div');this.el.id='xingbao-companion';this.el.hidden=true;
  this.el.innerHTML='<button type="button" aria-label="和星宝聊聊">✦ 和星宝聊聊</button>';
  this.el.onclick=()=>this.say('hello',true);document.body.appendChild(this.el);
  window.addEventListener('starisle:dialogue-active',this.dialogue);this.timer=setInterval(()=>this.tick(),250);this.tick();
 }
 get speaking(){return this.dialogueOpen;}
 dismiss(){} // Retained for task narration callers; there is no legacy bubble to dismiss.
 tick(){if(!this.el)return;const s=this.state();if(!s.valid){this.dispose();return;}this.el.dataset.screen=s.screen;this.el.hidden=this.dialogueOpen||document.hidden||!['map','play','reward'].includes(s.screen)||document.body.classList.contains('auth-open')||document.body.classList.contains('stage-open');}
 say(_id:CompanionLine,manual=false){if(manual&&typeof window!=='undefined')(window as any).starisleChat?.open();}
 dispose(){if(typeof document==='undefined')return;clearInterval(this.timer);this.el?.remove();window.removeEventListener('starisle:dialogue-active',this.dialogue);delete (window as any).starisleCompanionContext;delete (window as any).starisleCompanionAudio;document.getElementById('xingbao-companion-style')?.remove();}
}
