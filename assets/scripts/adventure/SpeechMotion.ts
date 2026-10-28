/** Audio-clock lip motion. This samples the voice buffer, never the music mix. */
export type SpeechFrame={playing:boolean;open:number;round:number;time:number};
export type SpeechTrack={step:number;duration:number;open:Float32Array;round:Float32Array};
export const SPEECH_FRAME_EVENT='starisle:companion-frame';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export function analyseSpeech(samples:Float32Array,sampleRate:number):SpeechTrack{
 const step=.01,hop=Math.max(1,Math.round(sampleRate*step)),window=Math.round(sampleRate*.02);
 const length=Math.ceil(samples.length/hop),energy=new Float32Array(length),round=new Float32Array(length);
 const alpha=1-Math.exp(-2*Math.PI*650/sampleRate);
 for(let f=0;f<length;f++){
  let sum=0,lowSum=0,low=0,count=0;
  for(let i=f*hop;i<Math.min(samples.length,f*hop+window);i++){const x=samples[i];sum+=x*x;low+=alpha*(x-low);lowSum+=low*low;count++;}
  energy[f]=Math.sqrt(sum/Math.max(1,count));
  // Rounded-vowel tendency from low-band energy; a lightweight visual cue,
  // not a phoneme recognizer. Opening and silence use the exact PCM envelope.
  round[f]=clamp((lowSum/Math.max(1e-9,sum)-.35)*1.8);
 }
 const sorted=Array.from(energy).sort((a,b)=>a-b);const reference=Math.max(.025,sorted[Math.floor(sorted.length*.95)]||0);
 const gate=Math.max(.003,reference*.055),open=new Float32Array(length);
 for(let i=0;i<length;i++)open[i]=energy[i]<=gate?0:clamp(Math.pow((energy[i]-gate)/reference,.65));
 return {step,duration:samples.length/sampleRate,open,round};
}
export function sampleSpeech(track:SpeechTrack,time:number):SpeechFrame{
 if(time<0||time>=track.duration)return {playing:time<0,open:0,round:0,time};
 const f=time/track.step,i=Math.floor(f),j=Math.min(i+1,track.open.length-1),mix=f-i;
 return {playing:true,open:track.open[i]*(1-mix)+track.open[j]*mix,round:track.round[i]*(1-mix)+track.round[j]*mix,time};
}
