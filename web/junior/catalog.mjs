import {practiceUnits} from './practice.mjs';
import {expansionUnits} from './expansion.mjs';
// Original course-standard theme samples. Not a claim of textbook coverage.
export const curriculumSource='https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html';
export const subjects=[
 ['math','数学','推理与建模','数与式 · 方程 · 几何 · 函数 · 统计','#247777'],
 ['chinese','语文','阅读与表达','阅读 · 古诗文 · 写作 · 口语交际','#a7604c'],
 ['english','英语','交流与应用','听说 · 阅读 · 语言运用 · 写作','#5d6fb0'],
 ['biology','生物学','生命与实验','生命结构 · 生命过程 · 遗传 · 生态','#56834d'],
 ['physics','物理','现象与规律','运动 · 力 · 声光热 · 电磁 · 实验','#387895'],
 ['chemistry','化学','物质与变化','物质 · 反应 · 微观模型 · 实验','#8970a7'],
 ['history','历史','史料与解释','时空脉络 · 史料研读 · 因果分析','#997246'],
 ['geography','地理','空间与环境','地图 · 自然环境 · 区域 · 人地关系','#378276'],
 ['civics','道德与法治','规则与责任','成长 · 社会 · 法治 · 责任','#a16472'],
 ['technology','信息科技','算法与创造','数据 · 算法 · 网络 · 人工智能','#48738b'],
 ['arts','艺术','感受与创作','音乐 · 美术 · 艺术实践','#a66991'],
 ['health','体育与健康','运动与生活','运动技能 · 健康生活 · 实践记录','#8c8047'],
 ['labor','劳动','设计与实践','生活劳动 · 生产劳动 · 服务劳动','#927a55'],
 ['projects','综合实践','研究与协作','问题发现 · 调查 · 设计 · 反思','#6b7790']
].map(([id,name,ability,topics,color])=>({id,name,ability,topics,color}));
export const phases=['探索','解释','应用','复习'];
const task=(kind,title,prompt,config={})=>({kind,title,prompt,...config});
const text=(title,prompt,criteria,config={})=>task('writing',title,prompt,{criteria,minLength:45,...config});
const reading=['雨停了，校门口的旧书摊还盖着塑料布。林然攥着攒了一周的零钱，想买那本旅行记。','摊主忙着把被风吹散的书页压好。林然看了看手表，停下脚步，蹲下来帮忙。','最后一本书摆好时，放学的人群已经散去。摊主递来旅行记，她却把钱放在桌上，说：“您留着慢慢数，我明天再来。”','第二天，林然发现书里多了一张手绘地图。地图的起点旁写着：“谢谢你昨天没有急着出发。”'];
export const units=[
 {id:'m7-classify',subject:'math',grade:7,semester:'上册',title:'数卡归档工坊',subtitle:'同一组数，可以按不同依据分类',scene:'推理站',minutes:22,objectives:['按正负零分类','区分整数和分数','按数值而不是写法判断类别'],tasks:[
 task('classify','正负零三个仓','先点一张数卡，再点归档区域。把全部数卡按正数、负数、零分类；可以重新选择已归档数卡改放。',{groups:['正数','负数','零'],cards:['−3','0','+2','−1/2','0.5','−0'],answers:[1,2,0,1,0,2],hint:'0 既不是正数也不是负数；−0 与 0 表示同一个数。'}),
 text('零为什么单独放','有人把 0 放进正数仓，因为“0 没有负号”。请解释这个判断为什么不成立，再说明 0 是否属于整数。',['明确零不是正数或负数','区分符号分类与整数分类','用自己的话说明依据'],{minLength:35,hint:'正数大于 0，负数小于 0；0 是整数。两个分类依据不同。'}),
 task('classify','按数值重新归档','这次只按整数、分数分类。先判断每张卡表示的数值，不能只看是否写了分数线或小数点。这里的“分数”类别指非整数的有理数。',{groups:['整数','分数（非整数）'],cards:['−4','0','2/2','−3/2','1.25','3.0'],answers:[0,0,0,1,1,0],hint:'2/2 = 1，3.0 = 3，都是整数；整数与分数合起来构成有理数。'}),
 task('classify','换一组再归档','独立复习：按整数、分数（非整数）归档全部数卡。建议两天后不看提示再试。',{groups:['整数','分数（非整数）'],cards:['−6/3','−0.75','4/5','+7','0/5','−2.5'],answers:[0,1,1,0,0,1],hint:'先化简：−6/3 = −2，0/5 = 0；负数也可能是整数。'})]},
 {id:'m7-order',subject:'math',grade:7,semester:'上册',title:'左右航标比较站',subtitle:'向右更大，不是离原点越远越大',scene:'推理站',minutes:20,objectives:['用数轴左右位置比较有理数','比较两个负数的大小','联系温度情境解释大小关系'],tasks:[
 task('numberline','两个负数的航标','参考点 A 表示 −3，B 表示 −1。移动你的标记到较大的数处。',{start:0,moves:[],referencePoints:[-3,-1],boardLabel:'参考点 A：−3 · B：−1',target:-1,min:-4,max:4,step:.5,hint:'在数轴上，右侧的数更大。',successMessage:'−1 在 −3 右侧，所以 −1 > −3。',retryMessage:'不要比较离原点的远近；观察哪个参考点在右侧。'}),
 text('纠正远近误区','有人认为 −3 比 −1 大，因为 3 比 1 大。请用数轴左右位置说明错误，再写出 −3、−1、0 从小到大的顺序。',['说明负号不能忽略','联系数轴右侧更大','给出包含零的正确顺序'],{minLength:35,hint:'自查：你比较的是数本身，还是到原点的距离？文字解释仍需内容复核。'}),
 task('numberline','哪座营地更暖','A 营地 −1.5℃，B 营地 0.5℃。把标记移到气温更高的营地对应的位置。',{start:0,moves:[],referencePoints:[-1.5,.5],boardLabel:'A：−1.5℃ · B：0.5℃',target:.5,min:-4,max:4,step:.5,hint:'正数在零的右侧，负数在零的左侧。',successMessage:'0.5 > −1.5，所以 B 营地气温更高。',retryMessage:'零是分界点，判断两个温度在零的哪一侧。'}),
 task('numberline','分数航标复习','A 表示 −3/4，B 表示 −1/4。先换成小数，再把标记放到较大的数处。建议两天后独立重做。',{start:0,moves:[],referencePoints:[-.75,-.25],boardLabel:'A：−3/4 · B：−1/4',target:-.25,min:-2,max:2,step:.25,hint:'−3/4 = −0.75，−1/4 = −0.25；比较左右位置。',successMessage:'−1/4 在 −3/4 右侧，所以 −1/4 更大。',retryMessage:'两个都是负数，离零更近的这个数在右侧。'})]},
 {id:'m7-absolute-distance',subject:'math',grade:7,semester:'上册',title:'原点测距站',subtitle:'位置有方向，距离不带负号',scene:'推理站',minutes:20,objectives:['用到原点的距离理解绝对值','区分负数的大小和绝对值大小','说明零的绝对值为零'],tasks:[
 task('numberline','左侧信标测距','信标在 −2.5。先定位，再填写它到原点的距离，也就是 |−2.5|。',{start:0,moves:[],boardLabel:'信标位置 −2.5 · 观察它与原点的间隔',target:-2.5,distance:2.5,distanceLabel:'到原点的距离 / 绝对值',min:-4,max:4,step:.5,successMessage:'位置与到原点的距离核验通过：负号表示方向，距离为 2.5。',retryMessage:'位置在左侧，但距离不能是负数。数一数信标到 0 的单位长度。',hint:'−2.5 与原点相距 2.5 个单位。'}),
 text('谁更大，谁更远','甲说：“−3 比 −1 更远离原点，所以 −3 比 −1 大。”请指出混淆之处，分别比较两个数以及它们的绝对值，并解释理由。',['比较数轴上左右位置','比较到原点的距离','区分数的大小和绝对值大小'],{minLength:35,hint:'自查：谁在右侧？谁离 0 更远？这两个问题的答案一定相同吗？文字作品仍需内容复核。'}),
 task('numberline','原点也有答案','把信标放在 0，并填写 |0|。注意：不能用留空代替数字零。',{start:2,moves:[],boardLabel:'目标位置 0 · 原点到自身有多远？',target:0,distance:0,distanceLabel:'到原点的距离 / 绝对值',min:-4,max:4,step:.5,successMessage:'零的位置和距离核验通过：|0| = 0。',retryMessage:'把标记移到原点，并明确填写距离 0；留空不表示零。',hint:'原点到自身没有间隔，距离就是 0。'}),
 task('numberline','分数测距复习','信标在 −7/4。独立标出它的位置，再填写到原点的距离。建议两天后不看提示重做。',{start:0,moves:[],boardLabel:'信标 −7/4 · 每小步 0.25 单位',target:-1.75,distance:1.75,distanceLabel:'到原点的距离 / 绝对值',min:-4,max:4,step:.25,successMessage:'分数位置与绝对值核验通过。试着用自己的话解释负号为什么不保留在距离里。',retryMessage:'先把 −7/4 写成 −1.75，再分别判断位置与距离；填写距离的小数值。',hint:'−7/4 = −1.75，到原点的距离为 1.75。'})]},
 {id:'m7-rational-position',subject:'math',grade:7,semester:'上册',title:'镜像数轴探险',subtitle:'在整数之间定位，发现零两侧的对称',scene:'推理站',minutes:20,objectives:['把分数与小数对应到数轴位置','理解相反数到原点距离相等','解释零的相反数仍为零'],tasks:[
 task('numberline','半格停靠站','把探测标记放在 −3/2 对应的位置。每次移动 0.5 个单位，观察它位于哪两个整数之间。',{start:0,moves:[],boardLabel:'目标：−3/2 · 每小步 0.5 单位',target:-1.5,min:-3,max:3,step:0.5,hint:'−3/2 = −1.5，在 −2 与 −1 的正中间。',retryMessage:'把一个单位分成两份；负数在原点左侧。注意 −3/2 不是 −3。'}),
 text('镜像航标的理由','数轴上 A 点表示 −1.5，B 点表示 1.5。说明两点的位置和到原点的距离怎样联系，再解释为什么 0 的相反数仍是 0。请用自己的话写出理由。',['说明分居原点两侧','说明到原点距离相等','单独解释零'],{minLength:35,hint:'相反数相加为零。原点关于自己对称后，还是原点。文字提交后仍需内容复核。'}),
 task('numberline','寻找对称信标','一个信标在 2.5。把探测标记放到它关于原点的对称位置。',{start:0,moves:[],boardLabel:'已知信标：2.5 · 寻找它的相反数',target:-2.5,min:-3,max:3,step:0.5,hint:'距离原点仍为 2.5 个单位，但方向相反。',retryMessage:'保留到原点的距离，把方向反过来。2.5 的对称点在原点左侧。'}),
 task('numberline','四分之一航线','独立复习：信标在 −3/4，把标记放到它的相反数处。完成后比较：为什么此处的步长不能还是 0.5？建议两天后再次尝试。',{start:0,moves:[],boardLabel:'已知信标：−3/4 · 每小步 0.25 单位',target:0.75,min:-3,max:3,step:0.25,hint:'−3/4 = −0.75，对称位置在原点右侧。',retryMessage:'先把 3/4 化为 0.75，再判断对称点的方向。'})]},
 {id:'m7-numberline',subject:'math',grade:7,semester:'上册',title:'数轴上的远行',subtitle:'把正负数变成看得见的移动',scene:'推理站',minutes:18,objectives:['理解数轴的方向与单位','用有理数表示位置变化','区分位移与路程'],tasks:[
 task('numberline','夜间温度计','气温从 −3℃ 上升 5℃。移动标记，表示最终温度。',{start:-3,moves:[5],target:2,min:-10,max:10,hint:'从 −3 出发，升温向右移动 5 个单位。'}),
 task('numberline','返回与距离','机器人从 2 出发，向左走 6 格，再向右走 3 格。标出终点，并填写总路程。',{start:2,moves:[-6,3],target:-1,distance:9,min:-10,max:10,hint:'终点看净变化；路程把两段走过的格数相加。'}),
 task('numberline','电梯调度','以地面为 0 层，从 −2 层上升 7 层，再下降 4 层。标出终点，并填写经过的总层数。',{start:-2,moves:[7,-4],target:1,distance:11,min:-10,max:10,hint:'上升是正方向，下降是负方向；总层数不抵消。'}),
 task('numberline','换个起点再试','勘测车从 −4 出发，先向右 8 格，再向左 6 格。请独立标出终点与总路程。',{start:-4,moves:[8,-6],target:-2,distance:14,min:-10,max:10,hint:'可以分两次记录位置。'})]},
 {id:'m7-equation',subject:'math',grade:7,semester:'上册',title:'社团预算解密',subtitle:'每一步变形，都说得出理由',scene:'推理站',minutes:22,objectives:['从情境理解未知量','保持等式等价','代回验证与纠错'],tasks:[
 task('equation','材料费去哪了','3 份材料每份 x 元，另付运费 6 元，总计 24 元。逐行解方程，每行写一个等式。',{equation:'3x+6=24',solution:6,hint:'先让两边同时减去运费，再考虑每份材料的价格。'}),
 task('equation','括号里的数量','两套工具，每套含一件 x 元的工具和 3 元配件，共 18 元。解方程 2(x+3)=18。',{equation:'2(x+3)=18',solution:6,hint:'可以先同时除以 2，也可以先去括号。不同有效路径都可以。'}),
 task('equation','修复错误解法','有人把 5x−4=16 写成 5x=12。请从原式重新写出正确步骤。',{equation:'5x-4=16',solution:4,hint:'消去 −4 时，两边应同时加上多少？'}),
 task('equation','两家商店','A 店收 4x＋8 元，B 店收 6x 元。买多少件时两店费用相同？解出 x 并写出步骤。',{equation:'4x+8=6x',solution:4,hint:'先把含 x 的项集中，再处理系数。'})]},
 {id:'c7-reading',subject:'chinese',grade:7,semester:'上册',title:'藏在文字里的线索',subtitle:'观点背后，要有自己的证据',scene:'档案馆',minutes:24,objectives:['筛选相关原文证据','解释人物行为','区分文本事实与推测'],tasks:[
 task('evidence','她为什么停下','阅读原创短文《起点》。标记与“林然愿意为别人付出时间”相关的段落，写出你的解释。',{passages:reading,relevant:[1,2],criteria:['引用具体动作','解释动作与观点的联系','避免添加文中没有的事实'],hint:'找一找，她原本想做什么，后来把时间用在了哪里。'}),
 task('evidence','地图的含义','末段的地图如何回应前文？选择证据，说明你的理解。',{passages:reading,relevant:[0,3],criteria:['联系前文的旅行愿望','解释地图与感谢的关联','允许不同但有依据的理解'],hint:'把第一段的“旅行记”和最后一段的“起点”放在一起看。'}),
 task('evidence','事实还是推测','“林然家里很富裕，所以没有在意零钱。”这个判断有足够依据吗？标记证据并分析。',{passages:reading,relevant:[0,2],criteria:['区分事实与推测','引用零钱的描写','说明哪些信息无法确定'],hint:'“攒了一周”能支持什么？又不能证明什么？'}),
 text('给出另一种解释','重新阅读《起点》，用 80～180 字解释标题。可以提出不同观点，但至少引用一个具体细节。',['观点明确','文本证据具体','解释证据与标题的联系'],{passages:reading,minLength:70,hint:'“起点”既可以指地图上的位置，也可能关联人物的经历。'})]},
 {id:'c7-writing',subject:'chinese',grade:7,semester:'上册',title:'让一段文字发生变化',subtitle:'从“告诉读者”到“让读者看见”',scene:'创作台',minutes:25,objectives:['用动作与细节表达','组织段落顺序','依据反馈修订作品'],tasks:[
 text('把紧张写出来','把“我上台演讲时很紧张”扩写成一段文字。写出至少两个可观察到的动作或感受。',['场景具体','动作或感受具体','不只重复“紧张”'],{hint:'可以从手、目光、声音或呼吸写起。'}),
 text('换一个观察位置','写一段雨后的校园。选定一个观察位置，按合理顺序写三处细节。',['观察位置明确','顺序能被读者理解','细节服务于整体感受'],{hint:'试试由近及远，或跟随一条行走路线。'}),
 task('revision','修订编辑室','修改这段文字，让人物行为更具体、叙述更连贯。保存初稿与修改稿，并说明一处修改理由。',{original:'比赛开始了。我很着急。队友也很着急。我们后来配合得很好。最后我们赢了，我很高兴。',criteria:['补充具体动作','连接事情的前后变化','说明修改理由'],hint:'挑一个关键时刻写清楚，比连续写“很着急”更有力量。'}),
 task('revision','再编辑一次','修改这段文字，减少重复并建立清楚的观察顺序。',{original:'图书馆里很安静。有很多书。窗边有一张桌子。书架上有很多书。我走进图书馆，看见同学在看书。',criteria:['观察顺序清楚','处理重复信息','保留必要细节并解释修改'],hint:'从“走进图书馆”开始，安排读者看到事物的顺序。'})]},
 {id:'e7-campus',subject:'english',grade:7,semester:'上册',title:'Welcome to our club',subtitle:'用英语完成一次真实的信息交流',scene:'交流室',minutes:20,objectives:['询问活动时间和地点','传达个人兴趣','写出完整邀请信息'],tasks:[
 task('dialogue','Meet the club guide','你想了解学校摄影社。用英语询问时间和地点，再确认参加。可以听角色示范，也可以自行朗读。',{turns:[['Hello! Welcome to the photo club. What would you like to know?','询问活动时间','\\b(when|what time)\\b'],['We meet on Friday at four. What else would you like to know?','询问活动地点','\\b(where|what (room|place))\\b'],['We meet in the art room. Would you like to join us?','表达愿意参加','\\b(yes|sure|love to|like to|will join)\\b']],hint:'你需要问清 when 和 where，再表达自己的决定。'}),
 task('dialogue','Help a new student','新同学想参加科学社。请告诉他活动在周二、地点在实验室，并礼貌回应感谢。',{turns:[['When does the science club meet?','告诉对方在周二','\\btuesday\\b'],['Where do you meet?','告诉对方在实验室','\\b(lab|laboratory)\\b'],['Thank you for your help!','礼貌回应感谢',"\\b(welcome|pleasure|no problem|any ?time)\\b"]],hint:'尽量用完整句子传达时间和地点。'}),
 text('Write an invitation','用英语邀请一位同学参加读书社。包含活动、时间、地点，并提出一个问题。至少写 25 个英文单词。',['活动明确','包含时间与地点','有邀请或提问'],{language:'en',minLength:25,hint:'You can begin with: Would you like to ...?'}),
 task('dialogue','A change of plan','篮球活动改期了。请告诉同学改到周六、地点在体育馆，并向对方确认是否可以参加。',{turns:[['Is the basketball game still on Friday?','说明改到周六','\\bsaturday\\b'],['Where is the game now?','说明在体育馆','\\b(gym|sports hall)\\b'],['I will check my plan.','询问对方能否参加','\\b(can|could|will|would) you\\b.*\\b(come|join|make it|attend)\\b']],hint:'关注是否传达了关键信息，不要求和示范句一模一样。'})]},
 {id:'b7-plant',subject:'biology',grade:7,semester:'上册',title:'温室里的实验',subtitle:'一次只改变一个条件',scene:'实验室',minutes:24,objectives:['设置对照实验','控制无关变量','用数据支持有限结论'],tasks:[
 task('experiment','光照会改变什么','设计两组植物实验，研究光照时长对生长的影响。保持其他条件一致，至少记录 3 次观察。',{variable:'light',hint:'两组的水量与温度应相同，光照应有差别。'}),
 text('结论需要边界','若只有一株植物在光下长高，能否断言“光照越久，所有植物都长得越好”？说明至少两个理由。',['指出样本或重复不足','指出其他条件影响','避免无限推广'],{hint:'想一想，植物种类、温度、水量是否都已排除影响。'}),
 task('experiment','水量对照实验','这次研究供水条件。调整两组水量，保持光照与温度相同，完成至少 3 次观察。',{variable:'water',hint:'改变研究变量，其他条件保持相同。'}),
 text('设计下一次实验','选择一种你熟悉的植物，写一份对照实验计划：问题、两组条件、保持一致的因素、记录方式。',['问题可以检验','只有一个主要变化因素','有重复观察和记录计划'],{hint:'写清比较什么、固定什么、怎样记录。'})]}
];
units.push(...expansionUnits,...practiceUnits);
for(const u of units){u.alignment='课程标准主题样例';u.reviewStatus='draft';u.source=curriculumSource;u.edition=null;u.tasks.forEach((t,i)=>{t.id=`${u.id}.${i+1}`;t.phase=phases[i];t.unitId=u.id;t.subject=u.subject;t.grade=u.grade;});}
export const tasks=units.flatMap(u=>u.tasks);
export const taskById=new Map(tasks.map(t=>[t.id,t]));
export const unitById=new Map(units.map(u=>[u.id,u]));
