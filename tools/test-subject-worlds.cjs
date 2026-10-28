const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
function load(name,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/adventure/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:id=>deps[id]});return exports;}
const grades=load('GradeWorlds'),worlds=load('SubjectWorlds',{'./GradeWorlds':grades}),subjects=load('Subjects').SUBJECTS;
for(let grade=1;grade<=6;grade++){
 const keys=new Set();for(const s of subjects){const w=worlds.learningWorld(s.id,grade);keys.add(w.key);assert.ok(fs.existsSync('assets/resources/art/'+w.key+'.png'));assert.equal(w.homes,grades.gradeWorld(grade).homes);assert.ok(w.name);}
 assert.equal(keys.size,subjects.length,'every subject must have its own background');
}
assert.equal(worlds.learningWorld('unknown',2).key,'world-grade-2');
console.log('PASS 66 subject/grade mappings, distinct subject assets, preserved six grade routes and unknown-subject fallback');
