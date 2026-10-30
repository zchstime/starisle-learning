import {accountStorage} from '../platform/AccountStorage';
import {AudioClip,AudioSource,resources,sys} from 'cc';
import {analyseSpeech,sampleSpeech,SpeechTrack,SPEECH_FRAME_EVENT} from './SpeechMotion';
/** Browser playback has an explicit trusted-gesture unlock; native targets retain Cocos playback. */
export class SoundBank {
 private context:AudioContext|null=null;private master:GainNode|null=null;private analyser:AnalyserNode|null=null;
 private clips:Record<string,Promise<AudioClip>>={};private buffers:Record<string,Promise<AudioBuffer>>={};
 private sources=new Set<AudioBufferSourceNode>();private voice:AudioBufferSourceNode|null=null;private voiceVersion=0;private voiceLoading=false;
 private lipTracks=new WeakMap<AudioBuffer,SpeechTrack>();private lipRAF=0;
 private stopLip(){if(this.lipRAF)cancelAnimationFrame(this.lipRAF);this.lipRAF=0;if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(SPEECH_FRAME_EVENT,{detail:{playing:false,open:0,round:0,time:0}}));}
 private startLip(source:AudioBufferSourceNode,buffer:AudioBuffer,started:number){
  let track=this.lipTracks.get(buffer);if(!track){track=analyseSpeech(buffer.getChannelData(0),buffer.sampleRate);this.lipTracks.set(buffer,track);}
  const tick=()=>{
   if(this.disposed||this.voice!==source||!this.enabled||this.context?.state!=='running'){this.stopLip();return;}
   const stamp=this.context.getOutputTimestamp?.();
   // Use the audible device clock, including output latency, rather than a timer.
   const audible=stamp&&stamp.contextTime>0?stamp.contextTime:this.context.currentTime-(this.context.baseLatency||0);
   window.dispatchEvent(new CustomEvent(SPEECH_FRAME_EVENT,{detail:sampleSpeech(track!,audible-started)}));
   this.lipRAF=requestAnimationFrame(tick);
  };tick();
 }
 enabled=true;lastError='';lastPlayed='';lastPeak=0;private disposed=false;
 private music:AudioBufferSourceNode|null=null;private musicGain:GainNode|null=null;private nativeMusic:AudioSource;private musicLoading=false;private musicVersion=0;
 private settings=accountStorage();
 musicEnabled=this.settings.getItem('starisle.music')!=='off';
 musicVolume=this.readMusicVolume();
 private readMusicVolume(){try{const raw=this.settings.getItem('starisle.musicVolume');if(raw===null)return .65;const value=Number(raw);return Number.isFinite(value)&&value>=0&&value<=1?value:.65;}catch{return .65;}}
 setMusicVolume(value:number){if(!Number.isFinite(value))return;this.musicVolume=Math.max(0,Math.min(1,value));try{this.settings.setItem('starisle.musicVolume',String(this.musicVolume));}catch{}this.duck();}
 private visibility=()=>{if(document.hidden){this.stopMusic();this.stopVoice();}else if(this.enabled)this.unlock();};
 private gesture=()=>{if(this.enabled)this.unlock();};
 private externalDialogue=false;
 private dialogue=(e:Event)=>{this.externalDialogue=!!(e as CustomEvent).detail;if(this.externalDialogue)this.stopVoice();this.duck();};
 private musicLevel(){return this.musicVolume*((this.externalDialogue||this.voice||this.speech.playing) ? .08/.65 : 1);}
 private duck(){if(this.musicGain&&this.context)this.musicGain.gain.setTargetAtTime(this.musicLevel(),this.context.currentTime,.15);if(this.nativeMusic)this.nativeMusic.volume=this.musicLevel();}
 setMusicEnabled(on:boolean){this.musicEnabled=on;try{this.settings.setItem('starisle.music',on?'on':'off');}catch{}if(on)this.unlock();else this.stopMusic();}
 private stopMusic(){this.musicVersion++;if(this.music){try{this.music.stop();}catch{}this.music.disconnect();this.music=null;}this.musicGain?.disconnect();this.musicGain=null;this.nativeMusic?.stop();}
 private async ensureMusic(){if(this.musicLoading||this.music||this.nativeMusic?.playing||!this.enabled||!this.musicEnabled||this.disposed||(sys.isBrowser&&document.hidden))return;this.musicLoading=true;const version=this.musicVersion;
  try{if(this.context){if(this.context.state!=='running')return;const b=await this.buffer('audio/island-theme');if(version!==this.musicVersion||!this.enabled||!this.musicEnabled||this.disposed)return;this.music=this.context.createBufferSource();this.music.buffer=b;this.music.loop=true;this.musicGain=this.context.createGain();this.musicGain.gain.value=0;this.music.connect(this.musicGain);this.musicGain.connect(this.master!);this.music.start();this.duck();}else{const c=await this.clip('audio/island-theme');if(version!==this.musicVersion||!this.enabled||!this.musicEnabled||this.disposed)return;this.nativeMusic.clip=c;this.nativeMusic.loop=true;this.nativeMusic.volume=this.musicLevel();this.nativeMusic.play();}}catch(e){this.lastError=String(e);}finally{this.musicLoading=false;}
 }

 constructor(private fx:AudioSource,private speech:AudioSource,enabled:boolean){this.enabled=enabled;this.nativeMusic=fx.node.addComponent(AudioSource);
  if(sys.isBrowser&&typeof window!=='undefined'){window.addEventListener('starisle:dialogue-active',this.dialogue);try{const AC=window.AudioContext||(window as any).webkitAudioContext;if(AC){this.context=new AC();this.master=this.context.createGain();this.master.gain.value=enabled?1:0;this.analyser=this.context.createAnalyser();this.analyser.fftSize=1024;this.master.connect(this.analyser);this.analyser.connect(this.context.destination);for(const type of ['pointerdown','touchend','keydown'])window.addEventListener(type,this.gesture,{capture:true,passive:true});document.addEventListener('visibilitychange',this.visibility);}}catch(e){this.lastError=String(e);}}
 }
 get status(){return {voiceLoading:this.voiceLoading,voicePlaying:!!this.voice||this.speech.playing,state:this.context?.state||'native',enabled:this.enabled,lastPlayed:this.lastPlayed,lastError:this.lastError,peak:this.lastPeak,active:this.sources.size,musicPlaying:!!this.music||this.nativeMusic.playing,musicEnabled:this.musicEnabled,musicVolume:this.musicVolume,musicGain:this.musicGain?.gain.value};}
 unlock(){if(this.disposed)return;if(!this.context){void this.ensureMusic();return;}try{if(this.context.state!=='running')void this.context.resume().then(()=>this.ensureMusic()).catch(e=>{this.lastError=String(e);});else void this.ensureMusic();const source=this.context.createBufferSource();source.buffer=this.context.createBuffer(1,1,this.context.sampleRate);source.connect(this.master!);source.onended=()=>source.disconnect();source.start();}catch(e){this.lastError=String(e);}}
 setEnabled(enabled:boolean){this.enabled=enabled;if(this.master)this.master.gain.value=enabled?1:0;if(!enabled){this.stopMusic();this.stopVoice();this.sources.forEach(s=>{try{s.stop();}catch{}});this.fx.stop();}else this.unlock();}
 private clip(path:string){if(!this.clips[path])this.clips[path]=new Promise<AudioClip>((resolve,reject)=>resources.load(path,AudioClip,(err,clip)=>err?reject(err):resolve(clip))).catch(e=>{delete this.clips[path];throw e;});return this.clips[path];}
 private buffer(path:string){if(!this.buffers[path])this.buffers[path]=this.clip(path).then(async clip=>{const response=await fetch(clip.nativeUrl);if(!response.ok)throw new Error('Audio HTTP '+response.status);const data=await response.arrayBuffer();return await this.context!.decodeAudioData(data);}).then(buffer=>{if(!buffer.length||buffer.duration<.02)throw new Error('Empty audio: '+path);return buffer;}).catch(e=>{delete this.buffers[path];throw e;});return this.buffers[path];}
 async preload(paths:string[]){await Promise.all(paths.map(path=>(this.context?this.buffer(path):this.clip(path)).catch(e=>{this.lastError=String(e);})));}
 async play(path:string,voice=false,volume=1):Promise<boolean>{if(!this.enabled||this.disposed)return false;this.unlock();const token=voice?++this.voiceVersion:0;if(voice){this.stopLip();this.voiceLoading=true;this.voice?.stop();this.voice=null;this.speech.stop();}
  try{if(this.context){const buffer=await this.buffer(path);if(this.disposed||!this.enabled||(voice&&token!==this.voiceVersion))return false;
   if(this.context.state!=='running')await this.context.resume();
   if(this.disposed||!this.enabled||(voice&&token!==this.voiceVersion))return false;
   if(this.context.state!=='running'){this.lastError='请再点一次试听以开启声音';return false;}
   const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;gain.gain.value=volume;source.connect(gain);gain.connect(this.master!);this.sources.add(source);if(voice){this.voice=source;this.duck();}
   source.onended=()=>{source.disconnect();gain.disconnect();this.sources.delete(source);if(this.voice===source){this.voice=null;this.stopLip();this.duck();}};
   const started=this.context.currentTime+.035;source.start(started);
   if(voice&&volume>0&&path.startsWith('voice/companion/'))this.startLip(source,buffer,started);
   this.lastPeak=0;
   const values=new Float32Array(this.analyser!.fftSize);let count=0;const sample=()=>{if(this.disposed||!this.analyser)return;this.analyser.getFloatTimeDomainData(values);let peak=0;for(let i=0;i<values.length;i++)peak=Math.max(peak,Math.abs(values[i]));this.lastPeak=Math.max(this.lastPeak,peak);if(++count<24&&this.sources.has(source))setTimeout(sample,25);};sample();
  }else{const clip=await this.clip(path);if(!this.enabled||this.disposed||(voice&&token!==this.voiceVersion))return false;if(voice){this.speech.clip=clip;this.speech.volume=volume;this.speech.play();this.duck();this.speech.node.once(AudioSource.EventType.ENDED,()=>this.duck());}else this.fx.playOneShot(clip,volume);}
  this.lastPlayed=path;this.lastError='';return true;
  }catch(e){this.lastError=String(e);console.warn('SoundBank:',path,e);return false;}
  finally{if(voice&&token===this.voiceVersion)this.voiceLoading=false;}
 }
 stopVoice(){this.voiceVersion++;this.voiceLoading=false;this.stopLip();if(this.voice){try{this.voice.stop();}catch{}this.voice=null;}this.speech.stop();this.duck();}
 dispose(){this.disposed=true;this.stopMusic();this.nativeMusic.destroy();this.stopVoice();this.sources.forEach(s=>{try{s.stop();}catch{}});if(sys.isBrowser){window.removeEventListener('starisle:dialogue-active',this.dialogue);document.removeEventListener('visibilitychange',this.visibility);for(const type of ['pointerdown','touchend','keydown'])window.removeEventListener(type,this.gesture,true);}void this.context?.close();}
}
