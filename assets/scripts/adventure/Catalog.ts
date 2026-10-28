import {otherCurriculum} from './OtherCurriculum';
import {chineseCurriculum} from './ChineseCurriculum';
import {englishCurriculum} from './EnglishCurriculum';
/** Original tasks mapped to PEP learning themes; chapter numbers are GAME order, not textbook unit numbers. */
import {curriculumChapters} from './MathCurriculum';
import {Subject} from './Subjects';
import {starterChapters} from './StarterContent';
import {challengeChapters} from './ChallengeContent';
import {expansionChapters} from './ExpansionContent';
export type {Subject} from './Subjects';
export type Mechanic='cargo'|'groups'|'tiles'|'sentence'|'listen'|'choice'|'number';
export interface MathVisual {kind:'clock'|'ruler'|'bars'|'shape'|'grid'|'numberline'; values:number[]; labels?:string[];}
export interface Level {id:string; kind:Mechanic; title:string; goal:string; hint:string; explanation:string; target:number; passage?:string; visual?:MathVisual; answerUnit?:string; stage?:'warmup'|'practice'|'challenge'; coachHints?:string[]; maxBlocks?:number; units?:number[]; scale?:number; groups?:number; cells?:number; cols?:number; words?:string[]; answer?:string[]; voice?:string; options?:string[]; colors?:string[];}
export interface Chapter {id:string; subject:Subject; grade:number; title:string; topic:string; art:string; levels:Level[]; curriculum?:{semester:'上册'|'下册';theme:string;order:number;source:string;verified:boolean}; alignment:'theme'|'verified-theme'|'enrichment';}
export const CATALOG:Chapter[]=[];
function chapter(subject:Subject,grade:number,title:string,topic:string,levels:Omit<Level,'id'>[],alignment:Chapter['alignment']='theme'){
 const index=CATALOG.filter(c=>c.subject===subject&&c.grade===grade).length;
 const id=`${subject}.g${grade}.c${index+1}`;
 CATALOG.push({id,subject,grade,title,topic,art:subject==='english'?'english':index%2?'garden':'island',alignment,levels:levels.map((l,i)=>({...l,id:`${id}.l${i+1}`}))});
}
const cargo=(goal:string,target:number,units:number[],explanation:string,scale=1):Omit<Level,'id'>=>({kind:'cargo',title:'星光运输站',goal,target,units,scale,hint:'点能量块装船；点船上的块可以取回。',explanation});
const group=(goal:string,groups:number,target:number,explanation:string):Omit<Level,'id'>=>({kind:'groups',title:'星星种植园',goal,groups,target,hint:'点花盆种一颗；点「－」取回一颗。每盆一样多。',explanation});
const tile=(goal:string,cells:number,target:number,cols:number,explanation:string):Omit<Level,'id'>=>({kind:'tiles',title:'魔法拼花园',goal,cells,target,cols,hint:'点一格铺上花砖，再点一次可以取回。',explanation});
chapter('math',1,'数星星的小岛','10以内数的认识',[
 cargo('给飞船装上 5 颗星光',5,[1],'一颗一颗数：1、2、3、4、5。'),cargo('给飞船装上 8 颗星光',8,[1],'8 比 5 多 3。'),cargo('给飞船装上 10 颗星光',10,[1,5],'两份 5 合起来就是 10。')]);
chapter('math',1,'合起来的魔法','10以内加减法',[
 cargo('有 3 颗，又找到 2 颗。把一共的星光装船。',5,[1],'3 + 2 = 5'),cargo('有 8 颗，用去 3 颗。把剩下的星光装船。',5,[1],'8 − 3 = 5'),cargo('有 4 颗，又找到 5 颗。一共有多少？',9,[1,5],'4 + 5 = 9')]);
chapter('math',1,'十位灯塔','20以内进位加法',[
 cargo('灯塔需要 8 + 5 颗星光',13,[1,10],'8 + 5 = 13；先凑成 10。'),cargo('灯塔需要 9 + 7 颗星光',16,[1,10],'9 + 7 = 16'),cargo('灯塔需要 6 + 8 颗星光',14,[1,10],'6 + 8 = 14')]);
chapter('math',1,'百以内邮船','100以内数与加减法',[
 cargo('装上 3 个十和 4 个一',34,[1,10],'3 个十和 4 个一组成 34。'),cargo('装上 20 + 16 颗星光',36,[1,10],'20 + 16 = 36'),cargo('装上 48 − 20 颗星光',28,[1,10],'48 − 20 = 28')]);
