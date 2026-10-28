// CC0 samples by Kenney + original procedural pentatonic accompaniment.
export class GardenAudio {
 constructor(){this.ctx=null;this.buffers={};this.active=new Set();this.enabled=true;this.music=true;this.volume=.55;this.paused=false;this.last={};this.step=0;this.nextBeat=0;this.stats={decoded:0,played:0,notes:0};try{const p=JSON.parse(localStorage.getItem('starisle.arcade.audio.v2')||'null');if(p){this.enabled=p.enabled!==false;this.music=p.music!==false;this.volume=Math.min(1,Math.max(0,Number.isFinite(Number(p.volume))?Number(p.volume):.55));}}catch{}this.bytes={};this.ready=Promise.allSettled(['jump','land','coin','break','fall','walking'].map(async name=>{const r=await fetch(new URL('./assets/audio/'+name+'.ogg',import.meta.url));if(!r.ok)throw Error('audio '+r.status);this.bytes[name]=await r.arrayBuffer();if(this.ctx)await this.decode(name);}));}
 async decode(name){if(this.buffers[name]||!this.bytes[name])return;try{this.buffers[name]=await this.ctx.decodeAudioData(this.bytes[name].slice(0));this.stats.decoded=Object.keys(this.buffers).length;}catch{}}
 async unlock(){if(!this.enabled)return;try{if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=this.volume;this.master.connect(this.ctx.destination);await Promise.all(Object.keys(this.bytes).map(n=>this.decode(n)));}if(this.ctx.state==='suspended')await this.ctx.resume();}catch{}}
 save(){try{localStorage.setItem('starisle.arcade.audio.v2',JSON.stringify({enabled:this.enabled,music:this.music,volume:this.volume}));}catch{}}
 setEnabled(v){this.enabled=v;if(!v)this.stop();else void this.unlock();this.save();}
 setVolume(v){this.volume=v;if(this.master)this.master.gain.setTargetAtTime(v,this.ctx.currentTime,.03);this.save();}
 setPaused(v){this.paused=v;if(v)this.stop();this.nextBeat=0;}
 stop(){for(const node of this.active)try{node.stop();}catch{}this.active.clear();}
 track(node){this.active.add(node);node.onended=()=>{this.active.delete(node);node.disconnect();};}
 tone(freq,time=.15,gain=.2,type='sine',delay=0,endFreq=freq){if(!this.ctx||!this.enabled||this.paused)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+time);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+time);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+time+.03);this.track(o);o.addEventListener('ended',()=>g.disconnect(),{once:true});this.stats.notes++;}
 play(event){if(!this.enabled||this.paused)return;void this.unlock();if(!this.ctx)return;const now=this.ctx.currentTime;if(now-(this.last[event]??-10)<(event==='hit'?.12:.06))return;this.last[event]=now;
 const map={launch:'jump',impact:'land',collect:'coin',place:'land',hit:'break',miss:'fall',step:'walking'},name=map[event],buffer=this.buffers[name];
 if(buffer){const s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=buffer;s.playbackRate.value=event==='hit'?1.5:event==='place'?1.35:1;g.gain.value=event==='impact'?.20:event==='hit'?.16:.32;s.connect(g);g.connect(this.master);s.start();this.track(s);s.addEventListener('ended',()=>g.disconnect(),{once:true});this.stats.played++;}
 else if(event!=='win')this.tone(event==='collect'?880:event==='launch'?360:520,.13,.15,'sine',0,event==='launch'?680:390);
 if(event==='win')[523.25,659.25,783.99,1046.5].forEach((n,i)=>this.tone(n,.45,.16,'triangle',i*.12));
 if(event==='shot')this.tone(680,.09,.09,'sine',0,240);
 if(event==='stretch')this.tone(170,.12,.1,'triangle',0,250);
 if(event==='wrong'){this.tone(294,.16,.12,'sine');this.tone(247,.2,.1,'sine',.13);}
 }
 update(){if(!this.enabled||!this.music||this.paused||!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime;if(t<this.nextBeat)return;this.nextBeat=t+.42;const melody=[0,4,7,12,7,4,2,7,0,4,9,7,4,2,0,-5];const n=melody[this.step%melody.length];this.tone(261.63*Math.pow(2,n/12),.65,.035,'sine');if(this.step%4===0)this.tone(this.step%8===0?130.81:174.61,1.3,.025,'triangle');this.step++;}
}
export const gardenAudio=new GardenAudio();
