// Editorial mapping only. Never changes existing task IDs or learning records.
export const textbook={
 id:'pep-math-7-upper-2024-candidate',publisher:'人民教育出版社',edition:'2024 修订版（目标版本，印次待核对）',grade:7,semester:'上册',subject:'math',
 verificationStatus:'partial-source-check',reviewStatus:'draft',
 sources:[{id:'pep-geometry',url:'https://www.pep.com.cn/xw/zt/xkzt/csazy/csa7s/',provider:'人民教育出版社',verifiedAt:'2026-11-01',scope:'仅确认 6.1、6.2 章节标签；页面未注明印次',evidence:'docs/junior/sources/pep-geometry-2026-11-01.md'}],
 chapters:[
  {id:'c1',title:'有理数',gaps:['正负数及零','有理数分类','分数与小数在数轴上的表示','相反数','绝对值','大小比较']},
  {id:'c2',title:'有理数的运算',gaps:['加减运算法则及解释','乘除法与符号','乘方与括号','混合运算','科学记数法与近似数（目录待核对）']},
  {id:'c3',title:'代数式',gaps:['字母表示数','从情境列代数式','代数式求值']},
  {id:'c4',title:'整式的加减',gaps:['单项式与多项式','同类项','合并同类项','去括号']},
  {id:'c5',title:'一元一次方程',gaps:['自主列方程','等式性质操作','解法解释','实际问题与检验']},
  {id:'c6',title:'几何图形初步',gaps:['立体与平面图形','展开与观察','直线射线线段','线段比较与运算','角的度量与关系']}
 ].map(c=>({...c,verificationStatus:'pending-original-toc',sections:[]})),
 sections:[
  {id:'6.1',chapter:'c6',title:'几何图形',verificationStatus:'publisher-label-confirmed',sourceId:'pep-geometry',page:null},
  {id:'6.2',chapter:'c6',title:'直线、射线、线段',verificationStatus:'publisher-label-confirmed',sourceId:'pep-geometry',page:null}
 ],
 mappings:[
 {unitId:'m7-classify',chapter:'c1',taskIds:['m7-classify.1','m7-classify.2','m7-classify.3','m7-classify.4'],status:'candidate-theme-only',coverage:'正负零、整数分数两个维度归档，含等值表示',missing:['更多数值变式','文字解释教学复核']},
  {unitId:'m7-rational-position',chapter:'c1',taskIds:['m7-rational-position.1','m7-rational-position.2','m7-rational-position.3','m7-rational-position.4'],status:'candidate-theme-only',coverage:'半单位和四分之一单位定位、相反数操作与解释',missing:['任意分母的分数表示','有理数分类','解释作品的教学复核']},
  {unitId:'m7-absolute-distance',chapter:'c1',taskIds:['m7-absolute-distance.1','m7-absolute-distance.2','m7-absolute-distance.3','m7-absolute-distance.4'],status:'candidate-theme-only',coverage:'负小数与负分数的绝对值、零的距离、大小与距离辨析',missing:['正数绝对值的系统练习','绝对值分类归纳','解释作品的教学复核']},
  {unitId:'m7-order',chapter:'c1',taskIds:['m7-order.1','m7-order.2','m7-order.3','m7-order.4'],status:'candidate-theme-only',coverage:'两数比较、跨零温度与负分数比较',missing:['多有理数排序','相等关系与等值表示','解释作品的教学复核']},
  {unitId:'m7-numberline',chapter:'c2',taskIds:['m7-numberline.1','m7-numberline.2','m7-numberline.3','m7-numberline.4'],status:'candidate-theme-only',coverage:'整数位置变化与路程；不是有理数全章覆盖',missing:['分数和小数','运算法则解释','相反数与绝对值概念']},
  {unitId:'m7-equation',chapter:'c5',taskIds:['m7-equation.1','m7-equation.2','m7-equation.3','m7-equation.4'],status:'candidate-theme-only',coverage:'给定方程的分步等价求解；未包含自主建模',missing:['自主列方程','等式性质操作','实际意义检验']}
 ]
};