chapter('math',2,'晨光运输队','100以内加减法',[
 cargo('小桥需要 27 + 15 颗星光',42,[1,10],'27 + 15 = 42；12 个一可以换成 1 个十和 2 个一。'),cargo('仓库有 43 颗，送走 18 颗。装上剩下的。',25,[1,10],'43 − 18 = 25'),cargo('点亮灯塔，需要 36 + 27 颗星光',63,[1,10],'36 + 27 = 63')]);
chapter('math',2,'乘法花园','表内乘法',[
 group('3 个花盆，每盆种 2 颗星星',3,2,'3 × 2 = 6'),group('4 个花盆，每盆种 3 颗星星',4,3,'4 × 3 = 12'),group('5 个花盆，每盆种 4 颗星星',5,4,'5 × 4 = 20')]);
chapter('math',2,'分享果园','表内除法',[
 group('把 12 颗星星平均分给 3 个花盆',3,4,'12 ÷ 3 = 4'),group('把 20 颗星星平均分给 4 个花盆',4,5,'20 ÷ 4 = 5'),group('把 18 颗星星平均分给 6 个花盆',6,3,'18 ÷ 6 = 3')]);
chapter('math',2,'千位补给站','万以内数的认识',[
 cargo('装上 2 个百、3 个十和 5 个一',235,[1,10,100],'235 = 200 + 30 + 5'),cargo('装上 4 个百和 6 个一',406,[1,10,100],'406 的十位是 0。'),cargo('装上 3 个千、2 个百和 4 个十',3240,[10,100,1000],'3240 = 3000 + 200 + 40')]);
chapter('math',3,'百位港口','万以内加减法',[
 cargo('两艘船有 236 和 125 颗星光，合起来装船',361,[1,10,100],'236 + 125 = 361'),cargo('有 502 颗，送出 178 颗，把剩下的装船',324,[1,10,100],'502 − 178 = 324'),cargo('运来 347 + 256 颗星光',603,[1,10,100],'347 + 256 = 603')]);
chapter('math',3,'成倍的能量','多位数乘一位数',[
 cargo('每箱 12 颗，运来 3 箱，装上全部星光',36,[1,10],'12 × 3 = 36'),cargo('每箱 23 颗，运来 4 箱',92,[1,10],'23 × 4 = 92'),cargo('每箱 105 颗，运来 3 箱',315,[1,10,100],'105 × 3 = 315')]);
chapter('math',3,'方格花田','长方形和正方形的面积',[
 tile('花田长 4 米、宽 3 米，铺满花砖（每格 1 平方米）',12,12,4,'4 × 3 = 12 平方米'),tile('花田边长 4 米，铺满花砖（每格 1 平方米）',16,16,4,'4 × 4 = 16 平方米'),tile('花田长 5 米、宽 3 米，铺满花砖（每格 1 平方米）',15,15,5,'5 × 3 = 15 平方米')]);
chapter('math',3,'分数花瓣','分数的初步认识',[
 tile('把花田的 1/2 铺上金色花砖',8,4,4,'8 格的一半是 4 格，表示 1/2。'),tile('把花田的 1/3 铺上金色花砖',9,3,3,'9 格分成相等的 3 份，每份 3 格。'),tile('把花田的 3/4 铺上金色花砖',8,6,4,'8 格平均分成 4 份，取其中 3 份，共 6 格。')]);
chapter('math',4,'万位星港','大数的认识',[
 cargo('装上 3 个万、2 个千、4 个百',32400,[100,1000,10000],'32400 = 30000 + 2000 + 400'),cargo('装上 5 个万和 6 个百',50600,[100,1000,10000],'50600 中间的千位是 0。'),cargo('装上 8 个万、3 个千和 2 个百',83200,[100,1000,10000],'83200 = 80000 + 3000 + 200')]);
chapter('math',4,'远航补给','三位数乘两位数',[
 cargo('每箱 120 颗，运来 12 箱',1440,[10,100,1000],'120 × 12 = 1440'),cargo('每箱 210 颗，运来 13 箱',2730,[10,100,1000],'210 × 13 = 2730'),cargo('每箱 150 颗，运来 24 箱',3600,[10,100,1000],'150 × 24 = 3600')]);
chapter('math',4,'小数商店','小数的意义和加减法',[
 cargo('为 1.2 + 0.5 元的种子付钱',17,[1,10],'1.2 + 0.5 = 1.7 元',10),cargo('有 3.5 元，用掉 1.2 元，把余额装进钱袋',23,[1,10],'3.5 − 1.2 = 2.3 元',10),cargo('为 2.4 + 1.8 元的种子付钱',42,[1,10],'2.4 + 1.8 = 4.2 元',10)]);
