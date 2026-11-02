'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const {ALL_LEVELS}=require('../qa/v2-test/Catalog.js'),{Puzzle}=require('../qa/v2-test/Puzzle.js');
class Label {constructor(){this.string='';}}
class Graphics {clear(){}roundRect(){}fill(){}}
class EditBox {constructor(){this.string='';}static InputMode={ANY:0,SINGLE_LINE:6};static InputFlag={DEFAULT:5};static EventType={TEXT_CHANGED:'text-changed'};}
class Node {
 static EventType={TOUCH_END:'touch-end'};
 constructor(){this.children=[];this.events={};this.components=new Map();this.active=true;}
 addComponent(Type){const c=new Type();this.components.set(Type,c);return c;}
 getComponent(Type){return this.components.get(Type);}
 getComponentInChildren(Type){return this.children.map(n=>n.getComponent(Type)).find(Boolean);}
 on(type,fn){this.events[type]=fn;}
}
function child(parent){const n=new Node();parent.children.push(n);return n;}
function panel(parent){const n=child(parent);n.addComponent(Graphics);return n;}
function text(parent,value){const n=child(parent);n.addComponent(Label).string=value;return n;}
function button(parent,value,x,y,w,h,action){const n=panel(parent);text(n,value);n.events.click=action;return n;}
const kit={panel,text,button,color:s=>s,C:{cream:'#fff',ink:'#123',line:'#456',teal:'#789',muted:'#aaa',blue:'#def'}};
const exportsUI={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/adventure/HomeworkView.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsUI,require:id=>id==='cc'?{Node,EditBox,Label,Graphics}:kit});
function descendants(n){return n.children.flatMap(child=>[child,...descendants(child)]);}
for(const kind of ['compose','cloze']){
 const l=ALL_LEVELS.find(l=>l.kind===kind),p=new Puzzle(l),root=new Node();let saved=0;
 assert.equal(exportsUI.homeworkView(root,l,p,()=>saved++),true);
 const inputs=descendants(root).filter(n=>n.getComponent(EditBox));assert.equal(inputs.length,kind==='cloze'?l.fields.length:1);
 const originalNodes=descendants(root).length;
 for(let i=0;i<inputs.length;i++){const edit=inputs[i].getComponent(EditBox);edit.string=kind==='compose'?'今天我和姐姐一起去上学。':l.fields[i].answers[0];inputs[i].events['text-changed'](edit);}
 assert.equal(saved,inputs.length);assert.equal(descendants(root).length,originalNodes,'typing keeps inputs mounted');
 if(kind==='compose'){
  assert.equal(p.input,'今天我和姐姐一起去上学。');assert.equal(p.writingReady(),true);
  const checks=root.children.filter(n=>n.events.click).slice(0,l.writing.checks.length);checks.forEach(n=>n.events.click());assert.equal(p.correct(),true);
  const edit=inputs[0].getComponent(EditBox);edit.string+='我很开心。';inputs[0].events['text-changed'](edit);assert.equal(p.correct(),false,'editing resets self-check');
 }else assert.equal(p.correct(),true);
}
const l=ALL_LEVELS.find(l=>l.kind==='highlight'),p=new Puzzle(l),root=new Node();let saved=0;exportsUI.homeworkView(root,l,p,()=>saved++);
const row=root.children.find(n=>n.events['touch-end']);row.events['touch-end']({});assert.equal(p.marked.length,1);row.events['touch-end']({});assert.equal(p.marked.length,0);assert.equal(saved,2);
console.log('PASS homework UI: native EditBox component event payload, Chinese typing, cloze answers, stable inputs, self-check invalidation, marking toggle and autosave callbacks');
