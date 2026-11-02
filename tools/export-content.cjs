// One-time, deterministic migration: keeps every shipped chapter and level ID.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'starisle-catalog-'));
try{
 for(const name of ['Homework','PictureActivities','Subjects','SubjectStories','OtherCurriculum','ChineseCurriculum','EnglishCurriculum','MathCurriculum','StarterContent','ChallengeContent','ExpansionContent','Catalog'])fs.writeFileSync(path.join(dir,name+'.js'),ts.transpileModule(fs.readFileSync(path.join(__dirname,'../assets/scripts/adventure',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText);
 const {CATALOG}=require(path.join(dir,'Catalog.js')),{SUBJECTS}=require(path.join(dir,'Subjects.js'));
 const questions=[],chapters=CATALOG.map(({levels,...chapter})=>({...chapter,status:'active',bindings:levels.map(({id,...data})=>{const questionId=id+'.q';questions.push({id:questionId,subject:chapter.subject,grade:chapter.grade,knowledge:chapter.topic,status:'active',data});return {id,questionId};})}));
 const voices=fs.readdirSync(path.join(__dirname,'../assets/resources/voice')).filter(n=>/\.(wav|mp3|ogg)$/.test(n)).map(n=>n.replace(/\.[^.]+$/,'')).sort();
 fs.writeFileSync(path.join(__dirname,'../server/content/voices.json'),JSON.stringify(voices));
 const seed={schemaVersion:1,subjects:SUBJECTS.map((s,order)=>({...s,order,status:'active'})),questions,chapters};
 fs.writeFileSync(path.join(__dirname,'../server/content/seed.json'),JSON.stringify(seed));console.log(`Exported ${seed.subjects.length} subjects, ${chapters.length} chapters, ${questions.length} questions`);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
