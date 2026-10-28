import {_decorator,Component,Node,Camera,RenderTexture,SpriteFrame,Sprite,Prefab,resources,instantiate,Color,Vec3,Vec4,DirectionalLight,Graphics,UIOpacity} from 'cc';
import {node,color} from '../ui/Kit';
const {ccclass}=_decorator;
const MODEL_LAYER=1<<19;
const MODEL_PATH='characters/xingbao/xingbao';

/** Imported Blender character, rendered into the existing island's UI layer. */
@ccclass('Guardian3D')
export class Guardian3D extends Component {
 private static prefab:Prefab;
 private static loading:Promise<void>;
 static get ready(){return !!this.prefab;}
 static preload():Promise<void>{
  if(this.prefab)return Promise.resolve();
  if(!this.loading)this.loading=new Promise<void>((resolve,reject)=>resources.load(MODEL_PATH,Prefab,(error,prefab)=>{
   if(error){this.loading=undefined;reject(error);return;}
   this.prefab=prefab;resolve();
  }));
  return this.loading;
 }
 private studio:Node;private pose:Node;private camera:Camera;
 private texture:RenderTexture;private frame:SpriteFrame;private shadow:UIOpacity;
 private time=0;private action=0;private yaw=0;private dragX=0;private dragged=false;private dragging=false;
 private speaking=false;
 private onSpeech=(e:Event)=>{this.speaking=!!(e as CustomEvent).detail;};
 setup(size:number,onTap:()=>void){
  if(!Guardian3D.prefab)throw new Error('Load Xingbao before creating its portrait.');
  if(typeof window!=='undefined'){window.addEventListener('starisle:companion-speaking',this.onSpeech);this.speaking=!!document.getElementById('xingbao-companion')?.classList.contains('speaking');}
  const scene=this.node.scene;
  scene.globals.ambient.skyColor=new Vec4(.8,.86,1,1);
  scene.globals.ambient.groundAlbedo=new Vec4(.42,.34,.25,1);
  scene.globals.ambient.skyIllum=32000;
  this.studio=new Node('StarBao3DStudio');scene.addChild(this.studio);this.studio.setPosition(0,-10000,0);
  this.pose=new Node('XingbaoPose');this.pose.parent=this.studio;
  const model=instantiate(Guardian3D.prefab);model.name='XingbaoV3';model.parent=this.pose;model.setPosition(-.12,0,0);
  const setLayer=(n:Node)=>{n.layer=MODEL_LAYER;n.children.forEach(setLayer);};setLayer(model);
  const light=new Node('PortraitKeyLight');light.parent=this.studio;light.setRotationFromEuler(-28,-35,0);
  const sun=light.addComponent(DirectionalLight);sun.color=new Color(255,239,214);sun.illuminance=80000;
  const cameraNode=new Node('PortraitCamera');cameraNode.parent=this.studio;cameraNode.setPosition(0,1.6,8);cameraNode.lookAt(new Vec3(0,-9998.4,0));
  const camera=this.camera=cameraNode.addComponent(Camera);camera.projection=Camera.ProjectionType.ORTHO;camera.orthoHeight=1.85;
  camera.near=.1;camera.far=20;camera.priority=-10;camera.visibility=MODEL_LAYER;
  camera.clearFlags=Camera.ClearFlag.SOLID_COLOR;camera.clearColor=new Color(0,0,0,0);
  this.texture=new RenderTexture();this.texture.reset({width:512,height:512});camera.targetTexture=this.texture;
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
  this.node.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;this.dragging=false;if(!this.dragged){this.action=1;onTap();}});
  this.node.on(Node.EventType.TOUCH_CANCEL,()=>{this.dragging=false;this.dragged=false;});
 }
 update(dt:number){
  if(!this.pose)return;
  const step=Math.min(dt,.05);this.time+=step;this.action=Math.max(0,this.action-step);
  const hop=this.action>0?Math.sin((1-this.action)*Math.PI):0;
  this.pose.setPosition(0,Math.sin(this.time*2)*.018+hop*.24,0);
  const talking=this.speaking&&!this.dragging;
  this.pose.setRotationFromEuler(talking?Math.sin(this.time*9)*2:0,this.yaw+(this.dragging?0:Math.sin(this.time*.7)*5),Math.sin(this.time*1.5)*(talking?2.4:1.1));
  this.shadow.opacity=255-hop*110;
 }
 // UI pages are detached before their deferred destruction. Stop off-screen
 // cameras immediately, so quick hint toggles never leave duplicate studios.
 onEnable(){if(this.studio)this.studio.active=true;}
 onDisable(){if(this.studio)this.studio.active=false;}
 onDestroy(){
  if(typeof window!=='undefined')window.removeEventListener('starisle:companion-speaking',this.onSpeech);
  if(this.camera){this.camera.enabled=false;this.camera.targetTexture=null;}
  if(this.studio){this.studio.active=false;this.studio.destroy();}
  this.frame?.destroy();this.texture?.destroy();
 }
}
