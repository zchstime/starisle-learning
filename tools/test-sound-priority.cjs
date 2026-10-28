const assert=require('node:assert/strict'),fs=require('node:fs');
const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const loads=new Map();
class AudioSource{playing=false;volume=1;node={addComponent:()=>new AudioSource(),once(){}};play(){this.playing=true;}stop(){this.playing=false;}playOneShot(){}destroy(){}}
AudioSource.EventType={ENDED:'ended'};
const cc={AudioSource,sys:{isBrowser:false},resources:{load:(path,type,cb)=>loads.set(path,cb)}};
const moduleExports={};new Function('require','exports',ts.transpile(fs.readFileSync('assets/scripts/adventure/SoundBank.ts','utf8'),{module:ts.ModuleKind.CommonJS}))(id=>id==='cc'?cc:{accountStorage:()=>({getItem:()=>null,setItem(){}})},moduleExports);
const {SoundBank}=moduleExports;
function bank(){const b=new SoundBank(new AudioSource(),new AudioSource(),true);b.unlock=()=>{};return b;}
(async()=>{
 const b=bank(),first=b.play('first',true);assert.equal(b.status.voiceLoading,true);assert.equal(b.status.voicePlaying,false);
 b.stopVoice();assert.equal(b.status.voiceLoading,false);loads.get('first')(null,{});assert.equal(await first,false);assert.equal(b.status.voicePlaying,false);
 const old=b.play('old',true),newer=b.play('newer',true);loads.get('old')(null,{});assert.equal(await old,false);assert.equal(b.status.voiceLoading,true,'older completion must not clear newer loading state');loads.get('newer')(null,{});assert.equal(await newer,true);assert.equal(b.status.voiceLoading,false);assert.equal(b.status.voicePlaying,true);
 const muted=b.play('muted',true);b.setEnabled(false);loads.get('muted')(null,{});assert.equal(await muted,false);assert.equal(b.status.voiceLoading,false);assert.equal(b.status.voicePlaying,false);
 b.setEnabled(true);const failed=b.play('missing',true);const warn=console.warn;console.warn=()=>{};loads.get('missing')(new Error('fixture unavailable'));assert.equal(await failed,false);console.warn=warn;assert.equal(b.status.voiceLoading,false);
 console.log('PASS voice loading priority, cancellation, replacement, mute and failure cleanup');
})().catch(e=>{console.error(e);process.exitCode=1;});