chapter('math',4,'运算能源站','四则运算与运算顺序',[
 cargo('装上 (12 + 8) × 3 颗能源',60,[1,10],'先算括号：20 × 3 = 60'),cargo('装上 60 − 24 ÷ 3 颗能源',52,[1,10],'先除后减：60 − 8 = 52'),cargo('装上 6 × (9 + 7) 颗能源',96,[1,10],'先算括号：6 × 16 = 96')]);
chapter('math',5,'小数工坊','小数乘除法',[
 cargo('3 袋种子，每袋 1.2 元，付钱吧',36,[1,10],'1.2 × 3 = 3.6 元',10),cargo('4.8 元买 4 袋种子，付出一袋的钱',12,[1,10],'4.8 ÷ 4 = 1.2 元',10),cargo('5 袋种子，每袋 2.5 元',125,[1,10,100],'2.5 × 5 = 12.5 元',10)]);
chapter('math',5,'等值花田','分数的意义与性质',[
 tile('铺出花田的 2/3',12,8,4,'2/3 = 8/12'),tile('铺出花田的 3/5',15,9,5,'3/5 = 9/15'),tile('铺出花田的 4/6',12,8,4,'4/6 = 2/3 = 8/12')]);
chapter('math',5,'分数合花','分数加减法',[
 tile('金色花占 1/4 + 1/2，请铺出它们占的部分',8,6,4,'1/4 + 1/2 = 3/4'),tile('金色花占 5/6 − 1/3，请铺出剩下的部分',12,6,4,'5/6 − 1/3 = 1/2'),tile('金色花占 1/3 + 1/4，请铺出它们占的部分',12,7,4,'1/3 + 1/4 = 7/12')]);
chapter('math',5,'立体仓库','长方体和正方体的体积',[
 cargo('仓库长 3、宽 2、高 4 米，装入对应体积的能量',24,[1,10],'3 × 2 × 4 = 24 立方米'),cargo('正方体仓库棱长 3 米，装入对应体积的能量',27,[1,10],'3 × 3 × 3 = 27 立方米'),cargo('仓库长 5、宽 3、高 2 米，装入对应体积的能量',30,[1,10],'5 × 3 × 2 = 30 立方米')]);
chapter('math',6,'分数采集队','分数乘除法',[
 tile('采集整片花田的 3/4 的 2/3，点出要采集的格子',12,6,4,'3/4 × 2/3 = 1/2'),cargo('12 颗星星的 2/3 有多少？装船吧',8,[1],'12 × 2/3 = 8'),cargo('一批星光的 3/4 是 12 颗，装上这一整批',16,[1,10],'12 ÷ 3/4 = 16')]);
chapter('math',6,'比例调色坊','比的认识与应用',[
 tile('金色与绿色花砖的比为 1:2，铺出金色部分',12,4,4,'总共 3 份，金色占 1/3。'),tile('金色与绿色花砖的比为 3:2，铺出金色部分',15,9,5,'金色占总数的 3/5。'),tile('金色与绿色花砖的比为 2:3，铺出金色部分',20,8,5,'金色占总数的 2/5。')]);
chapter('math',6,'百分数花海','百分数',[
 tile('让 25% 的花田开出金色花',20,5,5,'25% = 1/4；20 × 25% = 5'),tile('让 60% 的花田开出金色花',20,12,5,'60% = 3/5；20 × 60% = 12'),tile('让 75% 的花田开出金色花',16,12,4,'75% = 3/4；16 × 75% = 12')]);
chapter('math',6,'比例远航','正比例情境',[
 cargo('飞船 2 小时走 60 千米，同样速度 3 小时走多少？',90,[1,10],'60 ÷ 2 × 3 = 90 千米'),cargo('3 包种子 12 元，同样价格 5 包要多少元？',20,[1,10],'12 ÷ 3 × 5 = 20 元'),cargo('地图 1 厘米表示 5 千米，7 厘米表示多少千米？',35,[1,10],'7 × 5 = 35 千米')]);
