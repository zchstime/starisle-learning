const assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const moduleExports={};new Function('exports',ts.transpile(fs.readFileSync('assets/scripts/adventure/SpeechMotion.ts','utf8'),{module:ts.ModuleKind.CommonJS}))(moduleExports);
const {analyseSpeech,sampleSpeech}=moduleExports;
const sr=24000,pcm=new Float32Array(sr*2);
// Leading silence, two syllables separated by a pause, then trailing silence.
for(let i=sr*.3;i<sr*.65;i++)pcm[i]=.25*Math.sin(2*Math.PI*220*i/sr);
for(let i=sr*.9;i<sr*1.4;i++)pcm[i]=.12*Math.sin(2*Math.PI*1200*i/sr);
const track=analyseSpeech(pcm,sr);
for(const t of [0,.1,.7,.8,1.5,1.9])assert.equal(sampleSpeech(track,t).open,0,`silence ${t}`);
assert(sampleSpeech(track,.45).open>.7);assert(sampleSpeech(track,1.1).open>.4);
assert(sampleSpeech(track,.45).round>sampleSpeech(track,1.1).round,'low-band vowel tendency');
assert.equal(sampleSpeech(track,-.04).open,0,'scheduled audio has not begun');
assert.equal(sampleSpeech(track,2).playing,false,'end closes mouth immediately');
for(let i=0;i<track.open.length;i++)assert(Number.isFinite(track.open[i])&&track.open[i]>=0&&track.open[i]<=1);
const quiet=analyseSpeech(new Float32Array(2400).fill(.0005),sr);assert(quiet.open.every(x=>x===0),'noise floor stays closed');
console.log('Speech motion: silence, syllables, audio clock bounds, vowel tendency and noise gate PASS');
