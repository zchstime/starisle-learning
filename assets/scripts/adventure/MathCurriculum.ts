import type {Chapter,Level,MathVisual} from './Catalog';
type Task=Omit<Level,'id'>;
interface Unit {title:string;theme:string;semester:'上册'|'下册';make:(i:number)=>Task;verified?:boolean;}
const sources=['1221001101241','1221001201251','1221001301251','1221001401261','1221001501261','1221001601261'];
const number=(title:string,goal:string,target:number,explanation:string,unit='',visual?:MathVisual,scale=1):Task=>({kind:'number',title,goal,target,scale,answerUnit:unit,visual,explanation,hint:'先看任务里的数量和单位，再用数字按钮填写结果。'});
const choose=(title:string,goal:string,correct:string,wrong:string[],explanation:string):Task=>({kind:'choice',title,goal,options:[correct,...wrong],target:0,explanation,hint:'逐个看看任务卡，选能解决眼前问题的一张。'});
const cargo=(goal:string,target:number,units=[1,10],scale=1):Task=>({kind:'cargo',title:'补给小队',goal,target,units,scale,explanation:`需要 ${target/scale}，数量合适才能出发。`,hint:'把需要的数量装进船舱；装多的可以点一下取回。'});
const tile=(goal:string,cells:number,target:number,cols:number,explanation:string):Task=>({kind:'tiles',title:'花田修复师',goal,cells,target,cols,explanation,hint:'每一格一样大，按要求把需要的部分点亮。'});
const bar=(a:number,b:number,labels:[string,string]):MathVisual=>({kind:'bars',values:[a,b],labels});
const shape=(w:number,h:number):MathVisual=>({kind:'shape',values:[w,h]});
const clock=(h:number,m:number):MathVisual=>({kind:'clock',values:[h,m]});
const unit=(title:string,theme:string,semester:Unit['semester'],make:Unit['make'],verified=false):Unit=>({title,theme,semester,make,verified});
const evidenceRoles=['understand','model','fluency','diagnose','apply','transfer'] as const;
const misconceptionFor=(kind:Level['kind']):string=>({
 choice:'只凭题目中的单个关键词选择，没有核对完整数量关系',
 number:'列式方向正确但忽略进退位、小数点、单位或运算顺序',
 cargo:'只关注总量，没有使用合适的计数单位或组合方式',
 groups:'混淆组数和每组数量，或各组没有保持同样多',
 tiles:'没有先平均分整体，就直接按格数猜测结果',
 sentence:'没有按数量关系的先后顺序组织表达',
 listen:'只记住局部信息，没有核对完整任务条件',
 picture:'观察了表面特征，但没有使用题目要求的数学属性'
} as Record<Level['kind'],string>)[kind]||'只计算结果，没有检查数量关系和单位';
const curriculum:Unit[][]=[
[
 unit('初见星星','5以内数的认识和加、减法','上册',i=>{const a=[1,2,2,3,3,4][i],b=[1,1,2,1,2,1][i];return cargo(`${a} 位伙伴先到，又来 ${b} 位。给每人装一份点心。`,a+b,[1]);},true),
 unit('十颗星的约定','6～10的认识和加、减法','上册',i=>{const a=6+i%5,b=1+i%3;return number('点心配送',`共有 ${a} 份点心，送出 ${b} 份，还剩几份？`,a-b,`${a} − ${b} = ${a-b}。`,'份',bar(a,b,['原有','送出']));},true),
 unit('积木城的朋友','认识立体图形','上册',i=>{const names=['球','正方体','圆柱','长方体','圆柱','球'];const clues=['能向各个方向滚动的皮球','六个面都是相同正方形的积木','上下两个面是一样大的圆，中间直直的纸筒','像普通长方形纸巾盒的积木','直直的圆形铅笔筒','足球'];return choose('积木认领',`给${clues[i]}贴上形状标签。`,names[i],['球','正方体','圆柱','长方体'].filter(n=>n!==names[i]).slice(0,2),'根据物体整体形状分类，不能只看一个面。');},true),
 unit('十位小灯塔','11～20的认识','上册',i=>number('灯塔编码',`1 个十和 ${i+1} 个一，合起来是多少？`,11+i,`10 + ${i+1} = ${11+i}。`,'颗',bar(10,i+1,['一个十','几个一'])),true),
 unit('凑十过小桥','20以内的进位加法','上册',i=>{const a=[8,9,7,8,9,6][i],b=[3,4,5,6,8,7][i];return number('桥梁能源',`桥的一端有 ${a} 颗星，另一端有 ${b} 颗，一共有多少颗？`,a+b,`把 ${a} 凑成 10，再加剩下的，${a}+${b}=${a+b}。`,'颗',bar(a,b,['一端','另一端']));},true),
 unit('晨光复习营','上册复习与关联','上册',i=>i%2?number('补齐星星',`宝箱要装满 10 颗，现在有 ${i+2} 颗，还差几颗？`,8-i,`${i+2} + ${8-i} = 10。`,'颗'):number('点心小队',`原有 ${8+i} 份点心，送出 3 份，又收到 2 份。现在几份？`,7+i,`${8+i} − 3 + 2 = ${7+i}。`,'份'),true),
 unit('退位小码头','20以内退位减法','下册',i=>number('星光结算',`有 ${12+i} 颗星，送走 8 颗，剩下多少颗？`,4+i,`${12+i} − 8 = ${4+i}。`,'颗')),
 unit('百以内邮局','100以内数的认识','下册',i=>{const t=2+i,o=1+i%4;return cargo(`邮包编号是 ${t} 个十和 ${o} 个一，请装出这个数。`,10*t+o);}),
 unit('零钱商店','认识人民币','下册',i=>number('换零钱',`${i+2} 元可以换成多少角？`,(i+2)*10,`1 元=10 角，${i+2} 元=${(i+2)*10} 角。`,'角')),
 unit('百以内运输','100以内加减法','下册',i=>number('卸货后补给',`船上有 ${35+i*3} 箱，卸下 ${10+i} 箱，还剩几箱？`,25+i*2,`${35+i*3} − ${10+i} = ${25+i*2}。`,'箱')),
 unit('形状拼图屋','认识平面图形','下册',i=>choose('图形通行证',['有3条边的屋顶图形是什么？','有4条相等边和4个直角的地砖是什么？','有3个角的三角旗是什么图形？','正方形纸片的4条边相等，是什么图形？','有3条直边的路牌是什么图形？','四边相等且四角为直角的窗框是什么图形？'][i],i%2?'正方形':'三角形',i%2?['圆','三角形']:['圆','正方形'],'用边和角的特征来辨认图形。')),
 unit('整理星光仓','分类与整理','下册',i=>number('分类计数',`仓库有 ${3+i} 个红箱、${2+i} 个蓝箱。只装蓝箱，要装几个？`,2+i,`按颜色分类后，蓝箱有 ${2+i} 个。`,'个',bar(3+i,2+i,['红箱','蓝箱'])))
],
[
 unit('整理小集市','分类与整理','上册',i=>number('分类统计',`集市有 ${5+i} 个苹果和 ${3+i} 个梨，一共有多少个水果？`,8+2*i,`${5+i}+${3+i}=${8+2*i}。`,'个',bar(5+i,3+i,['苹果','梨']))),
 unit('百以内补给队','100以内加减法','上册',i=>{const a=27+i*4,b=16+i;return number('补给计算',`上午送来 ${a} 箱，下午又来 ${b} 箱。合计几箱？`,a+b,`${a} + ${b} = ${a+b}，个位满十向十位进一。`,'箱');}),
 unit('乘法星田','表内乘法','上册',i=>{const groups=2+i%4,n=2+i%5;return {kind:'groups',title:'种植小队',goal:`${groups} 块小花田，每块种 ${n} 颗星。动手种一片。`,groups,target:n,explanation:`${groups} × ${n} = ${groups*n} 颗。`,hint:'每盆的数量要一样。'};}),
 unit('量量星光桥','长度单位','上册',i=>{const start=i%3,end=start+3+i;return number('尺子测量',`木条从 ${start} 厘米刻度到 ${end} 厘米刻度，长几厘米？`,end-start,`终点刻度减起点刻度：${end}−${start}=${end-start}。`,'厘米',{kind:'ruler',values:[start,end]});}),
 unit('钟楼的约定','认识时间','上册',i=>{const h=2+i,m=[0,15,30,45,20,40][i];return number('钟楼报时',`钟面表示 ${h} 时几分？`,m,`分针走一大格是5分，共${m}分。`,'分',clock(h,m));}),
 unit('乘法闯关营','乘法情境应用','上册',i=>{const a=3+i%4,b=4+i%5;return number('小队集合',`${a} 队伙伴，每队 ${b} 人，又来 2 人。共有几人？`,a*b+2,`先算 ${a}×${b}，再加2，得到${a*b+2}。`,'人');}),
 unit('公平分享港','表内除法','下册',i=>{const a=2+i%4,b=3+i%5;return number('平均分果子',`${a*b} 个果子平均放进 ${a} 个篮子，每篮几个？`,b,`${a*b} ÷ ${a} = ${b}。`,'个');}),
 unit('余数小渡口','有余数的除法','下册',i=>{const b=3+i%3,a=b*(2+i%2)+(1+i%2);return number('最后的小星星',`${a} 颗星，每袋装 ${b} 颗，装满后还剩几颗？`,a%b,`${a}÷${b}=${Math.floor(a/b)}……${a%b}，余数要比除数小。`,'颗');}),
 unit('千位灯塔','万以内数的认识','下册',i=>number('灯塔号码',`${i+2} 个千、3 个百和 5 个一组成几？`,(i+2)*1000+305,`千位是${i+2}，百位是3，十位是0，个位是5。`)),
 unit('称一称果箱','克和千克','下册',i=>number('称重换算',`${i+1} 千克等于多少克？`,(i+1)*1000,`1千克=1000克。`,'克')),
 unit('数据小观察','数据收集与整理','下册',i=>number('最爱水果',`选苹果的有 ${6+i} 人，选梨的有 ${3+i%2} 人。苹果比梨多几人？`,6+i-(3+i%2),`用较多人数减去较少人数。`,'人',bar(6+i,3+i%2,['选苹果','选梨']))),
 unit('两步任务岛','混合运算与解决问题','下册',i=>number('补给两步走',`每船 4 箱，来了 ${3+i} 船。送走 5 箱，剩几箱？`,4*(3+i)-5,`4×${3+i}−5=${4*(3+i)-5}。`,'箱'))
],
[
 unit('观察积木屋','观察物体','上册',i=>choose('观察方向',['正对正方体的前面看，看到什么图形？','正对竖直圆柱的上底面看，看到什么图形？','正对球的外轮廓看，看到什么图形？','正对长方体纸盒的一个长方形大面看，看到什么图形？','正对正方体的上面看，看到什么图形？','正对竖直圆柱的侧面看，轮廓通常是什么图形？'][i],['正方形','圆形','圆形','长方形','正方形','长方形'][i],['三角形',i===3||i===5?'圆形':'长方形'],'观察方向不同，看到的形状可能不同。'),true),
 unit('混合能源站','混合运算','上册',i=>number('先后顺序',`能源值是 ${24+i*3} − 3 × ${2+i}，请输入能源值。`,18,`先乘后减：${24+i*3}−${3*(2+i)}=18。`),true),
 unit('测量远航','毫米、分米和千米','上册',i=>number('换算补给绳',`${i+2} 分米长的绳子，等于多少厘米？`,(i+2)*10,`1分米=10厘米。`,'厘米'),true),
 unit('乘法工坊','多位数乘一位数','上册',i=>{const a=12+7*i,b=3+i%3;return number('箱子装船',`每箱 ${a} 颗星，${b} 箱共有多少颗？`,a*b,`${a}×${b}=${a*b}。`,'颗');},true),
 unit('线与角小屋','线和角','上册',i=>choose('道路设计',['笔直路段有两个端点，是什么线？','一个角比直角小，是什么角？','笔直的线向两端无限延伸，是什么线？','一个角比直角大又小于平角，是什么角？','笔直的线有一个端点，向一端无限延伸，是什么线？','三角尺上有一个直角，应贴哪种标签？'][i],['线段','锐角','直线','钝角','射线','直角'][i],[['射线','直线'],['直角','钝角'],['线段','射线'],['锐角','直角'],['线段','直线'],['锐角','钝角']][i],'按角的大小、线的端点数来判断。'),true),
 unit('分数花瓣','分数的初步认识','上册',i=>{const cells=12,den=[2,3,4,6,3,4][i],num=i<3?1:2;return tile(`把花田平均分成 ${den} 份，点亮其中 ${num} 份。`,cells,cells/den*num,4,`${num}/${den} 表示平均分成${den}份，取${num}份。`);},true),
 unit('三位数补给','万以内加减法','下册',i=>number('港口合计',`已有 ${236+i*11} 箱，又来 ${125+i*7} 箱，共几箱？`,361+i*18,`${236+i*11}+${125+i*7}=${361+i*18}。`,'箱')),
 unit('平均分航线','除数是一位数的除法','下册',i=>{const b=3+i%4,n=21+i*3;return number('平均装船',`${n*b} 箱平均装入 ${b} 艘船，每船几箱？`,n,`${n*b}÷${b}=${n}。`,'箱');}),
 unit('时光观察站','时、分、秒与经过时间','下册',i=>number('观察时长',`观察从 9 时 ${5+i*2} 分开始，到 9 时 ${25+i*3} 分结束，经过几分钟？`,20+i,`同一小时内，用结束分钟数减开始分钟数。`,'分钟')),
 unit('围栏修复队','长方形和正方形的周长','下册',i=>{const a=5+i,b=3+i%3;return number('围栏长度',`长方形花田长 ${a} 米、宽 ${b} 米，围一圈要几米？`,2*(a+b),`（${a}+${b}）×2=${2*(a+b)}。`,'米',shape(a,b));}),
 unit('方格花田','面积和面积单位','下册',i=>{const a=3+i%3,b=2+i%2;return tile(`长 ${a} 米、宽 ${b} 米，每格1平方米，铺满后面积是多少？`,a*b,a*b,a,`${a}×${b}=${a*b}平方米。`);}),
 unit('日期规划营','年、月、日','下册',i=>choose('活动日期',`活动在${[4,6,9,11,7,8][i]}月，这个月一共有几天？`,i<4?'30天':'31天',i<4?['28天','31天']:['29天','30天'],'四、六、九、十一月是30天，七月有31天。'))
],
[
 unit('大数星港','大数的认识','上册',i=>number('星港编码',`${i+2} 个万、3 个千和 6 个百组成几？`,(i+2)*10000+3600,`按数位顺序写数，中间缺少的数位用0。`)),
 unit('乘法航程','三位数乘两位数','上册',i=>{const a=110+i*10,b=12+i;return number('远航补给',`${b} 箱材料，每箱 ${a} 件，共几件？`,a*b,`${a}×${b}=${a*b}。`,'件');}),
 unit('除法分航','除数是两位数的除法','上册',i=>{const a=12+i,b=20+i*2;return number('平均配送',`${a*b} 件分成 ${a} 船，每船几件？`,b,`${a*b}÷${a}=${b}。`,'件');}),
 unit('角度导航塔','角的度量','上册',i=>{const angle=[30,60,90,120,150,180][i];return choose('角度分类',`导航转角为 ${angle}°，属于哪一类？`,angle<90?'锐角':angle===90?'直角':angle<180?'钝角':'平角',['锐角','直角','钝角','平角'].filter(a=>a!==(angle<90?'锐角':angle===90?'直角':angle<180?'钝角':'平角')).slice(0,2),'锐角小于90°；直角90°；钝角大于90°小于180°；平角180°。');}),
 unit('土地小规划','面积单位','上册',i=>number('土地换算',`${i+1} 公顷等于多少平方米？`,(i+1)*10000,`1公顷=10000平方米。`,'平方米')),
 unit('数据观测台','条形统计图','上册',i=>([
  choose('读懂条形图','条形越长通常表示什么？','数量越多',['数量越少','日期越早'],'条形的长度对应数量的多少，条形越长，数量通常越多。'),
  number('读图比较','第一天收到 8 颗星，第二天收到 3 颗，相差多少颗？',5,'8−3=5（颗）。','颗',bar(8,3,['第一天','第二天'])),
  number('读图合计','周一收到 6 颗星，周二收到 4 颗，两天共多少颗？',10,'6+4=10（颗）。','颗',bar(6,4,['周一','周二'])),
  choose('错图修理铺','记录表写着“晴天7天、雨天3天”，哪幅条形图的数量关系正确？','晴天条形比雨天长4格',['两根条形一样长','雨天条形比晴天长4格'],'7比3多4，晴天条形应更长，长度差表示数量差。'),
  number('借阅统计员','故事书借出 12 本，科普书借出 7 本。故事书比科普书多借出多少本？',5,'12−7=5（本）。','本',bar(12,7,['故事书','科普书'])),
  choose('数据结论桥','甲组植树9棵，乙组6棵。下面哪句话能由数据直接得到？','甲组比乙组多3棵',['甲组最喜欢植树','乙组明天会植更多'],'条形图能说明已经记录的数量及其差，不能推断喜好或未来情况。')
 ] as Task[])[i]),
 unit('运算调度营','四则运算','下册',i=>number('分批调度',`要配送 ${120+i*12} 件，先分成 6 份，再增加 8 件，一份现在几件？`,28+i*2,`（${120+i*12}÷6）+8=${28+i*2}。`,'件')),
 unit('简便计算桥','运算定律','下册',i=>number('凑整补给',`每包 ${i+3} 元，先买 99 包再买 1 包，一共几元？`,(i+3)*100,`99×${i+3}+1×${i+3}=100×${i+3}。`,'元')),
 unit('小数星光币','小数的意义和加减法','下册',i=>number('小数结算',`有 ${(3+i/10).toFixed(1)} 元，用掉 1.2 元，还剩多少元？`,18+i,`${(3+i/10).toFixed(1)}−1.2=${((18+i)/10).toFixed(1)}。`,'元',undefined,10)),
 unit('三角形造桥','三角形','下册',i=>number('三角形转角',`三角形两个角是 ${40+i*5}° 和 60°，第三个角几度？`,80-i*5,`180−${40+i*5}−60=${80-i*5}。`,'度')),
 unit('平均数气象屋','平均数','下册',i=>number('三天平均数',`三天采集 ${8+i}、${10+i}、${12+i} 颗星，平均每天几颗？`,10+i,`（${8+i}+${10+i}+${12+i}）÷3=${10+i}。`,'颗', {kind:'bars',values:[8+i,10+i,12+i],labels:['第一天','第二天','第三天']})),
 unit('应用任务营','数量关系与解决问题','下册',i=>number('路程规划',`飞船每小时行 ${40+i*5} 千米，行 3 小时后离 200 千米终点还有多远？`,200-(40+i*5)*3,`200−${40+i*5}×3=${200-(40+i*5)*3}。`,'千米'))
],
[
 unit('小数采购站','小数乘法','上册',i=>number('采购结算',`每袋 ${(1.2+i/10).toFixed(1)} 元，买 ${2+i%3} 袋，一共几元？`,(12+i)*(2+i%3),`${(1.2+i/10).toFixed(1)}×${2+i%3}=${((12+i)*(2+i%3)/10).toFixed(1)}。`,'元',undefined,10)),
 unit('小数分享港','小数除法','上册',i=>number('求单价',`${((12+i)*4/10).toFixed(1)} 元买 4 袋，每袋几元？`,12+i,`${((12+i)*4/10).toFixed(1)}÷4=${((12+i)/10).toFixed(1)}。`,'元',undefined,10)),
 unit('等式天平屋','简易方程','上册',i=>number('解开宝箱',`宝箱上的条件：3x + ${5+i} = ${3*(4+i)+5+i}，x 是多少？`,4+i,`先减${5+i}，再除以3，x=${4+i}。`)),
 unit('花田测绘队','多边形的面积','上册',i=>{const a=6+i,h=3+i%2;return number('三角花田',`三角形底 ${a} 米，高 ${h} 米，面积几平方米？`,a*h*10/2,`${a}×${h}÷2=${a*h/2}。`,'平方米',{...shape(a,h),labels:['triangle']},10);}),
 unit('可能性观察室','可能性','上册',i=>choose('抽签预测',['袋中只有红球，能摸到蓝球吗？','袋中有红球和蓝球，摸到红球是怎样的事件？','袋中只有蓝球，能摸到蓝球吗？','袋中有红、蓝两种球，摸到黄球是怎样的事件？','袋中放着2红1蓝，摸到红球是怎样的事件？','袋中放着3个绿球，摸到绿球是怎样的事件？'][i],['不可能','可能','一定','不可能','可能','一定'][i],['一定','可能','不可能'].filter(v=>v!==['不可能','可能','一定','不可能','可能','一定'][i]),'结论要依据袋中实际有哪些球。')),
 unit('位置传送站','位置','上册',i=>choose('数对导航',`星宝在第 ${2+i} 列、第 ${3+i%3} 行，用（列，行）表示的位置是？`,`（${2+i}，${3+i%3}）`,[`（${3+i%3}，${9+i}）`,`（${9+i}，${2+i}）`],'数对先写列，再写行。')),
 unit('因数补给码','因数与倍数','下册',i=>choose('因数钥匙',`哪一个是 ${12+i*6} 的因数？`,'3',[String(13+i*6),String(25+i*6)],`${12+i*6}能被3整除，商是${4+i*2}。`)),
 unit('分数等值园','分数的意义和性质','下册',i=>{const den=[2,3,4,6,3,4][i],num=i<3?1:2;return tile(`用12格花田表示 ${num}/${den}。`,12,12*num/den,4,`把12格平均分${den}份，再取${num}份。`);}),
 unit('分数合花径','分数加减法','下册',i=>{const n=[2,3,4,5,6,7][i];return tile(`把花田的 ${n}/12 加上 1/12 点亮。`,12,n+1,4,`同分母分数相加，分母不变，分子相加，结果${n+1}/12。`);}),
 unit('立体仓库','长方体和正方体','下册',i=>{const a=3+i,b=2+i%2,h=4;return number('仓库体积',`仓库长 ${a} 米、宽 ${b} 米、高 ${h} 米，体积是多少？`,a*b*h,`${a}×${b}×${h}=${a*b*h}。`,'立方米');}),
 unit('折线观测台','折线统计图','下册',i=>number('观测变化',`两次记录从 ${12+i} 增到 ${20+i*2}，增加多少？`,8+i,`后一次减去前一次，增加${8+i}。`,'颗',bar(12+i,20+i*2,['前一次','后一次']))),
 unit('异分母远航','分数加减法与实际问题','下册',i=>{const den=[2,3,4,6,2,3][i],x=12/den;return tile(`星宝先修好花田的 1/${den}，又修好 1/12，点亮一共修好的部分。`,12,x+1,4,`先通分成十二分之${x}，再加十二分之一。`);})
],
[
 unit('坐标星图','确定位置','上册',i=>choose('星图导航',`灯塔在第 ${2+i} 列、第 ${3+i%3} 行。正确数对是？`,`（${2+i}，${3+i%3}）`,[`（${9+i}，${2+i}）`,`（${3+i%3}，${9+i}）`],'有序数对先列后行。'),true),
 unit('分数采集队','分数乘法','上册',i=>number('采集任务',`${24+i*6} 颗星的 2/3 要送进灯塔，送多少颗？`,(24+i*6)*2/3,`${24+i*6}×2/3=${(24+i*6)*2/3}。`,'颗'),true),
 unit('分数寻源岛','分数除法','上册',i=>number('找总量',`修好的 ${12+i*3} 盏灯占全部的 3/4，一共有几盏？`,(12+i*3)*4/3,`${12+i*3}÷3/4=${(12+i*3)*4/3}。`,'盏'),true),
 unit('零度观测站','生活中的负数','上册',i=>number('温度读数',`温度比 0℃ 低 ${i+1}℃，请用正负数记录。`,-i-1,`零下${i+1}℃记作−${i+1}℃。`,'℃',{kind:'numberline',values:[-i-1,0,i+1]}),true),
 unit('圆形观测台','圆','上册',i=>number('圆的直径',`圆形花坛的半径是 ${i+2} 米，直径几米？`,(i+2)*2,`直径等于半径的2倍。`,'米',{kind:'shape',values:[i+2,0]}),true),
 unit('百分数星海','百分数','上册',i=>number('灯塔修复率',`共 ${40+i*20} 盏灯，修好 25%，修好几盏？`,(40+i*20)/4,`25%=1/4，${40+i*20}÷4=${(40+i*20)/4}。`,'盏'),true),
 unit('比例调色坊','比与比例','下册',i=>number('分配材料',`金粉与蓝粉按 2:3 配制，总共 ${25+i*5} 克，金粉几克？`,(25+i*5)*2/5,`共5份，金粉占2份，${25+i*5}÷5×2=${(25+i*5)*2/5}。`,'克')),
 unit('圆柱能源仓','圆柱与圆锥','下册',i=>number('圆柱体积',`圆柱底面积 ${6+i*2} 平方米，高 3 米，体积多少立方米？`,(6+i*2)*3,`底面积×高=${6+i*2}×3=${(6+i*2)*3}。`,'立方米')),
 unit('圆锥沙漏','圆锥体积','下册',i=>number('沙漏容积',`圆锥底面积 ${9+i*3} 平方厘米，高 4 厘米，体积多少？`,(9+i*3)*4/3,`底面积×高÷3=${(9+i*3)*4/3}。`,'立方厘米')),
 unit('地图远航','比例尺','下册',i=>number('实际距离',`比例尺 1:100000，图上距离 ${i+2} 厘米，实际几千米？`,i+2,`100000厘米=1千米，所以实际${i+2}千米。`,'千米')),
 unit('数据星盘','统计与百分数','下册',i=>number('读数据求比例',`共 ${20+i*4} 人，${5+i} 人选蓝队，蓝队占百分之几？`,25,`${5+i}÷${20+i*4}=25%。`,'%')),
 unit('毕业任务营','比例与综合解决问题','下册',i=>number('按速度规划',`飞船2小时行 ${60+i*10} 千米，同速3小时行几千米？`,(60+i*10)/2*3,`先求每小时${(60+i*10)/2}千米，再乘3。`,'千米'))
]
];
// Current upper-book themes verified against the publisher's live electronic editions.
const g2=curriculum[1];
curriculum[1]=[
 g2[0],
 unit('乘法星田','1～6的表内乘法','上册',i=>{
  const common={
   coachHints:['先找“有几组”和“每组几个”。','只有每组同样多时，才能直接用乘法。'],
   evidence:{knowledgeId:'pep-math-g2-u2-equal-groups',objective:'理解乘法表示几个相同加数的和，并能在真实情境中选择、计算和解释乘法算式。',role:(['understand','model','fluency','diagnose','apply','transfer'] as const)[i],prerequisites:['20以内加法','按相同数量分组'],misconceptions:['把组数和每组数量相加','各组数量不相等时仍直接使用乘法'],reviewed:false}
  };
  const tasks:Task[]=[
   {kind:'choice',title:'等量小侦探',goal:'哪一种摆法可以用 3 × 2 表示？',options:['3 个盘子，每盘 2 颗星','一个盘子 3 颗，另一个盘子 2 颗','3 颗星再拿走 2 颗'],target:0,hint:'乘法表示几个相同加数的和，先看每组是否同样多。',explanation:'3 个盘子，每盘都是 2 颗，就是 3 个 2，写成 3 × 2。'},
   {kind:'groups',title:'种植小队',goal:'4 块花田，每块种 3 颗星。动手摆出 4 个 3。',groups:4,target:3,hint:'每块花田要同样多，种完后看看一共有几个 3。',explanation:'4 个 3 相加是 12，所以 4 × 3 = 12。'},
   {kind:'number',title:'算式翻译站',goal:'5 + 5 + 5 表示 3 个 5，一共有多少？',target:15,answerUnit:'颗',visual:bar(5,5,['每组5颗','还有两组']),hint:'相同加数是 5，共出现 3 次。',explanation:'5 + 5 + 5 = 15，也可以写成 3 × 5 = 15。'},
   {kind:'choice',title:'错例修理铺',goal:'小北说“4 个篮子，每篮 6 个苹果，可以算 4 + 6 = 10”。应该怎样修正？',options:['4 × 6 = 24','4 + 6 = 10，不用修改','6 − 4 = 2'],target:0,hint:'“4 个篮子”表示 4 组，“每篮 6 个”表示每组都是 6。',explanation:'这是 4 个 6 相加，应列乘法算式 4 × 6 = 24。'},
   {kind:'number',title:'影院排座员',goal:'小剧场有 5 排座位，每排 4 个。一共有多少个座位？',target:20,answerUnit:'个',visual:bar(4,4,['每排4个','共5排']),hint:'每排数量相同，可以用“排数 × 每排个数”。',explanation:'5 × 4 = 20（个）。排数是 5，每排 4 个。'},
   {kind:'number',title:'逆向补给站',goal:'6 个同样的盒子一共装 30 颗星，每盒装几颗？',target:5,answerUnit:'颗',hint:'想一想：6 乘几等于 30？也可以把 30 平均分成 6 份。',explanation:'6 × 5 = 30，所以每盒 5 颗。这道题把乘法和平均分联系起来。'}
  ];
  return {...tasks[i],...common,evidence:{...common.evidence,role:common.evidence.role}};
 }),
 unit('分享小码头','1～6的表内除法','上册',i=>{
  const common={
   coachHints:['先判断是“平均分成几份”，还是“每几个分一份”。','可以用乘法口诀检查商是否正确。'],
   evidence:{knowledgeId:'pep-math-g2-u3-division-meaning',objective:'理解平均分与除法的含义，能区分按份数平均分和按每份数量分，并用乘法检验商。',role:(['understand','model','fluency','diagnose','apply','transfer'] as const)[i],prerequisites:['1～6的乘法口诀','平均分实物的经验'],misconceptions:['没有平均分也列除法','混淆份数与每份数量','商计算后不作乘法检验'],reviewed:false}
  };
  const tasks:Task[]=[
   {kind:'choice',title:'公平分享侦察员',goal:'12 颗星平均放进 3 个盒子，哪一种摆法最公平？',options:['每个盒子放 4 颗','三个盒子分别放 3、4、5 颗','每个盒子放 3 颗，还剩 3 颗'],target:0,hint:'平均分要求每份同样多，而且全部分完。',explanation:'12 平均分成 3 份，每份 4 颗，写成 12 ÷ 3 = 4。'},
   {kind:'groups',title:'码头分装员',goal:'把 15 个果子平均放进 3 个篮子。动手摆出每篮同样多。',groups:3,target:5,hint:'轮流给每个篮子放果子，直到 15 个全部分完。',explanation:'每篮 5 个，3 × 5 = 15，所以 15 ÷ 3 = 5。'},
   {kind:'number',title:'乘除密码站',goal:'因为 5 × 6 = 30，所以 30 ÷ 5 等于多少？',target:6,answerUnit:'',hint:'除法可以想乘法：5 乘几等于 30？',explanation:'5 × 6 = 30，所以 30 ÷ 5 = 6。'},
   {kind:'choice',title:'错商修理铺',goal:'小北算 18 ÷ 3 = 5。怎样检查并修正？',options:['3 × 6 = 18，所以商是 6','3 × 5 = 15，所以商是 5','18 − 3 = 15，所以商是 15'],target:0,hint:'把除数和商相乘，结果应该回到被除数 18。',explanation:'3 × 6 = 18，因此 18 ÷ 3 = 6。原来的商 5 少算了一组。'},
   {kind:'number',title:'研学组队官',goal:'24 名同学，每 4 人组成一队，可以组成几队？',target:6,answerUnit:'队',visual:bar(24,4,['总人数','每队人数']),hint:'这是“每 4 人一队”，求 24 里面有几个 4。',explanation:'24 ÷ 4 = 6（队），用 4 × 6 = 24 检查。'},
   {kind:'choice',title:'双航线挑战',goal:'20 ÷ 5 的两种故事，哪一组结果都正确？',options:['平均分成 5 份，每份 4；每 5 个装一份，装 4 份','平均分成 5 份，每份 5；每 5 个装一份，装 5 份','平均分成 4 份，每份 4；每 4 个装一份，装 4 份'],target:0,hint:'一个故事求每份几个，另一个求能分几份，但算式都可以是 20 ÷ 5。',explanation:'20 平均分成 5 份，每份 4；20 里面有 4 个 5，也能装 4 份。'}
  ];
  return {...tasks[i],...common,evidence:{...common.evidence,role:common.evidence.role}};
 }),
 {...g2[3],theme:'厘米和米'},
 unit('大乘法星田','7～9的表内乘、除法','上册',i=>{const a=7+i%3,b=2+i;return i<3?number('补给乘法',`${a}袋，每袋${b}颗星，共几颗？`,a*b,`${a}×${b}=${a*b}。`,'颗'):number('大组分享',`${a*b}颗星平均分成${a}袋，每袋几颗？`,b,`${a*b}÷${a}=${b}。`,'颗');}),
 {...g2[5],theme:'上册复习与关联'},...g2.slice(6)
];
const g4=curriculum[3];
curriculum[3]=[
 {...g4[0],theme:'万以上数的认识'},g4[3],{...g4[1],theme:'多位数乘两位数'},
 unit('两种补给模型','加法模型和乘法模型','上册',i=>{const a=6+i,b=3+i%3;return number('选择数量关系',i%2?`每船${a}箱，${b}船一共几箱？`:`一船${a}箱，另一船${b}箱，一共几箱？`,i%2?a*b:a+b,i%2?`相同数量重复${b}次：${a}×${b}=${a*b}。`:`合并两部分：${a}+${b}=${a+b}。`,'箱');}),
 unit('小桥四边形','平行四边形和梯形','上册',i=>{const qs=[['两组对边分别平行的四边形','平行四边形'],['只有一组对边平行的四边形','梯形'],['四个角都是直角、对边平行且相等的图形','长方形'],['四条边相等、四个角都是直角的图形','正方形'],['小桥侧面只有一组对边平行，这个图形','梯形'],['菱形的两组对边都平行，它也属于哪一类','平行四边形']];const [q,a]=qs[i];return choose('图形标签',q+'？',a,['梯形','三角形','平行四边形','长方形','正方形'].filter(v=>v!==a).slice(0,2),'根据对边是否平行、角是否为直角来判断。');}),g4[5],...g4.slice(6)
];
const g4now=curriculum[3];
curriculum[3]=g4now.map(u=>u.theme!=='加法模型和乘法模型'?u:unit('两种补给模型','加法模型和乘法模型','上册',i=>{
 const common={
  coachHints:['先判断题目是在合并两个不同部分，还是重复相同数量。','“一共”不一定用加法，还要看各部分是否是相同数量的几份。'],
  evidence:{knowledgeId:'pep-math-g4-u4-additive-multiplicative-models',objective:'区分合并、相差和等量重复等数量关系，能选择加法或乘法模型解释并解决真实问题。',role:(['understand','model','fluency','diagnose','apply','transfer'] as const)[i],prerequisites:['三位数加法','两位数乘一位数','读懂每份数和份数'],misconceptions:['看到“一共”就一律相加','把份数和每份数直接相加','忽略题目中额外增加的不同部分'],reviewed:false}
 };
 const tasks:Task[]=[
  {kind:'choice',title:'关系侦察员',goal:'四（1）班有 28 人，四（2）班有 32 人，求两个班一共多少人。应该选择哪种模型？',options:['两个不同部分合并，用 28 + 32','每班人数相同，用 28 × 32','求相差人数，用 32 − 28'],target:0,hint:'这是把两个班的人数合并，并没有说每班同样多。',explanation:'两个不同部分合并，用加法模型：28 + 32 = 60（人）。'},
  {kind:'groups',title:'方阵搭建师',goal:'观众排成 4 排，每排 6 人。摆出这个相同数量重复 4 次的模型。',groups:4,target:6,hint:'每一排人数相同，4 是排数，6 是每排人数。',explanation:'4 个 6 相加可以写成 4 × 6 = 24。'},
  {kind:'number',title:'模型计算站',goal:'仓库原有 125 箱材料，又运来 87 箱。现在共有多少箱？',target:212,answerUnit:'箱',visual:bar(125,87,['原有','运来']),hint:'两个不同来源的数量合并，用加法。',explanation:'125 + 87 = 212（箱）。'},
  {kind:'choice',title:'错模修理铺',goal:'6 个盒子，每盒 8 支笔。小北列式 6 + 8 = 14，怎样修正？',options:['相同数量重复 6 次，用 6 × 8 = 48','盒子和笔是两部分，用 6 + 8 = 14','求盒子比笔少多少，用 8 − 6 = 2'],target:0,hint:'“每盒 8 支”说明每一份数量相同，共有 6 份。',explanation:'这是 6 个 8，用乘法模型，6 × 8 = 48（支）。'},
  {kind:'number',title:'研学车队长',goal:'4 辆车，每辆坐 35 名学生，另有 12 名老师。一共有多少人？',target:152,answerUnit:'人',visual:bar(140,12,['学生','老师']),hint:'先用乘法求学生人数，再把老师作为另一部分合并。',explanation:'35 × 4 + 12 = 140 + 12 = 152（人）。'},
  {kind:'choice',title:'模型迁移桥',goal:'下面哪组判断全部正确？',options:['“甲地35棵、乙地28棵”用加法；“7行、每行9棵”用乘法','两种情境都用加法，因为都问一共','两种情境都用乘法，因为数字都大于1'],target:0,hint:'不同部分合并与相同数量重复，属于不同模型。',explanation:'35和28是两个不同部分；7行每行9棵是9重复7次，应分别用加法和乘法。'}
 ];
 return {...tasks[i],...common,evidence:{...common.evidence,role:common.evidence.role}};
}));
const g5=curriculum[4];
curriculum[4]=[
 unit('积木观测台','观察简单组合体','上册',i=>number('积木数量',`底层排着${3+i}个小正方体，上层再放2个（没有隐藏积木），共几个？`,5+i,`${3+i}+2=${5+i}个。`,'个')),
 g5[0],g5[1],
 unit('移动图案桥','图形的运动','上册',i=>number('平移距离',`小旗从方格第${i+1}列平移到第${i+5}列，向右移动几格？`,4,`终点列数−起点列数=${i+5}−${i+1}=4。`,'格')),
 unit('字母密码屋','用字母表示数和数量关系','上册',i=>number('解开字母密码',`每包有a颗星，装3包。当a=${i+4}时，3a是多少？`,3*(i+4),`把a换成${i+4}，3×${i+4}=${3*(i+4)}。`)),
 g5[3],g5[4],...g5.slice(6,11)
];
const g5now=curriculum[4];
curriculum[4]=g5now.map(u=>u.theme!=='小数乘法'?u:unit('小数采购站','小数乘法','上册',i=>{
 const common={
  coachHints:['先按整数乘法算出积，再根据因数的小数位数点小数点。','算完先估一估，检查积的大小是否合理。'],
  evidence:{knowledgeId:'pep-math-g5-u1-decimal-multiplication',objective:'理解小数乘法与整数乘法的联系，能确定积的小数点位置，并用估算检查结果、解决实际问题。',role:(['understand','model','fluency','diagnose','apply','transfer'] as const)[i],prerequisites:['整数乘法','小数的意义','小数位值'],misconceptions:['只数积的小数位而不看因数','小数点位置照抄其中一个因数','不估算导致积扩大或缩小10倍'],reviewed:false}
 };
 const tasks:Task[]=[
  {kind:'choice',title:'小数点导航员',goal:'计算 1.2 × 3，先算 12 × 3 = 36，积应该写成多少？',options:['3.6','36','0.36'],target:0,hint:'1.2 是 12 个十分之一，36 个十分之一就是 3.6。',explanation:'一个因数有 1 位小数，积从右边起数 1 位点小数点，得到 3.6。'},
  {kind:'number',title:'整数迁移站',goal:'2.4 × 5 等于多少？',target:120,scale:10,answerUnit:'',hint:'先算 24 × 5 = 120，再缩小到原来的十分之一。',explanation:'2.4 × 5 = 12.0，也就是 12。'},
  {kind:'number',title:'积的位值塔',goal:'0.8 × 6 等于多少？',target:48,scale:10,answerUnit:'',visual:bar(8,6,['8个十分之一','重复6次']),hint:'8 个十分之一乘 6，得到 48 个十分之一。',explanation:'0.8 × 6 = 4.8。'},
  {kind:'choice',title:'错点修理铺',goal:'小北算 3.5 × 4 = 140。怎样修正？',options:['35 × 4 = 140，再把积缩小10倍，得14','小数点不影响结果，140正确','把140缩小100倍，得1.4'],target:0,hint:'3.5 是 35 的十分之一，积也应是 140 的十分之一。',explanation:'3.5 × 4 = 14。估算 3.5 接近 4，4 × 4 = 16，也能判断 140 明显过大。'},
  {kind:'number',title:'文具采购员',goal:'每盒彩笔 6.5 元，买 4 盒需要多少元？',target:260,scale:10,answerUnit:'元',visual:bar(65,4,['每盒6.5元','4盒']),hint:'单价 × 数量 = 总价，结果可以用 7 × 4 估算检查。',explanation:'6.5 × 4 = 26.0（元），即 26 元。'},
  {kind:'choice',title:'估算检查桥',goal:'7.9 × 5 的准确结果和合理估算是哪一组？',options:['准确结果39.5，约等于40','准确结果395，约等于400','准确结果3.95，约等于4'],target:0,hint:'7.9 接近 8，8 × 5 = 40，准确结果应接近40。',explanation:'79 × 5 = 395，再点一位小数得39.5；估算结果约40。'}
 ];
 return {...tasks[i],...common,evidence:{...common.evidence,role:common.evidence.role}};
}));
const g5withMultiply=curriculum[4];
curriculum[4]=g5withMultiply.map(u=>u.theme!=='小数除法'?u:unit('小数分享港','小数除法','上册',i=>{
 const common={
  coachHints:['除数是整数时，商的小数点要和被除数的小数点对齐。','除数是小数时，可以把被除数和除数同时扩大相同倍数。'],
  evidence:{knowledgeId:'pep-math-g5-u2-decimal-division',objective:'理解小数除法的算理，能处理除数是整数或小数的计算，并用乘法和估算检查商。',role:(['understand','model','fluency','diagnose','apply','transfer'] as const)[i],prerequisites:['整数除法','小数位值','商不变规律','小数乘法'],misconceptions:['只移动除数的小数点','商的小数点与被除数错位','把商扩大10倍后没有检查'],reviewed:false}
 };
 const tasks:Task[]=[
  {kind:'choice',title:'十分之一分装员',goal:'4.8 ÷ 4 表示把 48 个十分之一平均分成4份，结果是多少？',options:['1.2','12','0.12'],target:0,hint:'48个十分之一分成4份，每份12个十分之一。',explanation:'12个十分之一是1.2，所以4.8 ÷ 4 = 1.2。'},
  {kind:'number',title:'小数商定位站',goal:'7.2 ÷ 3 等于多少？',target:24,scale:10,answerUnit:'',hint:'72个十分之一平均分成3份，每份24个十分之一。',explanation:'7.2 ÷ 3 = 2.4，商的小数点与被除数对齐。'},
  {kind:'number',title:'除数变整数桥',goal:'5.6 ÷ 0.8 等于多少？',target:7,answerUnit:'',hint:'被除数和除数同时扩大10倍，变成56 ÷ 8。',explanation:'5.6 ÷ 0.8 = 56 ÷ 8 = 7，商不变。'},
  {kind:'choice',title:'错商修理铺',goal:'小北算 6.3 ÷ 3 = 21。怎样修正？',options:['63个十分之一÷3=21个十分之一，商是2.1','6.3扩大10倍后商也保持21','把21缩小100倍，商是0.21'],target:0,hint:'21表示21个十分之一，而不是21个一。',explanation:'6.3 ÷ 3 = 2.1。用2.1 × 3 = 6.3可以验算。'},
  {kind:'number',title:'果汁单价员',goal:'6瓶果汁共12.6元，平均每瓶多少元？',target:21,scale:10,answerUnit:'元',visual:bar(126,6,['总价12.6元','6瓶']),hint:'总价 ÷ 数量 = 单价。',explanation:'12.6 ÷ 6 = 2.1（元），验算2.1 × 6 = 12.6。'},
  {kind:'choice',title:'估算验算桥',goal:'19.2 ÷ 4 的结果和验算是哪一组？',options:['商4.8，因为4.8 × 4 = 19.2','商48，因为48 × 4 = 192','商0.48，因为0.48 × 4 = 1.92'],target:0,hint:'19.2接近20，20 ÷ 4 = 5，商应接近5。',explanation:'19.2 ÷ 4 = 4.8，乘法验算和估算都合理。'}
 ];
 return {...tasks[i],...common,evidence:{...common.evidence,role:common.evidence.role}};
}));
const g6now=curriculum[5];
curriculum[5]=g6now.map(u=>u.theme!=='分数乘法'?u:unit('分数采集队','分数乘法','上册',i=>{
 const common={
  coachHints:['求一个数的几分之几，可以用这个数乘分数。','先用分母表示平均分的份数，再用分子表示要取的份数。'],
  evidence:{knowledgeId:'pep-math-g6-u2-fraction-multiplication',objective:'理解分数乘法表示求一个数的几分之几，能用分数乘法解决实际问题并诊断分子、分母作用混淆。',role:(['understand','model','fluency','diagnose','apply','transfer'] as const)[i],prerequisites:['分数的意义','整数乘法','平均分'],misconceptions:['把分子和分母作用颠倒','用总量除以分子再乘分母','只计算取一份而漏乘分子'],reviewed:false}
 };
 const tasks:Task[]=[
  {kind:'choice',title:'分数意义侦察员',goal:'求 24 的 2/3，哪一步正确解释了分母3和分子2？',options:['先把24平均分成3份，再取2份','先把24平均分成2份，再取3份','把24、2、3直接相加'],target:0,hint:'分母表示平均分成几份，分子表示取几份。',explanation:'24 ÷ 3 × 2 = 16，所以 24 × 2/3 = 16。'},
  {kind:'tiles',title:'方格建模台',goal:'12格花田的 3/4 需要点亮，请点亮对应格数。',cells:12,target:9,cols:4,hint:'12格平均分4份，每份3格，取其中3份。',explanation:'12 ÷ 4 × 3 = 9，12 的 3/4 是 9。'},
  {kind:'number',title:'分数计算站',goal:'30 颗星的 2/5 是多少颗？',target:12,answerUnit:'颗',hint:'先求 30 的五分之一，再取2份。',explanation:'30 ÷ 5 × 2 = 12，也可以写成 30 × 2/5 = 12。'},
  {kind:'choice',title:'分子分母修理铺',goal:'小北算 18 的 2/3 时列成 18 ÷ 2 × 3 = 27。怎样修正？',options:['18 ÷ 3 × 2 = 12','18 ÷ 2 × 3 = 27，不用修改','18 − 3 × 2 = 12'],target:0,hint:'应按分母3平均分，再按分子2取份数。',explanation:'18平均分3份，每份6，取2份是12。'},
  {kind:'number',title:'阅读计划员',goal:'一本书有 48 页，今天读了全书的 3/8。今天读了多少页？',target:18,answerUnit:'页',visual:bar(48,18,['全书','已读']),hint:'总页数 × 已读分率 = 已读页数。',explanation:'48 × 3/8 = 48 ÷ 8 × 3 = 18（页）。'},
  {kind:'choice',title:'情境迁移桥',goal:'40 千克种子的 3/5 用于春播。哪组算式和结果正确？',options:['40 × 3/5 = 24千克','40 ÷ 3 × 5 = 200/3千克','40 − 3/5 = 39又2/5千克'],target:0,hint:'求总量的几分之几，用总量乘这个分数。',explanation:'40平均分5份，每份8千克，取3份是24千克。'}
 ];
 return {...tasks[i],...common,evidence:{...common.evidence,role:common.evidence.role}};
}));
const g6withMultiply=curriculum[5];
curriculum[5]=g6withMultiply.map(u=>u.theme!=='分数除法'?u:unit('分数寻源岛','分数除法','上册',i=>{
 const common={
  coachHints:['已知一个数的几分之几是多少，求原数，可以用已知量除以这个分数。','除以一个非零分数，等于乘这个分数的倒数。'],
  evidence:{knowledgeId:'pep-math-g6-u3-fraction-division',objective:'理解分数除法与分数乘法的逆运算关系，能用乘倒数、方程和数量关系解决已知部分求整体的问题。',role:(['understand','model','fluency','diagnose','apply','transfer'] as const)[i],prerequisites:['分数乘法','倒数','整体与部分关系'],misconceptions:['除以分数时乘原分数而不是倒数','把已知部分直接乘分率','没有检验求出的整体是否大于对应部分'],reviewed:false}
 };
 const tasks:Task[]=[
  {kind:'choice',title:'整体寻源员',goal:'12 盏灯占全部的 3/4，求全部灯数。哪一个数量关系正确？',options:['全部灯数 × 3/4 = 12','12 × 3/4 = 全部灯数','全部灯数 + 3/4 = 12'],target:0,hint:'部分量 = 整体量 × 对应分率。',explanation:'设全部有x盏，x × 3/4 = 12，所以x = 12 ÷ 3/4 = 16。'},
  {kind:'number',title:'倒数变换站',goal:'12 ÷ 3/4 等于多少？',target:16,answerUnit:'',hint:'除以3/4，改成乘它的倒数4/3。',explanation:'12 ÷ 3/4 = 12 × 4/3 = 16。'},
  {kind:'number',title:'分数除法计算塔',goal:'8 ÷ 2/3 等于多少？',target:12,answerUnit:'',hint:'把除以2/3改成乘3/2，再约分。',explanation:'8 ÷ 2/3 = 8 × 3/2 = 12。'},
  {kind:'choice',title:'倒数修理铺',goal:'小北算 10 ÷ 2/5 = 10 × 2/5 = 4。怎样修正？',options:['应乘2/5的倒数5/2，结果是25','原计算正确，结果就是4','只把10变成倒数1/10'],target:0,hint:'除数变乘数时，要把除数变成倒数。',explanation:'10 ÷ 2/5 = 10 × 5/2 = 25。用25 × 2/5 = 10可以验算。'},
  {kind:'number',title:'星路测绘员',goal:'已经走了18千米，是全程的3/5。全程多少千米？',target:30,answerUnit:'千米',visual:bar(30,18,['全程','已走3/5']),hint:'已走路程 ÷ 已走分率 = 全程。',explanation:'18 ÷ 3/5 = 18 × 5/3 = 30（千米）。'},
  {kind:'choice',title:'方程迁移桥',goal:'一个数的2/3是20，下面哪组方程和结果正确？',options:['2/3x = 20，x = 30','x ÷ 2/3 = 20，x = 40/3','x − 2/3 = 20，x = 20又2/3'],target:0,hint:'“一个数的2/3”写成2/3乘这个数。',explanation:'2/3x = 20，两边除以2/3，x = 20 × 3/2 = 30。'}
 ];
 return {...tasks[i],...common,evidence:{...common.evidence,role:common.evidence.role}};
}));
// Lower-book selection follows the editions currently linked by the publisher.
const g1=curriculum[0];curriculum[0]=[...g1.slice(0,6),g1[10],g1[6],g1[7],{...g1[9],theme:'100以内的口算加、减法'},
 unit('笔算小修理铺','100以内的笔算加、减法','下册',i=>number('两位数合并',`材料有${26+i*3}件，又来${17+i}件，共几件？`,43+i*4,`${26+i*3}+${17+i}=${43+i*4}。`,'件')),
 unit('购物小侦探','数量间的加减关系 · 欢乐购物街','下册',i=>number('找零钱',`带20元，买一份${8+i}元的材料，应找回几元？`,12-i,`20−${8+i}=${12-i}。`,'元'))];
