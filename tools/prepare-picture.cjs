const fs=require('node:fs'),path=require('node:path'),ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'assets/scripts/adventure/PictureActivities.ts'),'utf8');
fs.writeFileSync(path.join(root,'web/arcade/chapters/content.js'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText);
fs.writeFileSync(path.join(root,'server/content/picture.cjs'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText);
const {gradeActivities}=require('../server/content/picture.cjs');const lines={match:'每张线索都有自己的伙伴。把线索送到对应的答案旁，全部配好后点星星检查。',sort:'看看每个物品的特点，把它送到合适的位置。',sequence:'看图，把过程按先后顺序放好。',share:'把果子平均分给伙伴，让大家分到的一样多。全部分完后点星星检查。',mosaic:'把方块送到花田或材料箱里，拼出任务要求的金色部分。每一块都一样大。',wrong:'还差一点点。看看图形和位置，可以点回来，再试一次。'};
for(let g=1;g<=6;g++)for(const subject of ['math','science'])for(const l of gradeActivities(g,subject))lines[l.id]=l.goal.replace(/[。！？]+$/,'')+'。'+(l.goal.replace(/[。！？]+$/,'')===l.activity.instruction.replace(/[。！？]+$/,'')?'':l.activity.instruction);
fs.writeFileSync(path.join(root,'web/arcade/chapters/voice-lines.json'),JSON.stringify(lines,null,2)+'\n');
