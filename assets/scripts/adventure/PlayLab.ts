/** Original enrichment tasks. Grades 1–2 English are introductory, not textbook coverage. */
export interface LabTask {id:string;title:string;kind:'pairs'|'dialogue'|'poem';intro:string;pairs?:string[][];lines?:{say:string;answers:string[];correct:number;why:string}[];poem?:string[];words?:string[];answer?:string[];note:string;}
const vocabulary=[['cat|猫','dog|狗','bird|鸟'],['shirt|衬衫','hat|帽子','coat|外套'],['mother|妈妈','father|爸爸','family|家庭'],['kitchen|厨房','bedroom|卧室','study|书房'],['river|河流','bridge|桥','forest|森林'],['museum|博物馆','hospital|医院','library|图书馆']];
const dialogues=[
 [['Hello!','Hello!','Goodbye!'],['What is your name?','My name is Star.','It is a cat.']],
 [['Can you help me?','Yes, I can.','It is blue.'],['Thank you!','You are welcome.','I am seven.']],
 [['Nice to meet you!','Nice to meet you, too.','It is red.'],['Is this your mother?','Yes, she is.','I like apples.']],
 [['Where is the library?','It is next to the classroom.','I have a pencil.'],['Can I read here?','Yes, please.','It is sunny.']],
 [['What would you like?','I would like some water.','I can swim.'],['Anything to eat?','Some bread, please.','It is Monday.']],
 [['What are you going to do?','I am going to visit the museum.','I visited it yesterday.'],['How will you get there?','By bus.','Next Sunday.']]
];
const poems=[['咏鹅 · 骆宾王','鹅，鹅，鹅，曲项向____歌。','白毛浮____水，红掌拨清波。','天','绿','山'],['静夜思 · 李白','床前明月____，疑是地上霜。','举头望明____，低头思故乡。','光','月','花'],['望庐山瀑布 · 李白','日照香炉生紫____，遥看瀑布挂前川。','飞流直下三千____，疑是银河落九天。','烟','尺','雨'],['题西林壁 · 苏轼','横看成岭侧成____，远近高低各不同。','不识庐山真面目，只缘身在此____中。','峰','山','水'],['泊船瓜洲 · 王安石','京口瓜洲一水____，钟山只隔数重山。','春风又绿江南岸，明月何时照我____。','间','还','船'],['书湖阴先生壁 · 王安石','一水护田将____绕，','两山排闼送____来。','绿','青','红']];
const idioms=[['一心一意|专心做好一件事','七上八下|心里紧张不安','五颜六色|颜色丰富'],['守株待兔|只想等好运，不肯努力','亡羊补牢|发现问题及时补救','拔苗助长|急于求成反而坏事'],['画蛇添足|多做不必要的事反而坏事','掩耳盗铃|欺骗自己','刻舟求剑|情况变了还用老办法'],['胸有成竹|行动前有充分把握','持之以恒|长久坚持下去','半途而废|事情没完成就放弃'],['实事求是|根据实际情况作出判断','举一反三|从一件事推知同类道理','温故知新|复习旧知识获得新理解'],['见微知著|从细小迹象看出发展趋势','锲而不舍|遇到困难仍坚持','集思广益|集中大家的意见和智慧']];
export function labTasks(subject:string,grade:number):LabTask[]{const g=Math.max(1,Math.min(6,grade)),i=g-1,base=`lab.${subject}.g${g}`;
 if(subject==='english')return [{id:base+'.words',title:'单词快递站',kind:'pairs',intro:'把单词快递送到对应的中文站台。',pairs:vocabulary[i].map(s=>s.split('|')),note:`${g}年级英语词义拓展；原创配对任务。`},{id:base+'.talk',title:'小岛对话剧场',kind:'dialogue',intro:'你来扮演小向导，接住朋友的话。',lines:dialogues[i].map(([say,a,b])=>({say,answers:[a,b],correct:0,why:`朋友说“${say}”，这里用“${a}”回应。`})),note:'情境回应练习，不是语音识别或口语评分。'}];
 if(subject==='chinese'){const p=poems[i];return [{id:base+'.poem',title:'点亮诗词灯笼',kind:'poem',intro:p[0]+' · 依次补上两个空缺',poem:[p[1],p[2]],words:[p[3],p[4],p[5]],answer:[p[3],p[4]],note:'古典诗词选段复习，学段拓展；未声称逐课教材对应。'},{id:base+'.idiom',title:'成语故事渡船',kind:'pairs',intro:'为成语找到合适的情境，让小船靠岸。',pairs:idioms[i].map(s=>s.split('|')),note:`${g}年级词语理解拓展；情境释义为原创。`}];}return [];}
export const LAB_IDS=new Set(['english','chinese'].flatMap(s=>Array.from({length:6},(_,i)=>labTasks(s,i+1)).flat().map(t=>t.id)));
export interface Gift {id:string;name:string;cost:number;symbol:string;color:string;art?:string;description?:string;}
export const GIFTS:Gift[]=[{id:'sprout',name:'新芽探险家',cost:200,symbol:'♧',color:'#BCE5C6'},{id:'moon',name:'月光守护者',cost:600,symbol:'☾',color:'#DCD4F2'},{id:'sun',name:'晨光领航员',cost:1200,symbol:'☀',color:'#FFE0A0'},
 {id:'star-lantern',name:'晚安星灯',cost:100,symbol:'✦',color:'#E0F2E9',art:'gifts/star-lantern',description:'把一颗温暖的小星星，放在花园入口。'},
 {id:'moon-telescope',name:'月光望远镜',cost:500,symbol:'☾',color:'#E9E1F6',art:'gifts/moon-telescope',description:'为星宝布置一个仰望月亮的角落。'},
 {id:'cloud-airship',name:'云朵飞艇',cost:1200,symbol:'☁',color:'#E0EFF5',art:'gifts/cloud-airship',description:'把下一次远航的梦想，停在自己的花园。'}];
export const DECOR_GIFTS=GIFTS.filter(g=>!!g.art);