const g1now=curriculum[0];
curriculum[0]=g1now.map(u=>u.theme!=='20以内的进位加法'?u:unit('凑十过小桥','20以内的进位加法','上册',i=>{
 const common={
  coachHints:['先看第一个数还差几能凑成 10。','把第二个数拆成“补足10”和“剩下”的两部分。'],
  evidence:{knowledgeId:'pep-math-g1-u5-carry-addition',objective:'理解凑十法，能计算20以内进位加法，并能解释拆数、补十和剩余合并的过程。',role:(['understand','model','fluency','diagnose','apply','transfer'] as const)[i],prerequisites:['10的组成','10以内加法','数的分与合'],misconceptions:['拆出的数不能补足10','凑成10后漏加剩余部分','把加法误算成减法'],reviewed:false}
 };
 const tasks:Task[]=[
  {kind:'choice',title:'凑十拆分师',goal:'计算 8 + 5 时，为了先把 8 凑成 10，应该怎样拆分 5？',options:['把 5 分成 2 和 3','把 5 分成 1 和 4','不用拆，把 8 变成 9'],target:0,hint:'8 还差 2 就是 10。',explanation:'把 5 分成 2 和 3，先算 8 + 2 = 10，再算 10 + 3 = 13。'},
  {kind:'cargo',title:'十格补给舱',goal:'9 颗星先补 1 颗装满十格舱，再把剩下 4 颗放旁边。请装出 9 + 5 的总数。',target:14,units:[1,10],maxBlocks:5,explanation:'把 5 分成 1 和 4，9 + 1 = 10，10 + 4 = 14。',hint:'先装一个十，再补上剩下的 4 个一。'},
  {kind:'number',title:'凑十计算站',goal:'9 + 6 等于多少？',target:15,answerUnit:'颗',visual:bar(9,6,['原有9颗','又来6颗']),hint:'把 6 分成 1 和 5，先让 9 凑成 10。',explanation:'9 + 1 = 10，10 + 5 = 15，所以 9 + 6 = 15。'},
  {kind:'choice',title:'漏数修理铺',goal:'小北算 7 + 6：先用 3 把 7 凑成 10，却把答案写成 12。应该怎样修正？',options:['6 分成 3 和 3，10 + 3 = 13','6 分成 2 和 4，10 + 2 = 12','7 − 6 = 1'],target:0,hint:'从 6 里拿走 3 去补十，还剩几个？',explanation:'6 分成 3 和 3，7 + 3 = 10，还要加剩下的 3，答案是 13。'},
  {kind:'number',title:'校车集合点',goal:'第一辆校车有 8 位同学，第二辆有 7 位，一共有多少位？',target:15,answerUnit:'位',visual:bar(8,7,['第一辆','第二辆']),hint:'把 7 分成 2 和 5，先让 8 凑成 10。',explanation:'8 + 2 = 10，10 + 5 = 15，一共有 15 位同学。'},
  {kind:'choice',title:'方法迁移桥',goal:'哪一步能正确说明 9 + 8 = 17？',options:['8 分成 1 和 7，9 + 1 + 7 = 17','8 分成 2 和 6，9 + 2 + 6 = 17','9 和 8 都减 1，得到 15'],target:0,hint:'9 只差 1 就能凑成 10。',explanation:'从 8 中拿 1 补给 9，得到 10，剩下 7，所以 10 + 7 = 17。'}
 ];
 return {...tasks[i],...common,evidence:{...common.evidence,role:common.evidence.role}};
}));
const g2now=curriculum[1];curriculum[1]=[...g2now.slice(0,6),{...g2[4],semester:'下册',theme:'时间在哪里'},g2[7],
 unit('乘除关系岛','数量间的乘除关系','下册',i=>number('反向补给',`每箱${3+i%4}件，合计${(3+i%4)*(4+i)}件，一共几箱？`,4+i,`总件数÷每箱件数=${4+i}。`,'箱')),
 g2[8],unit('万以内运输','万以内数的加法和减法','下册',i=>number('补给结算',`${1230+i*110}件材料送走${410+i*10}件，还剩几件？`,820+i*100,`${1230+i*110}−${410+i*10}=${820+i*100}。`,'件')),
 unit('数学连环画','复习与关联','下册',i=>number('连续补给',`每箱4件，来了${4+i}箱，再送出3件，还剩几件？`,4*(4+i)-3,`4×${4+i}−3=${4*(4+i)-3}。`,'件'))];
