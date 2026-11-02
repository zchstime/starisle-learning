const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
class Component{}
class Graphics{clear(){this.draws=(this.draws||0)+1;}moveTo(){}lineTo(){}ellipse(){}bezierCurveTo(){}quadraticCurveTo(){}stroke(){}circle(){}fill(){}}
class Sprite{constructor(){this.customMaterial=null;this.spriteFrame={};}}
class Vec3{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}clone(){return new Vec3(this.x,this.y,this.z);}}
class Vec4{constructor(...v){this.set(...v);}set(...v){this.value=v;}}
class Material{constructor(){this.props={};}initialize(){}setProperty(k,v){this.props[k]=v;}destroy(){this.destroyed=true;}}
class Node{constructor(){this.children=[];this.active=true;this.components=new Map();this.position=new Vec3();this.scale=new Vec3(1,1,1);}getComponent(Type){return this.components.get(Type)||null;}addComponent(Type){const c=new Type();c.node=this;this.components.set(Type,c);return c;}setPosition(x,y,z=0){this.position=x instanceof Vec3?x.clone():new Vec3(x,y,z);this.x=this.position.x;this.y=this.position.y;}setScale(x,y,z){this.scale=x instanceof Vec3?x.clone():new Vec3(x,y,z);}}
class Texture2D{reset(){}uploadData(){}}
function node(parent,name){const n=new Node();n.name=name;n.parent=parent;parent.children.push(n);return n;}
const media={matches:false},document={hidden:false},storage=new Map();
const exportsObject={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/adventure/SceneryMotion.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText,{
 exports:exportsObject,require:id=>id==='cc'?{_decorator:{ccclass:()=>c=>c},Component,Graphics,Node,Texture2D,Sprite,Vec4,Vec3,Mask:class{},Material,EffectAsset:class{},resources:{load:(p,t,cb)=>cb(null,{})},isValid:o=>!!o&&!o.destroyed,SpriteFrame:class{},UIOpacity:class{}}:{node,sprite:p=>{const n=node(p,'sprite');n.addComponent(Sprite);return n;},color:(hex,a)=>({hex,a})},
 window:{matchMedia:()=>media,dispatchEvent(){}},Event:class{},document,navigator:{hardwareConcurrency:8},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}
});
const {SceneryMotion,SCENERY,setSceneryEnabled}=exportsObject;
assert.equal(Object.keys(SCENERY).length,16);
function create(key){const c=new SceneryMotion();c.node=new Node();c.setup(key);return c;}
for(const key of Object.keys(SCENERY)){
 const c=create(key),count=c.node.children.length;for(let i=0;i<900;i++)c.update(1/30);
 assert.equal(c.node.children.length,count,'particle count must stay bounded');
 for(const f of c.fog)assert.ok(Number.isFinite(f.n.x)&&Number.isFinite(f.n.y));
 const before=c.time;document.hidden=true;c.update(20);assert.equal(c.time,before,'hidden pages must freeze');document.hidden=false;c.update(20);assert.ok(c.time-before<=.101,'resume cannot jump animation forward');
 media.matches=true;c.update(.1);assert.equal(c.ink.node.active,false);assert.ok(c.fog.every(f=>!f.n.active));media.matches=false;c.update(.1);assert.equal(c.ink.node.active,true);
 for(const [x,y,w,h] of SCENERY[key].falls||[])assert.ok(x>=0&&y>=0&&x+w<1&&y+h<1);
}
setSceneryEnabled(false);const disabled=create('world-grade-1');disabled.update(.1);assert.equal(disabled.ink.node.active,false);setSceneryEnabled(true);
const unknown=create('missing');unknown.update(.1);assert.equal(unknown.lights.length,0,'unknown artwork must not inherit misplaced landmarks');
console.log('PASS 16 scenes: bounded effects, hidden pause, capped resume, reduced motion, persisted switch, safe fallback');

(async()=>{
 const parent=new Node(),bg=parent.addComponent(Sprite),c=new SceneryMotion();c.node=node(parent,'LivingScenery');c.setup('world-grade-2');await Promise.resolve();await Promise.resolve();
 assert.ok(c.surface,'surface material loads');assert.equal(bg.customMaterial,c.surface);assert.equal(c.surface.props.fall0.value.length,4);
 media.matches=true;c.update(.1);assert.equal(bg.customMaterial,null,'reduced motion restores original shader');assert.equal(parent.scale.x,1,'reduced motion restores camera zoom');assert.equal(parent.position.x,0,'reduced motion restores camera origin');media.matches=false;c.update(.1);assert.equal(bg.customMaterial,c.surface);
 const material=c.surface;c.onDestroy();assert.equal(bg.customMaterial,null);assert.equal(material.destroyed,true,'map material is released');
 const stale=new SceneryMotion();stale.node=node(parent,'stale');stale.setup('world-grade-1');stale.destroyed=true;await Promise.resolve();assert.equal(stale.surface,undefined,'destroyed screens cannot receive late shader');
 const old=new SceneryMotion();old.node=node(parent,'old');old.setup('world-grade-1');await Promise.resolve();const oldMaterial=old.surface;
 const next=new SceneryMotion();next.node=node(parent,'next');next.setup('world-grade-2');await Promise.resolve();const nextMaterial=next.surface;old.onDestroy();assert.equal(bg.customMaterial,nextMaterial,'old screen cleanup cannot remove replacement material');assert.equal(oldMaterial.destroyed,true);next.onDestroy();assert.equal(bg.customMaterial,null);
 console.log('PASS surface lifecycle: async load, original-material restore, disposal, stale-screen guard');
})().catch(e=>{console.error(e);process.exitCode=1;});
