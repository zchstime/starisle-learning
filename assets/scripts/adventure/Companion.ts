import {SoundBank} from './SoundBank';
import {accountStorage} from '../platform/AccountStorage';
import {COMPANION_LINES,CompanionLine} from './CompanionLines';
import {CompanionPolicy,shouldDismissCompanion} from './CompanionPolicy';
type State={screen:string;key:string;valid:boolean;done:number;listening:boolean;levelUp?:boolean;grade?:number;subject?:string;title?:string;question?:string;hint?:string;attempt?:string};
/** Web companion shell persists through puzzle redraws; all audio uses the game's mixer. */
export class Companion {
 private el:HTMLDivElement; private timer:ReturnType<typeof setInterval>;private hideTimer:ReturnType<typeof setTimeout>;
 private settings=accountStorage();private policy=new CompanionPolicy();private context='';private welcomed=false;
 private ownVoice=false;private pendingVoice=false;private generation=0;private lastSaid=-Infinity;private began=Date.now();private breakOffered=false;
 private dialogueOpen=false;
 private dialogue=(e:Event)=>{this.dialogueOpen=!!(e as CustomEvent).detail;if(this.dialogueOpen)this.dismiss();};
 private line:CompanionLine='welcome';private unlocked=false;private muted=false;private volume=.8;
 private activity=(event?:Event)=>{this.unlocked=true;this.policy.activity(Date.now());if(event&&shouldDismissCompanion(event.type,(event as KeyboardEvent).key||'',event.target instanceof Node&&this.el.contains(event.target)))this.dismiss();};
 private visibility=()=>{if(document.hidden)this.dismiss();this.policy.activity(Date.now());};
 constructor(private bank:SoundBank,private state:()=>State,private hint:()=>void){
  if(typeof document==='undefined')return;
  (window as any).starisleCompanionContext=()=>this.state();
  (window as any).starisleCompanionAudio=()=>({enabled:this.bank.enabled&&!this.muted,volume:this.volume});
  window.addEventListener('starisle:dialogue-active',this.dialogue);
  this.unlocked=!!(navigator as any).userActivation?.hasBeenActive;
  this.muted=this.settings.getItem('starisle.companion.muted')==='true';
  const v=this.settings.getItem('starisle.companion.volume');if(v!==null&&Number.isFinite(Number(v)))this.volume=Math.min(1,Math.max(0,Number(v)));
  const style=document.createElement('style');style.id='xingbao-companion-style';style.textContent=`
  #xingbao-companion{position:fixed;left:max(16px,calc((100vw - 100dvh * 1.77778)/2 + 16px));bottom:12px;z-index:12;font:14px/1.5 system-ui;color:#355465;max-width:min(360px,calc(100vw - 32px))}
  #xingbao-companion[hidden]{display:none}#xingbao-companion button{font:inherit;cursor:pointer;border:0;border-radius:20px;padding:6px 11px;color:#48645b;background:#fff2cf}#xingbao-companion button:focus-visible{outline:3px solid #2c9dbe}
  #xingbao-companion .xb-orb{border:2px solid #fff5cf;background:linear-gradient(135deg,#ffedb1,#fff9ed);box-shadow:0 3px 14px #356b7b22;font-weight:700}
  #xingbao-companion .xb-bubble{background:linear-gradient(140deg,#fffef6,#edf9f5);border:2px solid white;border-radius:24px 24px 24px 7px;padding:12px 16px;margin-bottom:8px;box-shadow:0 8px 30px #234f692b}
  @media(min-width:850px){#xingbao-companion[data-screen="map"]{bottom:130px}#xingbao-companion[data-screen="map"] .xb-bubble{transform:none}}
  #xingbao-companion .xb-top{display:flex;align-items:center;gap:8px;color:#548978;font-size:12px}#xingbao-companion .xb-top button{margin-left:auto;background:transparent;padding:0 6px}#xingbao-companion p{margin:6px 0 10px}#xingbao-companion .xb-actions{display:flex;gap:5px;flex-wrap:wrap}#xingbao-companion details{margin-top:8px;font-size:12px}#xingbao-companion input{max-width:120px;vertical-align:middle}
  #xingbao-companion.speaking .xb-star{display:inline-block;animation:xb-talk .38s ease-in-out infinite alternate}#xingbao-companion .xb-meter{display:none}#xingbao-companion.speaking .xb-meter{display:inline;color:#dfac36;letter-spacing:2px}
  @keyframes xb-talk{to{transform:translateY(-3px) rotate(9deg) scale(1.12)}}@media(prefers-reduced-motion:reduce){#xingbao-companion *{animation:none!important}}
  @media(max-height:520px){#xingbao-companion{font-size:12px;max-width:290px;bottom:5px;left:8px}.xb-bubble{padding:8px 12px!important}}
  `;document.head.appendChild(style);
  this.el=document.createElement('div');this.el.id='xingbao-companion';this.el.hidden=true;
  this.el.innerHTML=`<div class="xb-bubble" hidden><div class="xb-top"><b>星宝 · AI 配音</b><span class="xb-meter" aria-hidden="true">▂▅▃▆</span><button data-do="close" aria-label="收起星宝对话">×</button></div><p aria-live="polite"></p><div class="xb-actions"><button data-do="help">给我提示</button><button data-do="ready">我自己想想</button><button data-do="rest">休息一下</button><button data-do="replay">听星宝说</button></div><details><summary>陪伴声音</summary><button data-do="mute"></button> <label>音量 <input type="range" min="0" max="1" step="0.1" aria-label="星宝音量"></label></details></div><button class="xb-orb" data-do="hello"><span class="xb-star">✦</span> 问星宝 <span class="xb-meter" aria-hidden="true">♪</span></button>`;
  document.body.appendChild(this.el);this.updateMute();const slider=this.el.querySelector('input')!;slider.value=String(this.volume);slider.oninput=()=>{this.volume=Number(slider.value);this.settings.setItem('starisle.companion.volume',slider.value);this.stop();};
  this.el.onclick=e=>{const action=(e.target as HTMLElement).closest('button')?.dataset.do;if(!action)return;this.activity();if(action==='close'){this.dismiss();return;}if(action==='mute'){this.muted=!this.muted;this.settings.setItem('starisle.companion.muted',String(this.muted));this.updateMute();this.stop();return;}if(action==='help'){if(this.state().screen==='play'){this.hint();this.say('help',true);}else this.say('idleMap',true);}else if(action==='rest'){this.say('rest',true);this.policy.rest(Date.now());}else if(action==='ready'){this.say('ready',true);this.policy.rest(Date.now());}else if(action==='replay')this.say(this.line,true);else if((window as any).starisleChat)(window as any).starisleChat.open();else this.say('hello',true);};
  for(const event of ['pointerdown','keydown'])window.addEventListener(event,this.activity,{capture:true,passive:true});document.addEventListener('visibilitychange',this.visibility);
  void this.bank.preload(Object.keys(COMPANION_LINES).map(id=>'voice/companion/'+id));this.timer=setInterval(()=>this.tick(),250);
 }
 get speaking(){return this.ownVoice;}
 private updateMute(){if(this.el)this.el.querySelector('[data-do="mute"]')!.textContent=this.muted?'开启星宝语音':'关闭星宝语音';}
 private animate(on:boolean){this.el?.classList.toggle('speaking',on);if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('starisle:companion-speaking',{detail:on}));}
 private stop(){this.generation++;if(this.ownVoice)this.bank.stopVoice();this.ownVoice=false;this.pendingVoice=false;this.animate(false);}
 dismiss(){this.stop();clearTimeout(this.hideTimer);if(this.el)(this.el.querySelector('.xb-bubble') as HTMLElement).hidden=true;}
 private blocked(){const s=this.state();return this.dialogueOpen||document.hidden||!['map','play','reward'].includes(s.screen)||document.body.classList.contains('auth-open');}
 tick(){if(!this.el)return;const s=this.state();if(!s.valid){this.dispose();return;}this.el.dataset.screen=s.screen;const key=s.screen+':'+s.key;if(key!==this.context){this.context=key;this.dismiss();this.policy.enter(key,Date.now());if(s.screen==='reward')this.say(s.levelUp?'levelup':'success');else if(s.screen==='play'&&!s.listening)this.say('start');}this.el.hidden=this.blocked();if(this.el.hidden){if(!this.dialogueOpen)this.stop();return;}
  if(this.ownVoice&&!this.pendingVoice&&!this.bank.status.voicePlaying){this.ownVoice=false;this.animate(false);}
  if(!this.bank.enabled)this.stop();
  if(!this.welcomed&&s.screen==='map'){this.welcomed=true;this.say(s.done?'resume':'welcome');}
  const busy=this.muted||!this.unlocked||!this.bank.enabled||this.bank.status.voicePlaying||this.bank.status.voiceLoading||s.listening||!!document.activeElement?.matches('input,textarea,[contenteditable="true"]');
  if(this.policy.canNudge(Date.now(),s.screen,busy)){this.policy.didNudge(Date.now());this.say(s.screen==='play'?'idlePlay':'idleMap');}
  if(!this.breakOffered&&Date.now()-this.began>20*60000&&s.screen==='map'&&!busy&&Date.now()-this.lastSaid>180000){this.breakOffered=true;this.say('break');}
 }
 say(id:CompanionLine,manual=false){if(!this.el||this.blocked())return;const now=Date.now();if(!manual&&(now<this.policy.quietUntil||now-this.lastSaid<20000))return;
  // Task listening always has priority; never replace a question's spoken audio.
  if((this.bank.status.voicePlaying||this.bank.status.voiceLoading)&&!this.ownVoice)return;
  const s=this.state();this.context=s.screen+':'+s.key;this.policy.enter(this.context,now);
  this.stop();this.line=id;this.lastSaid=now;clearTimeout(this.hideTimer);this.el.querySelector('p')!.textContent=COMPANION_LINES[id];(this.el.querySelector('.xb-bubble') as HTMLElement).hidden=!manual;
  this.hideTimer=setTimeout(()=>this.dismiss(),12000);
  if(this.muted||!this.bank.enabled||!this.unlocked||this.volume===0)return;
  const token=this.generation;this.ownVoice=true;this.pendingVoice=true;
  void this.bank.play('voice/companion/'+id,true,this.volume).then(ok=>{if(token!==this.generation)return;this.pendingVoice=false;this.ownVoice=ok;this.animate(ok);});
 }
 dispose(){if(typeof document==='undefined')return;clearInterval(this.timer);clearTimeout(this.hideTimer);this.stop();this.el?.remove();window.removeEventListener('starisle:dialogue-active',this.dialogue);delete (window as any).starisleCompanionContext;delete (window as any).starisleCompanionAudio;document.getElementById('xingbao-companion-style')?.remove();for(const event of ['pointerdown','keydown'])window.removeEventListener(event,this.activity,true);document.removeEventListener('visibilitychange',this.visibility);}
}
