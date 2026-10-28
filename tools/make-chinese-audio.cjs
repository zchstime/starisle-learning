const fs=require('fs'),path=require('path'),cp=require('child_process');
const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const dir=path.resolve('qa/chinese-audio');fs.mkdirSync(dir,{recursive:true});
for(const name of ['ChineseCurriculum','AudioKey'])fs.writeFileSync(path.join(dir,name+'.js'),ts.transpileModule(fs.readFileSync('assets/scripts/adventure/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText);
const {chineseCurriculum}=require(path.join(dir,'ChineseCurriculum.js'));const {voiceKey}=require(path.join(dir,'AudioKey.js'));
const voices=[...new Set(chineseCurriculum().flatMap(c=>c.levels).map(l=>l.voice).filter(Boolean))];
for(const voice of voices){const key=voiceKey(voice),file=path.resolve('assets/resources/voice',key+'.wav');if(fs.existsSync(file)&&fs.statSync(file).size>10000)continue;const tmp=path.join(dir,key+'.aiff');cp.execFileSync('/usr/bin/say',['-v','Tingting','-r','160','-o',tmp,voice]);cp.execFileSync('/usr/bin/afconvert',['-f','WAVE','-d','LEI16@22050','-c','1',tmp,file]);if(fs.statSync(file).size<10000)throw Error('Empty voice');fs.unlinkSync(tmp);}
fs.mkdirSync('docs/v13',{recursive:true});fs.writeFileSync('docs/v13/voice-manifest.json',JSON.stringify({source:'macOS Tingting synthetic narration; original stories, not recorded human speech',voices},null,2));console.log('Chinese voices ready:',voices.length);
