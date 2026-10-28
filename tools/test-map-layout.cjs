const fs=require('fs'),ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript'),assert=require('assert/strict'),vm=require('vm');
function load(file,deps,extra={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:id=>deps[id]||{},...extra});return exports;}
const {Companion}=load('assets/scripts/adventure/Companion.ts',{'./CompanionLines':{COMPANION_LINES:{welcome:'你好',hello:'你好'}},'./CompanionPolicy':{}},{Date,clearTimeout(){},setTimeout(){return 1;}});
const bubble={hidden:true},line={textContent:''},c=Object.create(Companion.prototype);
Object.assign(c,{el:{querySelector:s=>s==='p'?line:bubble},blocked:()=>false,state:()=>({screen:'map',key:'1'}),bank:{status:{},enabled:false},policy:{quietUntil:0,enter(){}},lastSaid:-Infinity,stop(){}});
c.say('welcome');assert.equal(bubble.hidden,true,'automatic welcome must not open panel');
c.say('hello',true);assert.equal(bubble.hidden,false,'explicit help opens panel');
const {GRADE_WORLDS,gradeWorld}=load('assets/scripts/adventure/GradeWorlds.ts',{});
const clicks=[],labels=[],hits=[];class Graphics{circle(){}fill(){}stroke(){}}
function node(p,name,x,y,w,h){const n={addComponent:()=>new Graphics(),on:(type,fn)=>hits.push({name,fn})};return n;}
const kit={node,panel:()=>({}),text:(p,s)=>labels.push(s),color:()=>({}),C:{}};
const {journeyMap}=load('assets/scripts/adventure/JourneyMap.ts',{'./SubjectWorlds':{learningWorld:(subject,grade)=>gradeWorld(grade)},'cc':{Node:{EventType:{TOUCH_END:'touch'}}},'../ui/Kit':kit,'./LearningRoute':{ROUTE_PAGE_SIZE:12,routeUnlocked:()=>true}});
for(let grade=1;grade<=6;grade++){
 clicks.length=labels.length=hits.length=0;let opened=-1;
 const route=Array.from({length:24},(_,i)=>({ordinal:i,task:{id:'q'+i},unit:{title:'测试主题',levels:[0,1,2,3,4,5]},level:i%6}));
 journeyMap({root:{},route,done:['q0'],page:0,next:1,focus:-1,grade,subject:'数学',btn:(p,s,x,y,w,h,run)=>{clicks.push({s,x,y,w,h,run});return {};},open:i=>opened=i,preview(){},turn(){},resume(){},library(){},journal(){},audio(){},account(){},mascot(){}});
 assert.equal(clicks.filter(b=>b.s.includes('数学')).length,1);
 assert.ok(!labels.includes('阶段勋章'));
 assert.equal(hits.length,12);hits[0].fn({});assert.equal(opened,0,'completed route stop remains replayable');
 for(const [x,y] of GRADE_WORLDS[grade-1].homes){assert.ok(x-136>=0&&x+136<=1440);assert.ok(y+126<643,'cards must not overlap footer navigation');}
 assert.ok(clicks.filter(b=>b.s.includes('开始探索')).length===1);
}
console.log('PASS six map layouts: single subject entry, replayable stops, footer clearance, one primary action; companion opens only on explicit request');
