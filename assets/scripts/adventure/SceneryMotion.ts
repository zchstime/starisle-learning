import {_decorator,Component,Graphics,Node,Sprite,SpriteFrame,Texture2D,UIOpacity,Material,EffectAsset,resources,Vec4,Vec3,isValid} from 'cc';
import {node,color,sprite} from '../ui/Kit';
const {ccclass}=_decorator;
type Fall=[number,number,number,number]; // x, y, width, height, normalized to the illustration
interface Scenery {falls?:Fall[];lights?:[number,number,number][];night?:boolean;sea?:boolean;}
/** Coordinates belong to the displayed artwork, never to the selected grade's fallback. */
export const SCENERY:Record<string,Scenery>={
 'world-grade-1':{falls:[[.112,.662,.045,.17],[.451,.425,.042,.13],[.730,.467,.033,.12],[.720,.607,.031,.15]],lights:[[.644,.317,.034]]},
 'world-grade-2':{falls:[[.251,.655,.039,.14],[.626,.408,.049,.14],[.773,.672,.042,.16],[.437,.331,.021,.10]],lights:[[.403,.204,.028]]},
 'world-grade-3':{sea:true,falls:[[.114,.515,.033,.13],[.449,.495,.027,.09],[.632,.511,.036,.12],[.100,.399,.050,.10]],lights:[[.877,.208,.025]]},
 'world-grade-4':{falls:[[.081,.576,.016,.11],[.384,.416,.016,.08],[.911,.591,.012,.08]],lights:[[.914,.501,.022]]},
 'world-grade-5':{falls:[[.066,.509,.012,.10],[.231,.578,.012,.10]],lights:[[.118,.163,.025],[.695,.397,.024]]},
 'world-grade-6':{falls:[[.082,.490,.012,.09],[.568,.589,.012,.10],[.823,.588,.015,.15]],lights:[[.379,.217,.024],[.916,.379,.035]],night:true},
 'world-subject-chinese':{falls:[[.208,.629,.016,.10],[.353,.580,.010,.09],[.799,.600,.015,.10]]},
 'world-subject-english':{},
 'world-subject-art':{falls:[[.514,.661,.012,.08]],lights:[[.518,.552,.025]]},
 'world-subject-science':{lights:[[.889,.459,.028]]},
 'world-subject-ethics':{falls:[[.168,.653,.013,.09],[.464,.542,.010,.08],[.904,.645,.010,.09]],lights:[[.161,.455,.020]]},
 'world-subject-music':{falls:[[.215,.619,.011,.08],[.452,.576,.011,.07]]},
 'world-subject-pe':{falls:[[.451,.646,.011,.07],[.625,.713,.010,.07]]},
 'world-subject-labor':{falls:[[.226,.586,.012,.07],[.941,.585,.012,.07]]},
 'world-subject-it':{falls:[[.350,.611,.011,.10],[.913,.601,.012,.09]],lights:[[.876,.398,.030]]},
 'world-subject-practice':{falls:[[.335,.596,.010,.07]],lights:[[.376,.337,.020]]},
};
const PREF='starisle-scenery-motion';
let sessionEnabled=true;
export function sceneryEnabled(){try{return localStorage.getItem(PREF)!=='off';}catch{return sessionEnabled;}}
export function setSceneryEnabled(enabled:boolean){sessionEnabled=enabled;try{localStorage.setItem(PREF,enabled?'on':'off');}catch{/* Storage may be unavailable; retain the session preference. */}if(typeof window!=='undefined')window.dispatchEvent(new Event('starisle:motion-change'));}
let softFrame:SpriteFrame;
function softLight(){
 if(softFrame)return softFrame;
 const size=64,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),i=(y*size+x)*4;
  data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*Math.pow(Math.max(0,1-r*r),3));
 }
 const texture=new Texture2D();texture.reset({width:size,height:size});texture.uploadData(data);
 softFrame=new SpriteFrame();softFrame.texture=texture;return softFrame;
}