const g3=curriculum[2];curriculum[2]=[...g3.slice(0,6),
 unit('运动观察岛','生活中的运动现象','下册',i=>choose('运动标签',`${['小窗沿直轨向右推开','风车叶片绕中心转动','小车沿直路向前移动','钟表指针绕中心转动','电梯沿竖直方向升起','旋转木马绕中心转动'][i]}，主要是什么运动？`,i%2?'旋转':'平移',i%2?['平移','静止']:['旋转','静止'],'平移不改变朝向；旋转绕固定点或轴转动。')),
 g3[7],g3[9],g3[10],
 unit('数据与日期营','数据的收集与整理 · 年月日','下册',i=>([
  number('调查整理','选择苹果的6人，选择梨的4人，一共调查几人？',10,'6+4=10（人）。','人',bar(6,4,['选苹果','选梨'])),
  number('分类合计','晴天记录7次，雨天记录6次，一共记录多少次？',13,'7+6=13（次）。','次',bar(7,6,['晴天','雨天'])),
  number('比较数据','步行上学8人，乘车上学5人，步行的比乘车的多几人？',3,'8−5=3（人）。','人',bar(8,5,['步行','乘车'])),
  choose('月份天数','4月开展观测，这个月有几天？','30天',['28天','31天'],'四、六、九、十一月有30天。'),
  choose('闰年诊断','2024年是闰年，这一年的2月有多少天？','29天',['28天','30天'],'公历年份是4的倍数时通常是闰年；整百年份还要是400的倍数。2024年2月有29天。'),
  number('季度规划','7月、8月、9月一共有多少天？',92,'7月31天，8月31天，9月30天，31+31+30=92（天）。','天')
 ] as Task[])[i]),
 unit('小数初见岛','小数的初步认识','下册',i=>number('零钱读数',`${i+1}元${i+2}角，用小数表示多少元？`,(i+1)*10+i+2,`元写在整数部分，角写在十分位。`,'元',undefined,10))];
