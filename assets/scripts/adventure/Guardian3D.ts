import {_decorator,Component,Node,Camera,RenderTexture,SpriteFrame,Sprite,Prefab,resources,instantiate,Color,Vec3,Vec4,DirectionalLight,Graphics,UIOpacity,SkeletalAnimation,AnimationClip,EffectAsset,Material,MeshRenderer} from 'cc';
import {node,color} from '../ui/Kit';
import {SpeechFrame,SPEECH_FRAME_EVENT} from './SpeechMotion';
const {ccclass}=_decorator;
const MODEL_LAYER=1<<19;
const MODEL_PATH='characters/xingbao/xingbao';

/** Imported Blender character, rendered into the existing island's UI layer. */
@ccclass('Guardian3D')
export class Guardian3D extends Component {
 private static prefab:Prefab;
 private static portraitEffect:EffectAsset;
 private static loading:Promise<void>;
 static get ready(){return !!this.prefab&&!!this.portraitEffect;}
 static preload():Promise<void>{
  if(this.ready)return Promise.resolve();
  if(!this.loading)this.loading=Promise.all([
   new Promise<void>((resolve,reject)=>resources.load(MODEL_PATH,Prefab,(error,prefab)=>{
    if(error){reject(error);return;}this.prefab=prefab;resolve();
   })),
   new Promise<void>((resolve,reject)=>resources.load('characters/xingbao-portrait',EffectAsset,(error,effect)=>{
    if(error){reject(error);return;}this.portraitEffect=effect;resolve();
   })),
  ]).then(()=>{}).catch(error=>{this.loading=undefined;throw error;});
  return this.loading;
 }
 private studio:Node;private pose:Node;private camera:Camera;
 private texture:RenderTexture;private frame:SpriteFrame;private shadow:UIOpacity;
 private portraitMaterials:Material[]=[];
 private time=0;private action=0;private yaw=0;private dragX=0;private dragged=false;private dragging=false;
 private speaking=false;
 private animation:SkeletalAnimation;private motion='';private waveUntil=2.6;private nextWave=11;
 private faces:MeshRenderer[]=[];private mouthOpen=0;private mouthTarget=0;private mouthRound=0;private speechAge=Infinity;
 private nextBlink=2.7;private blinkStart=-10;
 private onSpeech=(e:Event)=>{this.speaking=!!(e as CustomEvent).detail;if(!this.speaking)this.mouthTarget=0;};
 private onSpeechFrame=(e:Event)=>{const f=(e as CustomEvent<SpeechFrame>).detail;this.speechAge=0;this.speaking=f.playing;this.mouthTarget=f.playing?f.open:0;this.mouthRound=f.round;};
 setup(size:number,onTap:()=>void){
  if(!Guardian3D.ready)throw new Error('Load Xingbao before creating its portrait.');
  if(typeof window!=='undefined'){window.addEventListener('starisle:companion-speaking',this.onSpeech);window.addEventListener(SPEECH_FRAME_EVENT,this.onSpeechFrame);this.speaking=!!document.getElementById('xingbao-companion')?.classList.contains('speaking');}
  const scene=this.node.scene;
  scene.globals.ambient.skyColor=new Vec4(.95,.97,1,1);
  scene.globals.ambient.groundAlbedo=new Vec4(.72,.69,.65,1);
  scene.globals.ambient.skyIllum=40000;
  this.studio=new Node('StarBao3DStudio');scene.addChild(this.studio);this.studio.setPosition(0,-10000,0);
  this.pose=new Node('XingbaoPose');this.pose.parent=this.studio;
  const model=instantiate(Guardian3D.prefab);model.name='XingbaoSpaceV5';model.parent=this.pose;model.setPosition(0,0,0);
  // Keep the baked cream/blue palette independent of the island's HDR mapping.
  const materials=new Map<Material,Material>();
  for(const renderer of model.getComponentsInChildren(MeshRenderer)){
   if(renderer.mesh?.struct.morph?.targetNames?.includes('Mouth_Close'))this.faces.push(renderer);
   renderer.sharedMaterials=renderer.sharedMaterials.map(source=>{
    if(!source)return source;
    let material=materials.get(source);
    if(!material){
     const texture=source.getProperty('mainTexture');
     material=new Material('Xingbao portrait '+source.name);
     material.initialize({effectAsset:Guardian3D.portraitEffect,defines:{USE_TEXTURE:!!texture,USE_VERTEX_COLOR:true}});
     if(texture)material.setProperty('mainTexture',texture);
     materials.set(source,material);this.portraitMaterials.push(material);
    }
    return material;
   });
  }
  this.animation=model.getComponent(SkeletalAnimation);
  if(this.animation){this.animation.useBakedAnimation=false;this.playMotion('Wave');}
  const setLayer=(n:Node)=>{n.layer=MODEL_LAYER;n.children.forEach(setLayer);};setLayer(model);
  const light=new Node('PortraitKeyLight');light.parent=this.studio;light.setRotationFromEuler(-28,-35,0);
  const sun=light.addComponent(DirectionalLight);sun.color=new Color(255,250,242);sun.illuminance=55000;
  const cameraNode=new Node('PortraitCamera');cameraNode.parent=this.studio;cameraNode.setPosition(0,1.6,8);cameraNode.lookAt(new Vec3(0,-9998.4,0));
  const camera=this.camera=cameraNode.addComponent(Camera);camera.projection=Camera.ProjectionType.ORTHO;camera.orthoHeight=1.85;
  camera.near=.1;camera.far=20;camera.priority=-10;camera.visibility=MODEL_LAYER;
  camera.clearFlags=Camera.ClearFlag.SOLID_COLOR;camera.clearColor=new Color(0,0,0,0);
  this.texture=new RenderTexture();this.texture.reset({width:1024,height:1024});camera.targetTexture=this.texture;
  this.frame=new SpriteFrame();this.frame.texture=this.texture;this.frame.flipUVY=false;
  const shadow=node(this.node,'GroundShadow',0,size*1.01,size,18),g=shadow.addComponent(Graphics);
  g.fillColor=color('#173E47',45);g.ellipse(size*.5,-5,size*.29,7);g.fill();this.shadow=shadow.addComponent(UIOpacity);
  const picture=node(this.node,'Realtime3DPortrait',-size*.12,-size*.12,size*1.24,size*1.24);
  const sprite=picture.addComponent(Sprite);sprite.sizeMode=Sprite.SizeMode.CUSTOM;sprite.spriteFrame=this.frame;
  this.node.on(Node.EventType.TOUCH_START,(e:any)=>{this.dragX=e.getUILocation().x;this.dragged=false;this.dragging=true;});
  this.node.on(Node.EventType.TOUCH_MOVE,(e:any)=>{
   const dx=e.getUILocation().x-this.dragX;if(Math.abs(dx)>3)this.dragged=true;
   this.yaw=((this.yaw+dx*.65+180)%360+360)%360-180;
   this.dragX=e.getUILocation().x;e.propagationStopped=true;
  });
  this.node.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;this.dragging=false;if(!this.dragged){this.action=1;this.waveUntil=this.time+2.6;onTap();}});
  this.node.on(Node.EventType.TOUCH_CANCEL,()=>{this.dragging=false;this.dragged=false;});
 }
 update(dt:number){
  if(!this.pose||!this.shadow)return;
  const step=Math.min(dt,.05);this.time+=step;this.speechAge+=dt;this.action=Math.max(0,this.action-step);
  if(this.speechAge>.25)this.mouthTarget=0;
  const activeSpeech=this.speaking&&this.speechAge<.25;
  if(!activeSpeech&&this.time>this.nextWave){this.waveUntil=this.time+2.6;this.nextWave=this.time+11+Math.random()*6;}
  this.playMotion(activeSpeech?'TalkGesture':this.time<this.waveUntil?'Wave':'Idle');
  this.mouthOpen+=(this.mouthTarget-this.mouthOpen)*(1-Math.exp(-dt/(this.mouthTarget>this.mouthOpen?.035:.025)));
  if(this.mouthTarget===0&&this.mouthOpen<.01)this.mouthOpen=0;
  if(this.time>this.nextBlink){this.blinkStart=this.time;this.nextBlink=this.time+3+Math.random()*2.5;}
  const hop=this.action>0?Math.sin((1-this.action)*Math.PI):0;
  this.pose.setPosition(0,Math.sin(this.time*2)*.018+hop*.24,0);
  const talking=activeSpeech&&!this.dragging;
  this.pose.setRotationFromEuler(talking?Math.sin(this.time*5)*this.mouthOpen*2:0,this.yaw+(this.dragging?0:Math.sin(this.time*.7)*5),Math.sin(this.time*1.5)*(talking?2.0:1.1));
  this.shadow.opacity=255-hop*110;
 }
 private playMotion(name:string){
  if(!this.animation||this.motion===name||!this.animation.clips.some(c=>c.name===name))return;
  const state=this.animation.getState(name);state.wrapMode=AnimationClip.WrapMode.Loop;state.speed=name==='Wave'?.85:1;
  this.animation.crossFade(name,.25);this.motion=name;
 }
 lateUpdate(){
  const b=(this.time-this.blinkStart)/.20;const blink=b>=0&&b<1?Math.sin(b*Math.PI):0;
  for(const face of this.faces){
   const morph=face.mesh.struct.morph!,names=morph.targetNames!;
   const weights=names.map(name=>name==='Mouth_Close'?1-this.mouthOpen:name==='Talk_A'?this.mouthOpen*(1-this.mouthRound)*.45:name==='Talk_O'?this.mouthOpen*this.mouthRound:name==='Blink_L'||name==='Blink_R'?blink:0);
   morph.subMeshMorphs.forEach((sub,i)=>{if(sub)face.setWeights(weights,i);});
  }
 }
 // UI pages are detached before their deferred destruction. Stop off-screen
 // cameras immediately, so quick hint toggles never leave duplicate studios.
 onEnable(){if(this.studio)this.studio.active=true;}
 onDisable(){if(this.studio)this.studio.active=false;}
 onDestroy(){
  if(typeof window!=='undefined'){window.removeEventListener('starisle:companion-speaking',this.onSpeech);window.removeEventListener(SPEECH_FRAME_EVENT,this.onSpeechFrame);}
  if(this.camera){this.camera.enabled=false;this.camera.targetTexture=null;}
  if(this.studio){this.studio.active=false;this.studio.destroy();}
  this.frame?.destroy();this.texture?.destroy();
  this.portraitMaterials.forEach(material=>material.destroy());
 }
}