let cloudFrame:SpriteFrame;
/** Reusable, softly lit cloud bank. Generated once, not per frame or per map. */
function cloudBank(){
 if(cloudFrame)return cloudFrame;
 const w=192,h=80,data=new Uint8Array(w*h*4);
 const lobes=[[.16,.61,.19,.25],[.32,.42,.20,.37],[.50,.55,.24,.40],[.69,.39,.18,.31],[.82,.62,.20,.24]];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/h;let density=0;
  for(const [cx,cy,rx,ry] of lobes)density+=Math.exp(-(((u-cx)/rx)**2+((v-cy)/ry)**2)*2.5);
  const billow=1+.13*Math.sin(u*43+Math.sin(v*21))+.07*Math.sin(u*91-v*45);
  const a=Math.min(1,density*.76)*billow*Math.sin(Math.PI*u)**2*Math.sin(Math.PI*v)**2;
  const i=(y*w+x)*4;data[i]=Math.round(248-v*15);data[i+1]=Math.round(248-v*14);data[i+2]=255;data[i+3]=Math.round(Math.min(1,a)*230);
 }
 const texture=new Texture2D();texture.reset({width:w,height:h});texture.uploadData(data);
 cloudFrame=new SpriteFrame();cloudFrame.texture=texture;return cloudFrame;
}
let surfaceEffect:Promise<EffectAsset|null>;
function loadSurface(){
 if(!surfaceEffect)surfaceEffect=new Promise(resolve=>resources.load('effects/living-scenery',EffectAsset,(error,effect)=>{
  if(error){console.warn('场景水流材质加载失败，保留环境动画。',error);surfaceEffect=undefined;resolve(null);}else resolve(effect);
 }));return surfaceEffect;
}
const owners=new WeakMap<Node,SceneryMotion>();
interface Drift {n:Node;o:UIOpacity;x:number;y:number;phase:number;depth:number;}
/** One bounded clock per map. All decorative layers stay below the interactive map. */
@ccclass('SceneryMotion')
export class SceneryMotion extends Component {
 private quiet=false;private profile:Scenery={};private time=0;private elapsed=0;private ink:Graphics;
 private fog:Drift[]=[];private motes:Drift[]=[];
 private lights:{n:Node;o:UIOpacity;phase:number}[]=[];
 private background:Sprite;private surface:Material;private originalMaterial:Material|null=null;
 private uniform=new Vec4();private petals=false;
 private origin:Vec3;private originalScale:Vec3;
 private media=typeof window!=='undefined'&&window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
 private enabledMotion=true;
 private lowPower=typeof navigator!=='undefined'&&navigator.hardwareConcurrency>0&&navigator.hardwareConcurrency<=4;
 setup(key:string,quiet=false){
  this.quiet=quiet;
  this.profile=SCENERY[key]||{};this.enabledMotion=sceneryEnabled();
  this.petals=['world-grade-2','world-grade-4','world-subject-chinese','world-subject-art'].includes(key);
  this.background=this.node.parent?.getComponent(Sprite);
  if(this.background){
   owners.get(this.background.node)?.releaseSurface();owners.set(this.background.node,this);
   this.originalMaterial=this.background.customMaterial;
   this.origin=this.background.node.position.clone();this.originalScale=this.background.node.scale.clone();
   const frame=this.background.spriteFrame;if(frame)frame.packable=false;
   void loadSurface().then(effect=>{
    if(!effect||!isValid(this,true)||!isValid(this.background,true)||owners.get(this.background.node)!==this)return;
    const material=new Material();material.initialize({effectAsset:effect,defines:{USE_TEXTURE:true}});
    for(let i=0;i<4;i++)material.setProperty('fall'+i,new Vec4(...(this.profile.falls?.[i]||[0,0,0,0])));
    this.surface=material;this.syncSurface();
   });
  }
  // Far wisps and near banks move at different speeds and in opposite directions.
  for(let i=0;i<(this.lowPower?5:9);i++){
   const depth=i<3?.35:1,x=i<3?-160+i*540:-240+(i-3)*310,y=i<3?175+(i%2)*120:625+(i%3)*48;
   const n=sprite(this.node,cloudBank(),x,y,depth<1?550:700,depth<1?125:220),o=n.addComponent(UIOpacity);
   n.name=depth<1?'DistantCloud':'DriftingMist';o.opacity=0;this.fog.push({n,o,x,y,phase:i*1.9,depth});
  }
  (this.profile.lights||[]).forEach(([x,y,r],i)=>{
   const radius=r*1440*1.8,n=sprite(this.node,softLight(),x*1440-radius,y*810-radius,radius*2,radius*2),o=n.addComponent(UIOpacity);
   n.name='LandmarkGlow';n.getComponent(Sprite).color=color(this.profile.night?'#C7C7FF':'#FFF3C5');o.opacity=0;this.lights.push({n,o,phase:i*2});
  });
  for(let i=0;i<(this.lowPower?8:16);i++){
   const depth=.5+(i%3)*.4,size=9+depth*9,x=(i*137)%1440,y=210+(i*79)%430;
   const n=sprite(this.node,softLight(),x,y,size,size),o=n.addComponent(UIOpacity);n.name='FloatingPollen';o.opacity=0;
   n.getComponent(Sprite).color=color(this.profile.night?'#C7E9FF':this.petals?'#FFD6E9':'#FFF1AD');this.motes.push({n,o,x,y,phase:i*2.4,depth});
  }
  const fx=node(this.node,'FlowAndBirds',0,0,1440,810);this.ink=fx.addComponent(Graphics);
  this.update(1/30);
 }
 private get moving(){return this.enabledMotion&&!this.media?.matches;}
 private syncSurface(){
  if(!this.surface||!isValid(this.background,true))return;
  this.uniform.set(this.time,this.quiet?.35:1,this.profile.night?1:0,this.profile.sea?1:0);this.surface.setProperty('motion',this.uniform);
  const wanted=this.moving?this.surface:this.originalMaterial;
  if(this.background.customMaterial!==wanted)this.background.customMaterial=wanted;
 }
 update(dt:number){
  if(!this.ink||typeof document!=='undefined'&&document.hidden)return;
  if(!this.moving){
   if(this.ink.node.active){this.node.children.forEach(n=>n.active=false);this.syncSurface();this.restoreCamera();}return;
  }
  if(!this.ink.node.active)this.node.children.forEach(n=>n.active=true);
  this.time+=Math.min(dt,.1)*(this.quiet?.4:1);this.elapsed+=dt;
  if(this.elapsed<1/(this.lowPower?20:30))return;this.elapsed=0;
  this.syncSurface();
  if(!this.quiet&&this.background&&owners.get(this.background.node)===this){
   // A slow, small camera drift moves scenery as one coherent world; HUD stays fixed.
   const zoom=1.024,dx=Math.sin(this.time*.17)*7,dy=Math.sin(this.time*.13)*4;
   this.background.node.setScale(this.originalScale.x*zoom,this.originalScale.y*zoom,this.originalScale.z);
   this.background.node.setPosition(this.origin.x-17+dx,this.origin.y+10+dy,this.origin.z);
  }
  this.draw();
 }
 private restoreCamera(){
  if(this.background&&owners.get(this.background.node)===this&&isValid(this.background,true)){
   this.background.node.setPosition(this.origin);this.background.node.setScale(this.originalScale);
  }
 }
 private releaseSurface(){
  if(this.background&&owners.get(this.background.node)===this){
   this.restoreCamera();
   if(isValid(this.background,true)&&this.background.customMaterial===this.surface)this.background.customMaterial=this.originalMaterial;
   owners.delete(this.background.node);
  }
  if(this.surface){this.surface.destroy();this.surface=null;}
 }
 onDestroy(){this.releaseSurface();}
 private draw(){
  const g=this.ink,t=this.time;g.clear();
  for(const [fx,fy,fw,fh] of this.profile.falls||[]){
   const x=fx*1440,y=fy*810,w=fw*1440,h=fh*810;
   for(let i=0;i<(this.lowPower?6:11);i++){
    const p=(t*(.48+i%3*.07)+i*.137)%1,fade=Math.sin(p*Math.PI);
    const sx=x+w*(.18+(i*.618%1)*.64),sy=y+p*(h-18);
    g.strokeColor=color('#ECFFFF',Math.round(90*fade));g.lineWidth=1+i%2*.7;
    g.moveTo(sx,-sy);g.bezierCurveTo(sx+1,-sy-6,sx-1,-sy-12,sx,-sy-18);g.stroke();
   }
   // Small mist droplets rise around each waterfall's foot, fading before they reach the rocks.
   for(let i=0;i<3;i++){const p=(t*.35+i/3)%1;g.fillColor=color('#E2FCFF',45*Math.sin(p*Math.PI));g.circle(x+w*.5+Math.sin(i*3+t)*w*.3,-y-h+p*16,1+p*2);g.fill();}
  }
  if(!this.quiet){if(this.profile.night)this.drawNight(g,t);else this.drawBirds(g,t);this.drawDrift(g,t);}
  this.fog.forEach(f=>{
   const speed=f.depth<1?.11:.16,direction=f.phase%3>1?-1:1;
   f.n.setPosition(f.x+Math.sin(t*speed+f.phase)*100*direction,-f.y+Math.sin(t*.20+f.phase)*17);
   f.o.opacity=(f.depth<1?32:95)+(f.depth<1?8:22)*Math.sin(t*.25+f.phase);
  });
  this.motes.forEach(f=>{
   const x=(f.x+t*(7+f.depth*5))%1500-30,y=f.y+Math.sin(t*.35+f.phase)*34;
   f.n.setPosition(x,-y);f.o.opacity=45+95*(.5+.5*Math.sin(t*.8+f.phase));
  });
  this.lights.forEach(f=>f.o.opacity=50+65*(.5+.5*Math.sin(t*.85+f.phase)));
 }
 private drawBirds(g:Graphics,t:number){
  for(let flock=0;flock<2;flock++){
   const period=flock?23:19,phase=(t+flock*12+5)%period,duration=flock?17:14;
   if(phase>duration)continue;
   const u=phase/duration,reverse=Math.floor((t+flock*12+5)/period)%2===1,count=flock?2:5;
   for(let i=0;i<count;i++){
    const x=(reverse?1510-u*1600:-70+u*1600)-i*26*(reverse?-1:1),y=(flock?235:123)+i*11+Math.sin(u*Math.PI*2)*24;
    const span=flock?13:7-i*.5,wing=Math.sin(t*(flock?5.5:7)+i*.8)*span*.6;
    g.strokeColor=color(flock?'#FFFCF1':'#52768E',flock?225:150-i*12);g.lineWidth=flock?2.8:1.6;
    g.moveTo(x-span,-y-wing);g.quadraticCurveTo(x-span*.45,-y+3,x,-y);g.quadraticCurveTo(x+span*.45,-y+3,x+span,-y-wing);g.stroke();
    if(flock){g.fillColor=color('#FFF9E8',220);g.ellipse(x,-y,2.2,3);g.fill();}
   }
  }
 }
 private drawDrift(g:Graphics,t:number){
  const count=this.lowPower?14:30;
  for(let i=0;i<count;i++){
   const near=i%4===0,speed=near?22:12;
   const x=((i*173+t*speed+Math.sin(t*.5+i)*28)%1560)-60;
   const y=115+((i*87+t*(near?13:7))%570),fade=Math.min(1,(y-115)/70,(685-y)/80);
   if(this.profile.night){g.fillColor=color('#F4E9FF',fade*(65+90*(.5+.5*Math.sin(t+i))));g.circle(x,-y,near?1.8:1);g.fill();continue;}
   const radius=near?5.5:3,angle=t*(near?.9:.5)+i*1.7,dx=Math.cos(angle)*radius,dy=Math.sin(angle)*radius;
   const hue=this.petals?(i%3?'#FFE0ED':'#FFF6FA'):(i%3?'#FFF3C9':'#F5FFE8');
   g.fillColor=color(hue,fade*(near?205:145));
   const flutter=.3+.7*Math.abs(Math.sin(t*1.7+i));
   g.moveTo(x-dx,-y-dy);g.bezierCurveTo(x-dy*flutter,-y+dx*flutter,x+dx*.9-dy*.6,-y+dy*.9+dx*.6,x+dx,-y+dy);
   g.bezierCurveTo(x+dy*flutter,-y-dx*flutter,x-dx*.9+dy*.6,-y-dy*.9-dx*.6,x-dx,-y-dy);g.fill();
  }
 }
 private drawNight(g:Graphics,t:number){
  for(let i=0;i<20;i++){
   const x=65+i*69,y=92+(i*47)%140,a=45+125*(.5+.5*Math.sin(t*.9+i*2));
   g.fillColor=color('#FFF5DC',a);g.circle(x,-y,1+i%3*.45);g.fill();
   if(i%4===0){g.strokeColor=color('#EEF5FF',a*.7);g.lineWidth=.8;g.moveTo(x-4,-y);g.lineTo(x+4,-y);g.moveTo(x,-y-4);g.lineTo(x,-y+4);g.stroke();}
  }
  const p=(t+3)%13;
  if(p<2.3){const u=p/2.3,x=300+u*590,y=96+u*130,fade=Math.sin(u*Math.PI);for(let i=0;i<12;i++){g.strokeColor=color('#E1F7FF',fade*(1-i/12)*160);g.lineWidth=1.7;g.moveTo(x-i*7,-y+i*1.7);g.lineTo(x-(i+1)*7,-y+(i+1)*1.7);g.stroke();}}
 }
}
export function sceneryMotion(parent:Node,key:string,quiet=false){
 const layer=node(parent,'LivingScenery:'+key,0,0,1440,810);layer.addComponent(SceneryMotion).setup(key,quiet);return layer;
}