const sentence=(goal:string,line:string,explanation:string):Omit<Level,'id'>=>({kind:'sentence',title:'会说话的邮局',goal,target:0,answer:line.split(' '),words:line.split(' '),voice:line,explanation,hint:'按顺序点词卡，拼好给朋友的口信；点已选的卡可撤回。'});
const listen=(word:string,options:string[],colors?:string[]):Omit<Level,'id'>=>({kind:'listen',title:'听音送气球',goal:'听一听，把朋友想要的气球送过去',target:options.indexOf(word),voice:word,options,colors,explanation:`刚刚听到的是 ${word}。`,hint:'点「再听一次」，然后点对应的气球。'});
for(let grade=1;grade<=2;grade++){
 chapter('english',grade,'彩虹初见','启蒙 · 颜色听辨',['red','blue','green'].map(w=>listen(w,['red','blue','green'],['#EA8A85','#85BDE9','#8FC7A1'])),'enrichment');
 chapter('english',grade,'数字气球','启蒙 · 数字听辨',['one','two','three'].map(w=>listen(w,['one','two','three'])),'enrichment');
 chapter('english',grade,'友好问候','启蒙 · 简短问候',[
 sentence('向新朋友说你好','Hello friend','你好，朋友。'),sentence('向新朋友说早上好','Good morning','早上好。'),sentence('向朋友说谢谢','Thank you','谢谢你。')],'enrichment');
}
chapter('english',3,'朋友见面会','Making friends',[
 sentence('告诉新朋友你的名字是 Star','My name is Star','我的名字叫 Star。'),sentence('表达见到朋友很开心','Nice to meet you','很高兴认识你。'),sentence('向朋友道谢','Thank you','谢谢你。')],'verified-theme');
chapter('english',3,'家庭明信片','Different families',[
 sentence('介绍你的妈妈','This is my mother','这是我的妈妈。'),sentence('介绍你的爸爸','This is my father','这是我的爸爸。'),sentence('表达你爱家人','I love my family','我爱我的家人。')],'verified-theme');
chapter('english',3,'动物好朋友','Our animal friends',[
 sentence('介绍你有一只猫','I have a cat','我有一只猫。'),sentence('邀请朋友看那只狗','Look at the dog','看那只狗。'),sentence('告诉朋友你喜欢鸟','I like birds','我喜欢鸟。')],'verified-theme');
chapter('english',4,'教室寻宝','学校与教室',[
 sentence('介绍你的教室','This is my classroom','这是我的教室。'),sentence('告诉伙伴打开门','Open the door','打开门。'),sentence('告诉伙伴擦窗户','Clean the window','擦窗户。')]);
chapter('english',4,'书包邮局','学习用品',[
 sentence('告诉朋友你有一本书','I have a book','我有一本书。'),sentence('介绍你的书包是蓝色的','My bag is blue','我的书包是蓝色的。'),sentence('问朋友铅笔在哪里','Where is my pencil','我的铅笔在哪里？')]);
chapter('english',4,'朋友小镇','人物描述',[
 sentence('介绍你的朋友','This is my friend','这是我的朋友。'),sentence('告诉朋友他很高','He is tall','他很高。'),sentence('告诉朋友她很友好','She is friendly','她很友好。')]);
chapter('english',5,'星期日记','日常生活',[
 sentence('告诉伙伴你喜欢星期一','I like Mondays','我喜欢星期一。'),sentence('告诉朋友你读书','I read books','我读书。'),sentence('告诉朋友你踢足球','I play football','我踢足球。')]);
chapter('english',5,'才艺舞台','能力表达',[
 sentence('告诉朋友你会游泳','I can swim','我会游泳。'),sentence('问伙伴能做什么','What can you do','你会做什么？'),sentence('告诉伙伴你会唱英文歌','I can sing English songs','我会唱英文歌。')]);
chapter('english',5,'森林向导','位置与场景',[
 sentence('告诉伙伴那里有一条河','There is a river','那里有一条河。'),sentence('告诉伙伴那里有一些树','There are some trees','那里有一些树。'),sentence('告诉伙伴书在桌上','The book is on the desk','书在桌子上。')]);
chapter('english',6,'城市远航','问路与交通',[
 sentence('问伙伴博物馆在哪','Where is the museum','博物馆在哪里？'),sentence('告诉朋友向左转','Turn left','向左转。'),sentence('告诉朋友你乘公交上学','I go to school by bus','我乘公交车上学。')]);
chapter('english',6,'明日计划','计划表达',[
 sentence('告诉伙伴你打算读书','I am going to read','我打算读书。'),sentence('询问伙伴打算做什么','What are you going to do','你打算做什么？'),sentence('告诉伙伴你打算游泳','I am going to swim','我打算游泳。')]);
chapter('english',6,'时光信箱','过去的经历',[
 sentence('告诉朋友你昨天踢足球了','I played football yesterday','我昨天踢足球了。'),sentence('告诉朋友你昨晚看电视了','I watched TV last night','我昨晚看电视了。'),sentence('告诉朋友你上周末去游泳了','I went swimming last weekend','我上周末去游泳了。')]);
CATALOG.push(...starterChapters(),...expansionChapters(),...challengeChapters(),...curriculumChapters(),...englishCurriculum(),...chineseCurriculum(),...otherCurriculum());
export const ALL_LEVELS=CATALOG.flatMap(c=>c.levels);
export function chapters(subject:Subject,grade:number){return CATALOG.filter(c=>c.subject===subject&&c.grade===grade);}
