import type {Chapter,Level} from './Catalog';
type Pair=[string,string];
interface Pack {title:string;theme:string;words:Pair[];lines:Pair[];}
const pairs=(s:string):Pair[]=>s.split(';').map(s=>s.split('|') as Pair);
const p=(title:string,theme:string,words:string,lines:string):Pack=>({title,theme,words:pairs(words),lines:pairs(lines)});
const packs:Pack[][]=[
[
 p('第一声问候','启蒙 · 问候','hello|你好;bye|再见;thanks|谢谢','Hello Star|你好，星宝;Good morning|早上好;Thank you|谢谢你;Goodbye Star|再见，星宝'),
 p('彩色风车','启蒙 · 颜色','red|红色;blue|蓝色;green|绿色','It is red|它是红色的;It is blue|它是蓝色的;I like green|我喜欢绿色;The bag is red|包是红色的'),
 p('数字星星','启蒙 · 数字1—3','one|一;two|二;three|三','One red ball|一个红球;Two blue bags|两个蓝包;I have three books|我有三本书;I have one pen|我有一支钢笔'),
 p('动物来做客','启蒙 · 动物','cat|猫;dog|狗;bird|鸟','It is a cat|它是一只猫;It is a dog|它是一只狗;I like birds|我喜欢鸟;The cat is small|猫很小'),
 p('我的家人','启蒙 · 家庭','mother|妈妈;father|爸爸;sister|姐妹','This is my mother|这是我的妈妈;This is my father|这是我的爸爸;I love my family|我爱我的家人;This is my sister|这是我的姐妹'),
 p('书包小屋','启蒙 · 学习用品','book|书;pen|钢笔;bag|包','This is my bag|这是我的包;I have a pen|我有一支钢笔;The book is blue|书是蓝色的;I have a red bag|我有一个红包'),
 p('水果快递','启蒙 · 水果','apple|苹果;banana|香蕉;orange|橙子','I like apples|我喜欢苹果;I like bananas|我喜欢香蕉;The apple is red|苹果是红色的;I have an orange|我有一个橙子'),
 p('玩具小车站','启蒙 · 玩具','ball|球;car|汽车;kite|风筝','I have a ball|我有一个球;I have a car|我有一辆汽车;The kite is blue|风筝是蓝色的;It is a red car|它是一辆红色汽车'),
 p('身体小歌谣','启蒙 · 身体','hand|手;eye|眼睛;ear|耳朵','My hands are small|我的手很小;I have two eyes|我有两只眼睛;I have two ears|我有两只耳朵;This is my hand|这是我的手'),
 p('点心小餐桌','启蒙 · 食物','milk|牛奶;bread|面包;egg|鸡蛋','I like milk|我喜欢牛奶;I like bread|我喜欢面包;I have an egg|我有一个鸡蛋;The milk is white|牛奶是白色的'),
 p('心情小云朵','启蒙 · 感受','happy|开心;sad|难过;fine|很好','I am happy|我很开心;I am fine|我很好;The boy is sad|男孩很难过;My friend is happy|我的朋友很开心'),
 p('友好小伙伴','启蒙 · 礼貌','please|请;sorry|对不起;welcome|欢迎','Yes please|好的，请给我;I am sorry|对不起;You are welcome|不用谢;Here you are|给你')
],
[
 p('新朋友信箱','启蒙进阶 · 自我介绍','name|名字;friend|朋友;boy|男孩','My name is Star|我的名字是星宝;This is my friend|这是我的朋友;I am a boy|我是一个男孩;My friend is kind|我的朋友很友善'),
 p('更多彩虹色','启蒙进阶 · 颜色','yellow|黄色;white|白色;black|黑色','The sun is yellow|太阳是黄色的;My cat is black|我的猫是黑色的;The milk is white|牛奶是白色的;I like yellow flowers|我喜欢黄色的花'),
 p('数字小货仓','启蒙进阶 · 数字4—6','four|四;five|五;six|六','I have four books|我有四本书;I have five pens|我有五支钢笔;Six birds are here|六只鸟在这里;There are four bags|有四个包'),
 p('衣服小裁缝','启蒙进阶 · 衣物','shirt|衬衫;hat|帽子;coat|外套','My shirt is blue|我的衬衫是蓝色的;I have a red hat|我有一顶红帽子;The coat is green|外套是绿色的;This is my shirt|这是我的衬衫'),
 p('天气小窗','启蒙进阶 · 天气','sunny|晴朗的;rainy|下雨的;windy|有风的','It is sunny|天气晴朗;It is rainy|天在下雨;It is windy today|今天有风;I like sunny days|我喜欢晴天'),
 p('房间寻宝','启蒙进阶 · 房间','bed|床;chair|椅子;table|桌子','This is my bed|这是我的床;The chair is small|椅子很小;The book is on the table|书在桌子上;My bag is on the chair|我的包在椅子上'),
 p('花园观察员','启蒙进阶 · 自然','tree|树;flower|花;leaf|叶子','The tree is tall|树很高;The flower is red|花是红色的;The leaf is green|叶子是绿色的;I like this tree|我喜欢这棵树'),
 p('动作小舞台','启蒙进阶 · 动作','run|跑;swim|游泳;jump|跳','I can run|我会跑;I can jump|我会跳;My friend can swim|我的朋友会游泳;The dog can run|狗会跑'),
 p('寻找小路标','启蒙进阶 · 位置','in|在里面;on|在上面;under|在下面','The ball is in the box|球在盒子里;The bag is on the desk|包在书桌上;The cat is under the bed|猫在床下;The book is in the bag|书在包里'),
 p('我的一天','启蒙进阶 · 日常','read|阅读;eat|吃;sleep|睡觉','I read books|我读书;I eat an apple|我吃一个苹果;The baby can sleep|宝宝会睡觉;I read at home|我在家读书'),
 p('友好邀请','启蒙进阶 · 合作','help|帮助;share|分享;play|玩','Let us play|我们一起玩吧;I can help you|我可以帮助你;Let us share|我们分享吧;My friends help me|我的朋友们帮助我'),
 p('大小观察屋','启蒙进阶 · 描述','big|大的;small|小的;tall|高的','The dog is big|狗很大;The cat is small|猫很小;The tree is tall|树很高;My bag is small|我的包很小')
],
[
 p('朋友初见','Making friends','hello|你好;friend|朋友;name|名字','Hello I am Star|你好，我是星宝;Nice to meet you|很高兴见到你;I can help my friend|我能帮助我的朋友;My friends are kind|我的朋友们很友善'),
 p('家庭明信片','Different families','mother|妈妈;father|爸爸;family|家庭','This is my family photo|这是我的家庭照片;My mother likes reading|我的妈妈喜欢阅读;My father can cook|我的爸爸会做饭;We help each other|我们互相帮助'),
 p('动物救援站','Amazing animals','dog|狗;cat|猫;bird|鸟','I have a little dog|我有一只小狗;The cat is my friend|猫是我的朋友;Birds can fly|鸟会飞;My dog likes to run|我的狗喜欢跑'),
 p('植物小花园','Plants around us','tree|树;flower|花;seed|种子','This is a green tree|这是一棵绿树;I can water the flowers|我会给花浇水;The seed needs water|种子需要水;The flowers are yellow|花是黄色的'),
 p('彩虹调色屋','The colourful world','red|红色;blue|蓝色;green|绿色','I like red flowers|我喜欢红花;The sky is blue|天空是蓝色的;The grass is green|草是绿色的;My bag has many colours|我的包有许多颜色'),
 p('有用的数字','Useful numbers','one|一;two|二;three|三','I have two pencils|我有两支铅笔;I can see three birds|我能看见三只鸟;We need one more chair|我们还需要一把椅子;There are two red bags|有两个红包'),
 p('认识新伙伴','Meeting new people','teacher|老师;student|学生;school|学校','I am a new student|我是一个新学生;This is our teacher|这是我们的老师;My new friend is nice|我的新朋友很好;We go to the same school|我们上同一所学校'),
 p('友善行动队','Expressing yourself','please|请;thanks|谢谢;sorry|对不起','Please help me|请帮助我;Thank you for your help|谢谢你的帮助;I am sorry for that|我为那件事感到抱歉;We share our books|我们分享我们的书'),
 p('感官工具屋','Learning better','eyes|眼睛;ears|耳朵;hands|手','I see with my eyes|我用眼睛看;I hear with my ears|我用耳朵听;I draw with a pencil|我用铅笔画画;We learn with our hands|我们用双手学习'),
 p('健康小餐桌','Healthy food','fruit|水果;milk|牛奶;bread|面包','I like fruit and milk|我喜欢水果和牛奶;I eat an egg for breakfast|我早餐吃一个鸡蛋;The apples are fresh|苹果很新鲜;We need water every day|我们每天需要水'),
 p('旧物新朋友','Old toys','old|旧的;new|新的;toy|玩具','This is my old toy|这是我的旧玩具;I have a new book|我有一本新书;We can use old boxes|我们可以利用旧盒子;I give my old toys to friends|我把旧玩具送给朋友'),
 p('生活数字站','Numbers in life','ten|十;five|五;six|六','I have five old books|我有五本旧书;We need six apples|我们需要六个苹果;My number is ten|我的号码是十;There are ten flowers|有十朵花')
],
[
 p('家庭帮手站','Helping at home','clean|清洁;wash|清洗;help|帮助','I can clean the room|我会打扫房间;I help my mother at home|我在家帮助妈妈;We wash our hands before dinner|我们饭前洗手;My brother can wash the dishes|我的兄弟会洗碗'),
 p('朋友小档案','My friends','kind|友善的;quiet|安静的;friendly|友好的','My friend is kind|我的朋友很友善;She has long hair|她留着长发;My friend helps me with reading|我的朋友帮助我阅读;He is quiet but friendly|他安静但友好'),
 p('居住小镇','Places we live in','house|房子;city|城市;village|村庄','I live in a small village|我住在一个小村庄;My house is near the river|我的房子在河边;Our city has many parks|我们的城市有许多公园;There is a library near my home|我家附近有一座图书馆'),
 p('社区服务队','Helping in the community','park|公园;street|街道;neighbour|邻居','We can clean the park|我们可以清洁公园;I help my neighbour carry bags|我帮邻居提包;The street is clean now|街道现在很干净;We plant trees in our community|我们在社区里种树'),
 p('天气观察站','The weather and us','sunny|晴朗的;rainy|下雨的;snowy|下雪的','It is rainy today|今天下雨;Please take your umbrella|请带上你的雨伞;We wear warm coats on snowy days|下雪天我们穿保暖外套;I can fly a kite on windy days|有风时我可以放风筝'),
 p('四季准备屋','Changing for the seasons','spring|春天;summer|夏天;winter|冬天','It is warm in spring|春天很暖和;I wear a hat in summer|我夏天戴帽子;We need coats in winter|冬天我们需要外套;The leaves change colour in autumn|秋天树叶变色'),
 p('班级规则岛','Class rules','listen|听;quiet|安静的;rule|规则','Please listen to the teacher|请听老师讲课;We take turns in class|我们在课堂上轮流行动;We keep our classroom clean|我们保持教室整洁;Please raise your hand first|请先举手'),
 p('家庭约定屋','Family rules','home|家;bedtime|就寝时间;dinner|晚餐','I do my homework before dinner|我晚饭前做作业;We put our toys away|我们把玩具收好;We go to bed on time|我们按时睡觉;I help set the table at home|我在家帮忙摆餐具'),
 p('上学时光站','Time for school','morning|早晨;breakfast|早餐;school|学校','I get up at seven|我七点起床;I have breakfast at home|我在家吃早餐;We go to school in the morning|我们早上去上学;It is time for English class|该上英语课了'),
 p('购物小集市','Going shopping','shirt|衬衫;price|价格;buy|购买','I would like a blue shirt|我想要一件蓝衬衫;How much is this hat|这顶帽子多少钱;The red bag is twenty yuan|红包是二十元;I buy some fruit for my family|我为家人买一些水果'),
 p('农场好朋友','Farms and us','cow|奶牛;sheep|绵羊;farm|农场','There are cows on the farm|农场里有奶牛;The sheep are eating grass|绵羊正在吃草;The farmer grows vegetables|农民种蔬菜;We can help on the farm|我们可以在农场帮忙'),
 p('从农场到餐桌','From farm to table','rice|米饭;vegetables|蔬菜;food|食物','Rice comes from the farm|稻米来自农场;We wash vegetables before cooking|我们做饭前洗蔬菜;The farmer works hard for our food|农民为我们的食物辛勤劳动;We should not waste food|我们不应该浪费食物')
],
[
 p('不同的朋友','Different friends','hobby|爱好;different|不同的;friend|朋友','My friend likes reading|我的朋友喜欢阅读;We have different hobbies|我们有不同的爱好;We can learn from each other|我们可以互相学习;My friend enjoys drawing pictures|我的朋友喜欢画画'),
 p('心情邮局','My feelings','excited|兴奋的;worried|担忧的;angry|生气的','I feel happy today|我今天感到高兴;My friend is worried|我的朋友很担心;Talking to a friend can help|和朋友聊聊会有帮助;I feel excited about the trip|我对旅行感到兴奋'),
 p('工作与游戏','Work and play','work|工作;play|玩耍;rest|休息','I finish my work before playing|我玩耍前完成工作;We need time to rest|我们需要休息的时间;My sister plays football after school|我姐姐放学后踢足球;I help at home on weekends|我周末在家帮忙'),
 p('健康好习惯','Healthy habits','habit|习惯;exercise|锻炼;healthy|健康的','I exercise every morning|我每天早上锻炼;We wash our hands before eating|我们吃饭前洗手;Getting enough sleep is important|充足睡眠很重要;I brush my teeth every day|我每天刷牙'),
 p('食物探索队','Food we eat','vegetables|蔬菜;noodles|面条;fruit|水果','I eat vegetables every day|我每天吃蔬菜;My favourite food is noodles|我最喜欢的食物是面条;We need different kinds of food|我们需要不同种类的食物;I choose fresh fruit for a snack|我选新鲜水果当点心'),
 p('自然观察屋','Nature and us','nature|自然;river|河流;forest|森林','We should care for nature|我们应该爱护自然;There is a forest near the village|村庄附近有一片森林;Clean water is important to everyone|干净的水对每个人都很重要;We can plant more trees|我们可以种更多的树'),
 p('规则守护队','Following the rules','rule|规则;safe|安全的;quietly|安静地','We should follow the rules|我们应该遵守规则;Please wait for your turn|请等待轮到你;Rules help keep everyone safe|规则帮助保障每个人的安全;We speak quietly in the library|我们在图书馆轻声说话'),
 p('社区寻宝站','Our community','community|社区;library|图书馆;hospital|医院','There is a library near my home|我家附近有一座图书馆;We help people in our community|我们帮助社区里的人;The hospital is next to the park|医院在公园旁边;Our community has a small garden|我们的社区有一个小花园'),
 p('四季生活岛','Life in different seasons','spring|春天;autumn|秋天;season|季节','We plant trees in spring|我们在春天种树;I can go swimming in summer|我夏天可以去游泳;Autumn is a good time for a picnic|秋天适合野餐;We wear warm coats in winter|我们在冬天穿保暖外套'),
 p('家乡明信片','My hometown','hometown|家乡;river|河流;village|村庄','My hometown is near a river|我的家乡在河边;There are hills around my village|我的村庄周围有山丘;My hometown is famous for its tea|我的家乡以茶闻名;I love the food in my hometown|我喜欢家乡的食物'),
 p('环游小车站','Travelling around','train|火车;bus|公共汽车;travel|旅行','We can travel by train|我们可以乘火车旅行;I want to visit a new city|我想参观一座新的城市;The bus stops near the museum|公共汽车在博物馆附近停靠;We take photos when we travel|我们旅行时拍照'),
 p('旅行计划师','Making a travel plan','plan|计划;ticket|车票;trip|旅行','We are going to visit the museum|我们打算参观博物馆;Let us make a travel plan|我们制定一个旅行计划吧;We need to buy train tickets|我们需要买火车票;Our trip will start on Sunday|我们的旅行将在星期日开始')
],
[
 p('神奇地点','Amazing places','museum|博物馆;library|图书馆;place|地方','The museum is near the park|博物馆在公园附近;I would like to visit the library|我想参观图书馆;This place has a long history|这个地方历史悠久;We can learn a lot in museums|我们能在博物馆里学到很多'),
 p('相聚的计划','Getting together','invite|邀请;together|一起;party|聚会','We are going to have a party|我们打算办一场聚会;I will invite my friends|我会邀请我的朋友们;We can make a plan together|我们可以一起做计划;The party starts at three|聚会三点开始'),
 p('健康生活岛','Healthy life','exercise|锻炼;sleep|睡眠;health|健康','I try to get enough sleep|我尽量获得充足睡眠;We should exercise every day|我们应该每天锻炼;A healthy breakfast gives us energy|健康早餐给我们能量;I walk to school when I can|可以时我步行去上学'),
 p('零钱规划师','Managing money well','save|节省;money|钱;spend|花费','I save some money every week|我每周存一些钱;I think before I buy things|我买东西前先思考;We can make a spending plan|我们可以制定花钱计划;I need a book but want a toy|我需要书但想要玩具'),
 p('太空探索队','Exploring space','space|太空;planet|行星;moon|月亮','The moon goes around the earth|月亮绕地球转;I want to learn about space|我想了解太空;Our earth is a beautiful planet|我们的地球是一颗美丽的行星;We can watch the stars at night|我们可以在夜晚看星星'),
 p('能源守护者','Energy, nature and us','energy|能源;water|水;nature|自然','We should save water and energy|我们应该节约水和能源;Turn off lights when you leave|离开时关灯;Sunlight can help plants grow|阳光能帮助植物生长;We can protect nature together|我们可以一起保护自然'),
 p('成长对比屋','How tall are you?','taller|更高的;shorter|更矮的;longer|更长的','I am taller than before|我比以前更高了;My pencil is longer than yours|我的铅笔比你的更长;My brother is shorter than me|我的弟弟比我矮;This bag is heavier than that one|这个包比那个包更重'),
 p('周末回忆站','Last weekend','yesterday|昨天;weekend|周末;cleaned|打扫了','I cleaned my room yesterday|我昨天打扫了房间;We watched a film last weekend|我们上周末看了电影;I stayed at home on Sunday|我星期日待在家里;My friend visited me yesterday|我的朋友昨天来看我'),
 p('旅行明信片','Where did you go?','went|去了;trip|旅行;beach|海滩','I went to the beach last summer|我去年夏天去了海滩;We took photos on our trip|我们旅行时拍了照;I bought a gift for my friend|我给朋友买了一份礼物;My family went there by train|我的家人乘火车去了那里'),
 p('时光小相册','Then and now','before|以前;now|现在;changed|改变了','There was no library before|以前没有图书馆;Our school has changed a lot|我们的学校变化很大;I could not swim before|我以前不会游泳;Now I can ride a bike|现在我会骑自行车'),
 p('回忆线索营','Last weekend · 主题巩固','last night|昨晚;visited|拜访了;walked|步行了','I visited my grandparents on Saturday|我星期六看望了祖父母;We walked in the park yesterday|我们昨天在公园散步;My mother read a book last night|我妈妈昨晚读了一本书;I helped my friend with homework|我帮助朋友做了作业'),
 p('毕业新旅程','Then and now · 综合表达','learn|学习;grow|成长;future|未来','I learned many things at school|我在学校学到了很多东西;We will keep learning together|我们会继续一起学习;My friends helped me grow|我的朋友们帮助我成长;I want to try something new|我想尝试新的事物')
]
];
const upper=['','','1212001301245','1212001401255','1212001501255','1212001601265'];
const lower=['','','1212001302245','1212001402255','1212001502255','1212001602145'];
const stages=['warmup','warmup','practice','practice','challenge','challenge'] as const;
const evidenceRoles=['understand','model','fluency','diagnose','apply','transfer'] as const;
const palette:Record<string,string>={red:'#EA9188',blue:'#8FBCE4',green:'#8DC6A8',yellow:'#F3D57F',white:'#F5F4E9',black:'#5B6C73'};
export function englishCurriculum():Chapter[]{return packs.flatMap((units,g)=>units.map((unit,index)=>{
 const grade=g+1,id=`english.g${grade}.c${index+5}`,semester=index<6?'上册' as const:'下册' as const;
 const unitNumber=index<6?index+1:index-5,isGrade6Revision=grade===6&&index>=10;
 const textbookUnit=grade>=3&&!isGrade6Revision;
 const wordOptions=unit.words.map(w=>w[1]),colors=unit.words.every(w=>!!palette[w[0]])?unit.words.map(w=>palette[w[0]]):undefined;
 const levels:Level[]=Array.from({length:6},(_,i):Level=>{
  const base={id:`${id}.l${i+1}`,stage:stages[i],target:0,explanation:'',hint:'',goal:'',title:''};
  if(i<2){const word=unit.words[i];return {...base,kind:'listen',title:'听音送气球',goal:`听辨“${unit.theme}”主题词汇（第 ${i+1} 组），把对应气球送过去。`,target:i,voice:word[0],options:wordOptions,colors,hint:'点「再听一次」，听清后选择对应的气球。',explanation:`${word[0]} 表示「${word[1]}」。`,coachHints:['可以重复听，不用抢时间。',`${word[0]} 表示「${word[1]}」。`]};}
  const pair=unit.lines[i-2];
  if(i<4){const words=pair[0].split(' ');return {...base,kind:'sentence',title:'拼出口信',goal:'送给伙伴一张口信：'+pair[1],words,answer:words,voice:pair[0],hint:'按顺序点词卡放进信封；点已选词卡可以取回。',explanation:`${pair[0]}：${pair[1]}。`,coachHints:['先找一句话里的主语或开头词。','口信开头是 '+words.slice(0,2).join(' ')+'。']};}
  const others=[unit.lines[0][1],unit.lines[i===4?1:2][1]];
  return {...base,kind:'choice',title:grade<3?'口信小侦探':'阅读线索',goal:`阅读“${unit.theme}”主题口信（第 ${i-3} 封），找到正确意思。`,passage:pair[0],voice:pair[0],options:[pair[1],...others],hint:'先读口信，也可以点「听任务」。再比较三张线索卡。',explanation:`${pair[0]}：${pair[1]}。`,coachHints:['找出句子里熟悉的人物、动作或时间词。',pair[1]+'。']};
 }).map((level,i)=>({...level,evidence:{knowledgeId:`pep-english-g${grade}-${semester}-u${unitNumber}`,objective:`在“${unit.theme}”情境中完成${level.title}，并能解释所用词句。`,role:evidenceRoles[i],prerequisites:grade<=2?['听辨常见课堂指令','借助图片理解基本词义']:['理解本单元核心词汇','读懂简短情境提示'],misconceptions:i<2?['只凭选项位置猜测，未听清关键词']:i<4?['忽略英语基本语序，按中文顺序逐词拼接']:['只认单个词，未结合整句语境判断'],reviewed:false}}));
 return {id,subject:'english' as const,grade,title:unit.title,topic:unit.theme,art:'journey-garden',alignment:textbookUnit?'verified-theme' as const:'enrichment' as const,curriculum:{semester,theme:unit.theme,order:index,source:textbookUnit?`https://book.pep.com.cn/${(index<6?upper:lower)[g]}/`:'',verified:textbookUnit,publisher:'人民教育出版社',edition:grade<3?'英语启蒙衔接原创样例':isGrade6Revision?'六年级下册总复习拓展':'依据项目当前PEP主题目录',volume:`${grade}年级${semester}`,unit:textbookUnit?`Unit ${unitNumber} ${unit.theme}`:isGrade6Revision?`总复习 · ${unit.theme}`:`启蒙主题 ${unit.theme}`,unitNumber:textbookUnit?unitNumber:undefined,unitType:textbookUnit?'textbook':isGrade6Revision?'revision':'theme',objectives:[`听懂并认读“${unit.theme}”主题核心词汇`,`在情境中理解并按正确语序表达目标句`,`通过简短阅读或听力获取信息并完成主题任务`],reviewStatus:'draft'},levels};
}));}