const g3now=curriculum[2];
curriculum[2]=g3now.map(u=>u.theme!=='混合运算'?u:unit('混合能源站','混合运算','上册',i=>{
 const common={
  coachHints:['没有括号时，先算乘除，再算加减。','每算完一步，都要把没有参与计算的数和符号照写下来。'],
  evidence:{knowledgeId:'pep-math-g3-u2-mixed-operations',objective:'掌握两级混合运算顺序，能逐步计算、诊断错误，并把两步生活问题写成综合算式。',role:(['understand','model','fluency','diagnose','apply','transfer'] as const)[i],prerequisites:['表内乘除法','两位数加减法','一步问题的数量关系'],misconceptions:['无括号算式一律从左往右算','第一步算完后漏写其他数或符号','把情境中的先后叙述直接当作运算顺序'],reviewed:false}
 };
 const tasks:Task[]=[
  {kind:'choice',title:'顺序指挥官',goal:'计算 24 − 3 × 4，第一步应该算什么？',options:['先算 3 × 4','先算 24 − 3','把 24 和 4 相加'],target:0,hint:'减法和乘法同时出现时，乘法先行。',explanation:'先算 3 × 4 = 12，再算 24 − 12 = 12。'},
  {kind:'cargo',title:'两步补给舱',goal:'24 件材料平均放进 6 箱，每箱的数量再加 18。请装出最后的数量。',target:22,units:[1,10],maxBlocks:4,hint:'先算 24 ÷ 6，再把商与 18 相加。',explanation:'24 ÷ 6 = 4，4 + 18 = 22；综合算式是 24 ÷ 6 + 18。'},
  {kind:'number',title:'运算接力站',goal:'36 ÷ 4 + 7 的结果是多少？',target:16,answerUnit:'',hint:'先算除法 36 ÷ 4，再加 7。',explanation:'36 ÷ 4 = 9，9 + 7 = 16。'},
  {kind:'choice',title:'错序修理铺',goal:'小北把 30 − 12 ÷ 3 算成了 6。怎样修正？',options:['先算 12 ÷ 3 = 4，再算 30 − 4 = 26','先算 30 − 12 = 18，再算 18 ÷ 3 = 6','把 30、12、3 全部相加'],target:0,hint:'除法和减法同时出现时，要先完成除法。',explanation:'正确顺序是先除后减，30 − 12 ÷ 3 = 30 − 4 = 26。'},
  {kind:'number',title:'研学签到台',goal:'5 个小组，每组 6 人，后来有 8 人先离开。现在还有多少人？',target:22,answerUnit:'人',visual:bar(30,8,['原有人数','离开人数']),hint:'先求 5 组一共有多少人，再减去离开的 8 人。',explanation:'5 × 6 − 8 = 30 − 8 = 22（人）。'},
  {kind:'choice',title:'算式翻译桥',goal:'每盒彩笔 4 支，买了 7 盒，又收到 5 支。哪一个算式能求总数？',options:['4 × 7 + 5','4 + 7 × 5','4 ×（7 + 5）'],target:0,hint:'先求 7 盒的支数，再加单独收到的 5 支。',explanation:'7 盒共有 4 × 7 = 28 支，再加 5 支，综合算式是 4 × 7 + 5。'}
 ];
 return {...tasks[i],...common,evidence:{...common.evidence,role:common.evidence.role}};
}));
const lowerSources=['1221001102241','1221001202251','1221001302251','1221001402131','1221001502141','1221001602141'];
// 2026 秋季已完成各年级上册替换；一至三年级下册已有当前修订版依据。
// 四至六年级下册仍保留旧版主题供练习，不能冒充 2027 春季新版逐单元同步。
for(let g=0;g<6;g++)for(const u of curriculum[g])u.verified=u.semester==='上册'||g<3;
function levelAnswer(l:Task){if(l.kind==='choice'||l.kind==='listen')return l.options?.[l.target];if(['number','cargo'].includes(l.kind))return String(l.target/(l.scale||1))+(l.answerUnit||'');if(l.kind==='groups')return `每组${l.target}个`;if(l.kind==='tiles')return `${l.target}格`;return undefined;}
function classifyChoice(l:Level):Level|undefined{if(l.kind!=='choice'&&l.kind!=='listen')return;const correct=(l.options||[])[l.target],parts=l.explanation.split(/[，；。]/).map(s=>s.trim()).filter(Boolean).slice(0,3);const answer=(parts.length>=2?parts:[l.goal.slice(0,80),`正确判断：${correct}`]).map(s=>s.slice(0,96));return {...l,kind:'sentence',title:'推理步骤排序',goal:`整理判断依据：${l.goal}`.slice(0,150),words:[...answer].reverse(),answer,hint:'先说明题意或数量关系，再写判断和结果。'};}
function resultChoice(l:Level):Level|undefined{const answer=levelAnswer(l);if(!answer||l.kind==='choice'||l.kind==='listen')return;const numeric=l.target/(l.scale||1),unit=l.answerUnit||'',alternatives=Number.isFinite(numeric)?[`${numeric+1}${unit}`,`${numeric===0?2:numeric-1}${unit}`]:['多1','少1'];const options=[answer,...alternatives].filter((v,i,a)=>a.indexOf(v)===i).slice(0,3);if(options.length<2)return;return {...l,kind:'choice',title:'结果辨析站',goal:`${l.goal} 请选择正确结果。`,options,target:0,hint:'先独立计算或操作，再比较三个结果。'};}
function diagnoseResult(l:Level):Level|undefined{const correct=levelAnswer(l);if(!correct||l.kind==='choice'||l.kind==='listen')return;const numeric=l.target/(l.scale||1),unit=l.answerUnit||'',wrong=`${numeric+1}${unit}`;return {...l,kind:'choice',title:'错解诊断站',goal:`小北把这道题的结果写成“${wrong}”。请选择正确修正结果：${l.goal}`.slice(0,150),options:[correct,wrong,'条件不足，不能判断'],target:0,hint:'先找清数量关系，再检查小北的结果与正确结果相差在哪里。'};}
function transferReasoning(l:Level):Level|undefined{if(l.kind==='choice'||l.kind==='listen')return;let answer=l.explanation.split(/[，；。]/).map(s=>s.trim()).filter(Boolean).slice(0,3);if(answer.length<2)answer=[l.hint.slice(0,96),l.explanation.slice(0,96)].filter((s,i,a)=>!!s&&a.indexOf(s)===i);if(answer.length<2)return;answer=answer.map(s=>s.slice(0,96));return {...l,kind:'sentence',title:'迁移推理链',goal:`迁移说明：${l.goal}`.slice(0,145),words:[...answer].reverse(),answer,hint:'按“先找关系、再计算、最后写结论”的顺序整理。'};}
function diversify(levels:Level[],theme:string){const originalKinds=new Set(levels.map(l=>l.kind));if(originalKinds.size<3){const seen=new Set<string>(),pairs:[string,string][]=[];for(const l of levels){const raw=levelAnswer(l);if(raw){let answer=raw;if(seen.has(answer))answer=`${raw}（${l.title}）`;if(!seen.has(answer)){seen.add(answer);pairs.push([l.goal.slice(0,96),answer.slice(0,96)]);}}if(pairs.length===3)break;}if(pairs.length>=2){const old=levels[1];levels[1]={...old,kind:'match',title:'单元知识配对',goal:`把“${theme}”的题目情境和对应结果配成对。`,pairs,target:0,options:undefined,words:undefined,answer:undefined,units:undefined,groups:undefined,cells:undefined,cols:undefined,visual:undefined,hint:'先点左侧题目，再点右侧对应结果。',explanation:pairs.map(pair=>pair.join(' → ')).join('；')};}}if(new Set(levels.map(l=>l.kind)).size<3){const alternate=classifyChoice(levels[2])||resultChoice(levels[2]);if(alternate)levels[2]=alternate;}const onlyKind=[...originalKinds][0];if(originalKinds.size===1&&!['choice','listen'].includes(onlyKind)){const diagnose=diagnoseResult(levels[3]),transfer=transferReasoning(levels[5]);if(diagnose)levels[3]=diagnose;if(transfer)levels[5]=transfer;}if(levels.filter(l=>l.kind==='choice').length>levels.length/2){const at=[4,5,3,2].find(i=>levels[i]?.kind==='choice');if(at!==undefined){const alternate=classifyChoice(levels[at]);if(alternate)levels[at]=alternate;}}if(originalKinds.size===1&&onlyKind==='choice'&&levels[5].kind==='choice'){const oldGoal=levels[5].goal,transfer=classifyChoice(levels[5]);if(transfer)levels[5]={...transfer,title:'迁移推理链',goal:`迁移解释：${oldGoal}`.slice(0,150)};}return levels;}
export function curriculumChapters():Chapter[]{return curriculum.flatMap((units,g)=>units.map((u,index)=>{
 const grade=g+1,id=`math.g${grade}.c${index+7}`;
 const unitNumber=units.slice(0,index+1).filter(x=>x.semester===u.semester).length;
 const levels:Level[]=Array.from({length:6},(_,i)=>{const l=u.make(i);return {...l,id:`${id}.l${i+1}`,stage:i<2?'warmup' as const:i<4?'practice' as const:'challenge' as const,coachHints:[l.hint,l.explanation],evidence:l.evidence||{knowledgeId:`pep-math-g${grade}-${u.semester}-u${unitNumber}`,objective:`理解并应用“${u.theme}”，能完成计算或操作，并解释方法、检查结果和解决简单真实问题。`,role:evidenceRoles[i],prerequisites:[`${grade}年级前序相关知识`,'读懂数量、关系和单位'],misconceptions:[misconceptionFor(l.kind),'得到答案后不作估算、逆运算或情境检查'],reviewed:false}};});
 diversify(levels,u.theme);
 return {id,subject:'math' as const,grade,title:u.title,topic:u.theme,art:index%3===0?'island':index%3===1?'garden':'planet',alignment:u.verified?'verified-theme' as const:'theme' as const,
 curriculum:{semester:u.semester,theme:u.theme,order:index,source:'https://book.pep.com.cn/'+(u.semester==='上册'?sources[g]:lowerSources[g])+'/',verified:!!u.verified,publisher:'人民教育出版社',edition:u.verified?'依据2022年版课标修订教材':'旧版主题练习，待新版目录核对',volume:`${grade}年级${u.semester}`,unit:u.verified?`第${unitNumber}单元 ${u.theme}`:`待核对专题 ${u.theme}`,unitNumber:u.verified?unitNumber:undefined,unitType:u.verified?'textbook':'theme',objectives:[`理解${u.theme}的核心概念或数量关系`,`用计算、操作或图示解决${u.theme}的基础问题`,`辨析常见错误，并在新情境中迁移应用`],reviewStatus:(g===0&&u.theme==='20以内的进位加法')||(g===1&&['1～6的表内乘法','1～6的表内除法'].includes(u.theme))||(g===2&&u.theme==='混合运算')||(g===3&&u.theme==='加法模型和乘法模型')||(g===4&&['小数乘法','小数除法'].includes(u.theme))||(g===5&&['分数乘法','分数除法'].includes(u.theme))?'editor-reviewed':'draft'},
 levels};
}));}
