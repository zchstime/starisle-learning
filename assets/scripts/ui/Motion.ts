import {_decorator,Component,Node,UIOpacity,UITransform,tween,Vec3} from 'cc';
const {ccclass}=_decorator;
export function motionAllowed(){
 try{if(typeof localStorage!=='undefined'&&localStorage.getItem('starisle-scenery-motion')==='off')return false;}catch{}
 return !(typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}
/** Animate navigation once; answering or editing on the same page must not replay entrances. */
const pages=new WeakMap<Node,string>();
const pending=new WeakMap<Node,Node>();
@ccclass('PageArrival')
class PageArrival extends Component {
 update(){
  const root=this.node.parent;if(root&&motionAllowed()){
   let i=0;
   for(const child of root.children){
    if(child===this.node||child.name==='WorldViewport'||child.name.startsWith('World:')||child.name.startsWith('LivingScenery')||child.name==='Art')continue;
    const tr=child.getComponent(UITransform);if(!tr||tr.width>=1440&&tr.height>=810||child.name==='Guardian')continue;
    const opacity=child.getComponent(UIOpacity)||child.addComponent(UIOpacity),target=opacity.opacity;
    opacity.opacity=0;tween(opacity).delay(Math.min(i++*.018,.12)).to(.28,{opacity:target},{easing:'quadOut'}).start();
    if(child.name==='Panel'&&tr.width>700&&child.children.length>2){const p=child.position.clone();child.setPosition(p.x,p.y-10,p.z);tween(child).to(.34,{position:p},{easing:'cubicOut'}).start();}
   }
  }
  this.node.destroy();
 }
}
export function pageArrival(root:Node,key:string){
 if(pages.get(root)===key)return;pages.set(root,key);if(!motionAllowed())return;
 pending.get(root)?.destroy();
 const marker=new Node('PageArrival');pending.set(root,marker);marker.parent=root;marker.addComponent(PageArrival);
}
export function reveal(n:Node,delay=0){
 if(!motionAllowed())return;
 const o=n.getComponent(UIOpacity)||n.addComponent(UIOpacity),target=o.opacity;o.opacity=0;tween(o).delay(delay).to(.3,{opacity:target},{easing:'quadOut'}).start();
}
export function growBar(n:Node){if(motionAllowed()){n.setScale(0,1,1);tween(n).to(.65,{scale:new Vec3(1,1,1)},{easing:'cubicOut'}).start();}}
export function rewardPop(n:Node){if(motionAllowed()){n.setScale(.72,.72,1);tween(n).to(.45,{scale:new Vec3(1,1,1)},{easing:'backOut'}).start();}}
