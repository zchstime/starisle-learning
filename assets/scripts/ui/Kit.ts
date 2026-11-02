import {motionAllowed} from './Motion';
import { Node, UITransform, Graphics, Color, Label, Sprite, SpriteFrame, Layers, tween, Vec3 } from 'cc';
export const C = { ink: '#173F4C', muted: '#607D86', teal: '#238E90', mint: '#E3F4EA', gold: '#FFD984', cream: '#FFFDF5', line: '#D6E7E4', blue: '#EAF4F7' };
export function color(hex: string, alpha = 255) { const c = new Color(); Color.fromHEX(c, hex); c.a = alpha; return c; }
export function node(parent: Node, name: string, x: number, y: number, w: number, h: number) {
  const n = new Node(name); n.layer = Layers.Enum.UI_2D; n.parent = parent; n.setPosition(x, -y);
  const tr = n.addComponent(UITransform); tr.setAnchorPoint(0, 1); tr.setContentSize(w, h); return n;
}
export function panel(parent: Node, x: number, y: number, w: number, h: number, fill = C.cream, radius = 22, stroke = '', alpha = 255) {
  const n = node(parent, 'Panel', x,y,w,h); const g = n.addComponent(Graphics);
  if(radius>=18&&alpha>=230&&w*h>=40000){g.fillColor=color('#234F61',20);g.roundRect(0,-h-7,w,h,radius);g.fill();g.fillColor=color('#234F61',10);g.roundRect(-2,-h-11,w+4,h,radius+2);g.fill();}
  g.fillColor = color(fill, alpha); g.roundRect(0,-h,w,h,radius); g.fill();
  if(radius>=18&&alpha>=230&&w*h>=40000){g.strokeColor=color('#FFFFFF',155);g.lineWidth=1.5;g.roundRect(3,-h+3,w-6,h-6,Math.max(1,radius-3));g.stroke();}
  if (stroke) { g.strokeColor = color(stroke); g.lineWidth = 2; g.roundRect(1,-h+1,w-2,h-2,radius); g.stroke(); } return n;
}
export function text(parent: Node, value: string, x: number, y: number, w: number, h: number, size = 22, fill = C.ink, bold = false, align: 'left'|'center'|'right' = 'left') {
  const n = node(parent, value.slice(0,30),x,y,w,h); const l = n.addComponent(Label);
  l.string = value; l.fontFamily = 'Arial'; l.fontSize = size; l.lineHeight = Math.round(size*1.4); l.color = color(fill); l.isBold = bold;
  l.horizontalAlign = align === 'center' ? Label.HorizontalAlign.CENTER : align === 'right' ? Label.HorizontalAlign.RIGHT : Label.HorizontalAlign.LEFT;
  l.verticalAlign = Label.VerticalAlign.CENTER; l.overflow = Label.Overflow.SHRINK; l.enableWrapText = true; return n;
}
export function button(parent: Node, value: string, x: number,y: number,w: number,h: number, action: () => void, fill = C.cream, ink = C.ink, size = 22) {
  const n = panel(parent,x,y,w,h,fill,Math.min(22,h/2), fill===C.cream?C.line:''); n.name = 'Button:'+value;
  text(n,value,14,0,w-28,h,size,ink,true,'center');
  let feedback:ReturnType<typeof tween<Node>>|null=null;
  const pose=(scale:number)=>{
    feedback?.stop();
    const position=new Vec3(x+w*(1-scale)/2,-y-h*(1-scale)/2,0);
    if(!motionAllowed()){n.setScale(1,1,1);n.setPosition(x,-y);return;}
    feedback=tween(n).to(.11,{scale:new Vec3(scale,scale,1),position},{easing:'quadOut'}).start();
  };
  n.on(Node.EventType.TOUCH_START,()=>pose(.975));
  n.on(Node.EventType.TOUCH_CANCEL,()=>pose(1));
  n.on(Node.EventType.TOUCH_END, (e: any) => { e.propagationStopped = true;feedback?.stop();n.setScale(1,1,1);n.setPosition(x,-y);action(); });
  n.on(Node.EventType.MOUSE_ENTER,()=>pose(1.018));
  n.on(Node.EventType.MOUSE_LEAVE,()=>pose(1));
  return n;
}
export function sprite(parent: Node, frame: SpriteFrame, x: number,y: number,w: number,h: number) {
  const n=node(parent,'Art',x,y,w,h);const s=n.addComponent(Sprite);s.sizeMode=Sprite.SizeMode.CUSTOM;s.spriteFrame=frame;return n;
}
