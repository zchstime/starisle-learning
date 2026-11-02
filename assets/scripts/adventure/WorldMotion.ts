import {motionAllowed} from '../ui/Motion';
import {Guardian3D} from './Guardian3D';
import {Node,Graphics,SpriteFrame,tween,Vec3,UIOpacity} from 'cc';
import {node,color,sprite} from '../ui/Kit';
/** Shared UI placement for the live 3D character and lightweight world effects. */
export function guardian(parent:Node,frame:SpriteFrame,x:number,y:number,size:number,onTap:()=>void){
 let actor=node(parent,'Guardian',x,y,size,size*1.12);
 if(Guardian3D.ready){
  try{actor.addComponent(Guardian3D).setup(size,onTap);return actor;}
  catch(error){
   console.warn('星宝3D初始化失败，使用原画继续探索。',error);
   actor.active=false;actor.destroy();
   actor=node(parent,'GuardianFallback',x,y,size,size*1.12);
  }
 }
 sprite(actor,frame,0,0,size,size);actor.on(Node.EventType.TOUCH_END,onTap);
 return actor;
}

export function fireflies(parent:Node){for(let i=0;i<12;i++){const n=node(parent,'WorldGlow',80+(i*127)%1320,190+(i*83)%510,10,10),g=n.addComponent(Graphics);g.fillColor=color(i%3?'#FFF3B5':'#D5FFF5',150);g.circle(0,0,2+i%3);g.fill();const o=n.addComponent(UIOpacity);o.opacity=70;tween(n).by(2+i%3,{position:new Vec3(12,24)}).by(2+i%3,{position:new Vec3(-12,-24)}).union().repeatForever().start();tween(o).to(1.5+i%2,{opacity:230}).to(1.5+i%2,{opacity:50}).union().repeatForever().start();}}
export function burst(parent:Node,x:number,y:number){if(!motionAllowed())return;for(let i=0;i<14;i++){const n=node(parent,'RewardSpark',x,y,10,10),g=n.addComponent(Graphics);g.fillColor=color(i%2?'#F7C95D':'#89D8C2');g.circle(0,0,4+i%3);g.fill();const a=i*Math.PI*2/14;tween(n).to(.75,{position:new Vec3(x+Math.cos(a)*180,-y+Math.sin(a)*140),scale:new Vec3(.25,.25,1)},{easing:'quadOut'}).start();const o=n.addComponent(UIOpacity);tween(o).delay(.3).to(.45,{opacity:0}).call(()=>n.destroy()).start();}}

/** Small native ornaments remain crisp at every device scale and pivot at the soil. */
export function gardenTree(parent:Node,style:number){
 const tree=node(parent,'GardenTree',85,66,64,66),g=tree.addComponent(Graphics);
 const tones=[['#7BBE96','#B8E3B4','#E4F4CF'],['#A394D0','#C8B9E9','#EADFFC'],['#DCB868','#F4D68A','#FFF0BE']][Math.max(0,Math.min(2,style))];
 g.fillColor=color('#315A49',30);g.ellipse(0,-2,25,5);g.fill();
 g.fillColor=color('#A37851');g.moveTo(-5,0);g.lineTo(-3,35);g.lineTo(3,35);g.lineTo(6,0);g.close();g.fill();
 g.strokeColor=color('#B98F60');g.lineWidth=3;g.moveTo(0,13);g.lineTo(-13,30);g.moveTo(0,22);g.lineTo(13,38);g.stroke();
 [[-17,33,17],[17,36,17],[0,46,22],[0,28,19]].forEach(([x,y,r],i)=>{g.fillColor=color(tones[i%2]);g.circle(x,y,r);g.fill();});
 g.fillColor=color(tones[2],190);g.ellipse(-8,52,10,5);g.fill();g.ellipse(17,40,5,3);g.fill();
 for(let i=0;i<4;i++){g.fillColor=color(style===2?'#FFF9DD':'#FFF0B8');g.circle(-17+i*11,29+(i%2)*12,2.6);g.fill();}
 if(motionAllowed())tween(tree).to(2.5,{angle:1.8},{easing:'sineInOut'}).to(2.5,{angle:-1.8},{easing:'sineInOut'}).union().repeatForever().start();
 return tree;
}
