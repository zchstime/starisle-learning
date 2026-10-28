import {Node,Graphics,tween,Vec3,UITransform,EventTouch,Label} from 'cc';
import {node,panel,text,color,C} from '../ui/Kit';
import {Level} from './Catalog';
import {Puzzle} from './Puzzle';
/** Friendly cloud creature: a chapter's remaining tasks form its shield. */
export function starMonster(parent:Node,remaining:number,total:number,hit=false){
 const purified=remaining<=0;
 const n=node(parent,'StarMonster',66,25,160,140),g=n.addComponent(Graphics);
 g.fillColor=color(purified?'#B8E8CF':'#D6C5F2');g.ellipse(80,-65,70,54);g.fill();g.circle(32,-31,25);g.fill();g.circle(125,-29,23);g.fill();
 if(purified){g.strokeColor=color('#357E71');g.lineWidth=4;for(const x of [56,104]){g.moveTo(x-12,-63);g.quadraticCurveTo(x,-45,x+12,-63);g.stroke();}text(n,'✦',58,-10,44,40,33,'#E2AD39',true,'center');}
 else{g.fillColor=color('#FFFFFF');g.ellipse(56,-59,15,20);g.fill();g.ellipse(104,-59,15,20);g.fill();g.fillColor=color('#31466C');g.circle(59,-62,7);g.fill();g.circle(101,-62,7);g.fill();}
 g.strokeColor=color('#77619C');g.lineWidth=4;g.moveTo(69,-86);g.quadraticCurveTo(80,-98,92,-86);g.stroke();g.fillColor=color('#F4A9BF');g.ellipse(35,-82,13,7);g.fill();g.ellipse(126,-82,13,7);g.fill();
 if(hit)tween(n).to(.1,{scale:new Vec3(1.13,.86,1)}).to(.15,{scale:new Vec3(.94,1.08,1)}).to(.16,{scale:Vec3.ONE}).start();
 tween(n).by(1.3,{position:new Vec3(0,6,0)}).by(1.3,{position:new Vec3(0,-6,0)}).union().repeatForever().start();
 text(parent,purified?'星光伙伴 · 净化成功':'迷雾星怪 · 答对破盾',15,145,262,33,21,C.ink,true,'center');
 panel(parent,29,185,234,13,purified?'#89CDB0':'#D8D4DF',6);if(remaining>0)panel(parent,29,185,234*remaining/total,13,'#A594DC',6);
 text(parent,remaining?`护盾 ${remaining} / ${total}`:'已净化 · 欢迎再来练习',20,200,252,27,16,C.muted,false,'center');
 return n;
}
/** A spatial answer mechanic, also operable by two taps without dragging. */
export function runeDelivery(w:Node,l:Level,p:Puzzle,btn:any,changed:()=>void){
 const heading=text(w,p.choice<0?'把答案符石送入星光阵':'符石已就位，准备发射！',24,8,965,45,26,C.teal,true,'center');
 const zone=panel(w,315,211,384,163,p.choice<0?'#D6E8F5':'#D7EDDC',65,'#FFFFFF');zone.name='AnswerPortal';
 text(zone,p.choice<0?'✦  星光阵':l.options[p.choice],20,25,344,80,p.choice<0?29:25,C.ink,true,'center');const portalNote=text(zone,p.choice<0?'拖到这里，或点符石后点这里':'✓ 已放入 · 点右下方发射',15,116,354,30,17,C.muted,false,'center');
 const glow=node(zone,'DropHighlight',0,0,384,163),outline=glow.addComponent(Graphics);outline.strokeColor=color('#E4B450');outline.lineWidth=5;outline.roundRect(4,-159,376,155,60);outline.stroke();glow.active=false;
 p.pendingRune=-1;
 const choose=(idx:number)=>{p.pendingRune=-1;p.choice=idx;changed();};
 let armed=-1;const markers:Node[]=[];const resetArmed=()=>{armed=-1;p.pendingRune=-1;heading.getComponent(Label).string=p.choice<0?'把答案符石送入星光阵':'符石已就位，准备发射！';portalNote.getComponent(Label).string=p.choice<0?'拖到这里，或点符石后点这里':'✓ 已放入 · 点右下方发射';markers.forEach(m=>m.active=false);glow.active=false;};const note=text(w,'',24,375,965,26,16,C.teal,true,'center');
 zone.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;if(armed>=0)choose(armed);});
 p.optionOrder.forEach((idx,i)=>{
  const x=38+i*326,y=76,n=btn(w,l.options[idx],x,y,301,105,()=>{},p.choice===idx?C.gold:C.cream,C.ink,26);
  const marker=node(n,'RunePicked',0,0,301,105),border=marker.addComponent(Graphics);border.strokeColor=color('#E4B450');border.lineWidth=4;border.roundRect(3,-102,295,99,20);border.stroke();marker.active=false;markers.push(marker);
  // Replace the generic end handler; preserve its hover styling.
  n.off(Node.EventType.TOUCH_END);let origin:Vec3|null=null,moved=false;
  n.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{const q=e.getUILocation();origin=new Vec3(q.x,q.y,0);moved=false;resetArmed();p.pendingRune=idx;heading.getComponent(Label).string='把新符石放入星光阵';portalNote.getComponent(Label).string='新符石待放入 · 点这里更换';note.getComponent(Label).string='';});
  n.on(Node.EventType.TOUCH_MOVE,(e:EventTouch)=>{if(!origin)return;const q=e.getUILocation(),d=new Vec3(q.x-origin.x,q.y-origin.y,0);if(Math.abs(d.x)+Math.abs(d.y)>12)moved=true;n.setPosition(Math.max(12,Math.min(700,x+d.x)),Math.max(-286,Math.min(-60,-y+d.y)));glow.active=zone.getComponent(UITransform).getBoundingBoxToWorld().contains(q);note.getComponent(Label).string=glow.active?'松开放入星光阵':'把符石移到下方星光阵';});
  n.on(Node.EventType.TOUCH_CANCEL,()=>{n.setPosition(x,-y);origin=null;resetArmed();note.getComponent(Label).string='已放回原处，可以重新选择';});
  n.on(Node.EventType.TOUCH_END,(e:EventTouch)=>{e.propagationStopped=true;const q=e.getUILocation(),inside=zone.getComponent(UITransform).getBoundingBoxToWorld().contains(q);n.setPosition(x,-y);origin=null;if(moved){resetArmed();if(inside)choose(idx);else note.getComponent(Label).string=(p.choice<0?'没有放入星光阵，符石已归位':'已取消更换，保留阵心原来的答案');return;}armed=idx;p.pendingRune=idx;portalNote.getComponent(Label).string='新符石待放入 · 点这里更换';marker.active=true;glow.active=true;note.getComponent(Label).string='已拿起：'+l.options[idx]+' · 点星光阵放入';});
 });
}
export function usesRunes(l:Level){return l.kind==='choice'&&!l.passage&&!l.colors&&!l.voice?.startsWith('tone_');}
