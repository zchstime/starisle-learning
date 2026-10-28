import {Guardian3D} from './Guardian3D';
import {Node,Graphics,SpriteFrame,tween,Vec3,UIOpacity} from 'cc';
import {node,color,sprite} from '../ui/Kit';
/** Shared UI placement for the live 3D character and lightweight world effects. */
export function guardian(parent:Node,frame:SpriteFrame,x:number,y:number,size:number,onTap:()=>void){
 const actor=node(parent,'Guardian',x,y,size,size*1.12);
 if(Guardian3D.ready)actor.addComponent(Guardian3D).setup(size,onTap);
 else{sprite(actor,frame,0,0,size,size);actor.on(Node.EventType.TOUCH_END,onTap);}
 return actor;
}

export function fireflies(parent:Node){for(let i=0;i<12;i++){const n=node(parent,'WorldGlow',80+(i*127)%1320,190+(i*83)%510,10,10),g=n.addComponent(Graphics);g.fillColor=color(i%3?'#FFF3B5':'#D5FFF5',150);g.circle(0,0,2+i%3);g.fill();const o=n.addComponent(UIOpacity);o.opacity=70;tween(n).by(2+i%3,{position:new Vec3(12,24)}).by(2+i%3,{position:new Vec3(-12,-24)}).union().repeatForever().start();tween(o).to(1.5+i%2,{opacity:230}).to(1.5+i%2,{opacity:50}).union().repeatForever().start();}}
export function burst(parent:Node,x:number,y:number){for(let i=0;i<14;i++){const n=node(parent,'RewardSpark',x,y,10,10),g=n.addComponent(Graphics);g.fillColor=color(i%2?'#F7C95D':'#89D8C2');g.circle(0,0,4+i%3);g.fill();const a=i*Math.PI*2/14;tween(n).to(.75,{position:new Vec3(x+Math.cos(a)*180,-y+Math.sin(a)*140),scale:new Vec3(.25,.25,1)},{easing:'quadOut'}).start();const o=n.addComponent(UIOpacity);tween(o).delay(.3).to(.45,{opacity:0}).call(()=>n.destroy()).start();}}
