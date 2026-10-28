// Explicit developer command only: never called by public game requests.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const source=fs.readFileSync(path.join(root,'assets/scripts/adventure/CompanionLines.ts'),'utf8');
const m={exports:{}};new Function('exports',ts.transpile(source,{module:ts.ModuleKind.CommonJS}))(m.exports);
const config=JSON.parse(fs.readFileSync(path.join(root,'local/cloud/speech.json'),'utf8'));config.speaker='ICL_uranus_zh_female_keainvsheng_tob';
const synth=require('../server/providers/volc-speech.cjs')(config),out=path.join(root,'assets/resources/voice/companion');fs.mkdirSync(out,{recursive:true});
const manifestFile=path.join(out,'manifest.json'),manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile)):{};
(async()=>{for(const [id,text] of Object.entries(m.exports.COMPANION_LINES)){const hash=crypto.createHash('sha256').update(text+config.speaker+'v1').digest('hex');const file=path.join(out,id+'.mp3');if(manifest[id]?.hash===hash&&fs.existsSync(file))continue;const audio=await synth(text);fs.writeFileSync(file,audio);manifest[id]={hash,text,speaker:config.speaker,provider:'Volcengine Doubao TTS 2.0',bytes:audio.length};fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2));console.log(id+': '+audio.length+' bytes');}})().catch(e=>{console.error(e.message);process.exitCode=1;});
