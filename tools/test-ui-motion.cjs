const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('/Applications/CocosCreator-3.8.8.app/Contents/Resources/app.asar.unpacked/node_modules/typescript');
const animations=[],storage=new Map(),media={matches:false};
class Vec3{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}clone(){return new Vec3(this.x,this.y,this.z);}}
class Node{static EventType={TOUCH_START:'start',TOUCH_CANCEL:'cancel',TOUCH_END:'end',MOUSE_ENTER:'enter',MOUSE_LEAVE:'leave'};constructor(name=''){this.name=name;this.children=[];this.position=new Vec3();this.scale=new Vec3(1,1,1);this.components=new Map();this.events={};}set parent(p){this._parent=p;p?.children.push(this);}get parent(){return this._parent;}setPosition(x,y,z=0){this.position=x instanceof Vec3?x.clone():new Vec3(x,y,z);}setScale(x,y,z){this.scale=new Vec3(x,y,z);}addComponent(T){const c=new T();c.node=this;this.components.set(T,c);return c;}getComponent(T){return this.components.get(T);}on(e,f){this.events[e]=f;}destroy(){this.destroyed=true;}}
class UITransform{setAnchorPoint(){}setContentSize(width,height){Object.assign(this,{width,height});}}
class UIOpacity{constructor(){this.opacity=255;}}
class Graphics{roundRect(){}fill(){}stroke(){}}
class Color{static fromHEX(){}}
class Label{static HorizontalAlign={};static VerticalAlign={};static Overflow={};}
function tween(target){const t={target,to(){return t;},delay(){return t;},start(){animations.push(t);return t;},stop(){t.stopped=true;}};return t;}
const cc={Node,Vec3,UITransform,UIOpacity,Graphics,Color,Label,Layers:{Enum:{UI_2D:1}},Component:class{},_decorator:{ccclass:()=>c=>c},tween};
function load(path,deps){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText,{exports,require:id=>deps[id],localStorage:{getItem:k=>storage.get(k)},window:{matchMedia:()=>media}});return exports;}
const motion=load('assets/scripts/ui/Motion.ts',{cc}),kit=load('assets/scripts/ui/Kit.ts',{cc,'./Motion':motion});
const root=new Node('root');let actions=0;const b=kit.button(root,'Start',20,30,200,60,()=>actions++);
b.events.start();const first=animations.at(-1);b.events.cancel();assert.ok(first.stopped);assert.equal(actions,0);b.events.end({});assert.equal(actions,1);assert.equal(b.scale.x,1);assert.equal(b.position.x,20);assert.equal(b.position.y,-30);
const before=animations.length;storage.set('starisle-scenery-motion','off');b.events.enter();assert.equal(animations.length,before);motion.pageArrival(root,'disabled');assert.ok(!root.children.some(n=>n.name==='PageArrival'));storage.delete('starisle-scenery-motion');
motion.pageArrival(root,'play');let markers=root.children.filter(n=>n.name==='PageArrival'&&!n.destroyed);assert.equal(markers.length,1);for(const c of markers[0].components.values())c.update();assert.ok(markers[0].destroyed);const length=root.children.length;motion.pageArrival(root,'play');assert.equal(root.children.length,length,'editing same page cannot replay entrance');
motion.pageArrival(root,'library');motion.pageArrival(root,'journal');assert.equal(root.children.filter(n=>n.name==='PageArrival'&&!n.destroyed).length,1,'navigation in one frame coalesces');media.matches=true;const count=animations.length;motion.growBar(new Node());motion.rewardPop(new Node());assert.equal(animations.length,count);
console.log('PASS UI motion: immediate action, cancelled press, stopped overlapping feedback, same-page stability, coalesced navigation, reduced motion');
