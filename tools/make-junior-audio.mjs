// Offline system TTS for fixed role lines; no voice cloning or runtime network dependency.
import {units} from '../web/junior/catalog.mjs';
import {mkdirSync,existsSync,writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const dest=fileURLToPath(new URL('../web/junior/assets/',import.meta.url));mkdirSync(dest,{recursive:true});
const manifest=[];
for(const u of units)for(const t of u.tasks)if(t.kind==='dialogue')for(const [i,turn]of t.turns.entries()){
 const name=t.id.replaceAll('.','-')+'-'+i+'.wav';
 if(!existsSync(dest+name)||readFileSync(dest+name).length<=4096||process.argv.includes('--force'))execFileSync('/usr/bin/say',['-v','Samantha','-r','155','--file-format=WAVE','--data-format=LEI16@22050','-o',dest+name,turn[0]],{timeout:30000});
 const bytes=readFileSync(dest+name);let data=null;for(let p=12;p+8<=bytes.length;){const n=bytes.readUInt32LE(p+4);if(bytes.toString('ascii',p,p+4)==='data'){data=bytes.subarray(p+8,p+8+n);break;}p+=8+n+(n%2);}if(!data||data.length<22050)throw Error('TTS produced empty or short audio: '+name);let peak=0;for(let i=0;i+1<data.length;i+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(i)));if(peak<100)throw Error('TTS produced silence: '+name);
 manifest.push({file:name,text:turn[0],voice:'macOS Samantha',type:'system-synthesized',taskId:t.id});
}
writeFileSync(dest+'audio-manifest.json',JSON.stringify({licenseNote:'System-generated demonstration speech; not a human recording or pronunciation score.',lines:manifest},null,2)+'\n');
console.log('Junior demonstration audio:',manifest.length,'lines');
