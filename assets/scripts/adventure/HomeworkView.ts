import {EditBox,Graphics,Label,Node} from 'cc';
import {C,color,panel,text,button} from '../ui/Kit';
import type {Level} from './Catalog';
import type {Puzzle} from './Puzzle';

function input(parent:Node,value:string,placeholder:string,x:number,y:number,w:number,h:number,max:number,multiline:boolean,changed:(v:string)=>void){
 const box=panel(parent,x,y,w,h,C.cream,12,C.line);box.name='HomeworkInput';box.active=false;
 const label=text(box,'',12,5,w-24,h-10,24,C.ink).getComponent(Label);
 const ghost=text(box,'',12,5,w-24,h-10,21,C.muted).getComponent(Label);
 const edit=box.addComponent(EditBox);edit.textLabel=label;edit.placeholderLabel=ghost;edit.placeholder=placeholder;
 edit.inputMode=multiline?EditBox.InputMode.ANY:EditBox.InputMode.SINGLE_LINE;edit.inputFlag=EditBox.InputFlag.DEFAULT;edit.maxLength=max;edit.string=value;
 // Node events carry the EditBox component; component event handlers use a
 // different signature. Read the string explicitly for both IME and typing.
 box.on(EditBox.EventType.TEXT_CHANGED,()=>changed(edit.string));
 box.active=true;
 return edit;
}

/** Native input remains mounted while typing; only progress/check labels refresh. */
export function homeworkView(w:Node,l:Level,p:Puzzle,changed:()=>void=()=>{}):boolean{
 if(l.kind==='highlight'){
  text(w,'在原文上做标记 · 再点一次取消',25,5,960,35,21,C.teal,true);
  const tokens=l.tokens||[],height=Math.min(76,310/Math.max(1,tokens.length));
  const count=text(w,`已标记 ${p.marked.length} 句`,30,360,950,30,18,C.muted).getComponent(Label);
  tokens.forEach((token,i)=>{
   let selected=p.marked.includes(i);
   const row=panel(w,28,49+i*(height+5),956,height,selected?'#FFE3A6':C.cream,12);
   const label=text(row,(selected?'▍ ':'')+token,16,3,924,height-6,token.length>45?20:23,C.ink).getComponent(Label);
   // Mark with an explicit glyph and color; keep text, layout and event targets stable.
   row.on(Node.EventType.TOUCH_END,(e:any)=>{e.propagationStopped=true;p.toggleMark(i);changed();selected=p.marked.includes(i);const g=row.getComponent(Graphics)!;g.clear();g.fillColor=color(selected?'#FFE3A6':C.cream);g.roundRect(0,-height,956,height,12);g.fill();label.string=(selected?'▍ ':'')+token;label.color=color(selected?'#B36D14':C.ink);count.string=`已标记 ${p.marked.length} 句`;});
  });return true;
 }
 if(l.kind==='cloze'){
  text(w,l.passage||'',28,12,955,150,26,C.ink,true);
  (l.fields||[]).forEach((field,i)=>{text(w,field.label,32,177+i*90,350,60,21,C.teal,true);input(w,p.fieldValues[i]||'','点这里填写',395,177+i*90,570,62,160,false,v=>{p.setField(i,v);changed();});});
  return true;
 }
 if(l.kind==='compose'&&l.writing){
  const task=l.writing;text(w,task.prompt,27,6,960,83,22,C.ink,true);
  const counter=text(w,'',32,296,530,28,17,C.muted).getComponent(Label);
  const checkLabels:Label[]=[],refresh=()=>{counter.string=`已写 ${Array.from(p.input.replace(/\s/g,'')).length} 字符 · 至少 ${task.minLength} 字符`;checkLabels.forEach((label,i)=>label.string=(p.writingChecks[i]?'✓ ':'○ ')+task.checks[i]);};
  input(w,p.input,'点这里写自己的内容',28,96,602,190,task.maxLength,true,value=>{p.setWriting(value);changed();refresh();});
  task.checks.forEach((check,i)=>{const b=button(w,'',653,100+i*66,329,56,()=>{p.toggleWritingCheck(i);changed();refresh();},C.cream,C.teal,17);const label=b.getComponentInChildren(Label)!;checkLabels.push(label);});
  const example=text(w,'',30,327,953,64,19,C.muted).getComponent(Label);
  button(w,'对照例子',655,296,150,35,()=>{example.string=example.string?'':`参考一种表达（答案不限）：${task.example}`;},C.blue,C.teal,16);
  text(w,'写完后逐条自查',810,296,175,35,16,C.muted);refresh();return true;
 }
 return false;
}
