// Montessori-inspired digital practice: isolate one property, show a control of
// error, and let children repeat freely. This does not replace physical materials.
import {PLAYFUL_ACTIVITIES,PLAYFUL_LESSONS,PLAYFUL_NAMES} from './playful.js';
export const EXPLORATIONS={
 inset:{name:'形状找小窝',theme:'blue',symbol:'shape-circle',voice:'inset'},
 rods:{name:'长短小阶梯',theme:'peach',symbol:'rod-5',voice:'rods'},
 colors:{name:'色板找朋友',theme:'green',symbol:'tile-coral',voice:'colors'},
 beads:{name:'规律小项链',theme:'peach',symbol:'bead-circle',voice:'beads'},
 table:{name:'小小餐桌长',theme:'blue',symbol:'plate',voice:'table'},
 sequence:{name:'故事排排队',theme:'green',symbol:'butterfly',voice:'sequence'},
 ...PLAYFUL_ACTIVITIES
};
const match=(types,extra={})=>({types,targets:types.map((type,i)=>({id:'place-'+i,type})),...extra});
const pattern=(unit,prefixCount,count)=>match(Array.from({length:count},(_,i)=>unit[(prefixCount+i)%unit.length]),{ordered:true,prefix:Array.from({length:prefixCount},(_,i)=>unit[i%unit.length])});
export const DISCOVERY={
 inset:[match(['shape-circle','shape-square']),match(['shape-triangle','shape-circle','shape-square']),match(['shape-oval','shape-square','shape-circle','shape-triangle'])],
 rods:[match(['rod-1','rod-3','rod-5'],{ordered:true}),match(['rod-1','rod-2','rod-4','rod-5'],{ordered:true}),match(['rod-1','rod-2','rod-3','rod-4','rod-5'],{ordered:true})],
 colors:[match(['tile-coral','tile-teal']),match(['tile-teal','tile-gold','tile-coral']),match(['tile-light','tile-mid','tile-dark'])],
 beads:[pattern(['bead-circle','bead-square'],4,4),pattern(['bead-circle','bead-circle','bead-square'],6,3),pattern(['bead-circle','bead-square','bead-triangle'],6,3)],
 table:[match(['plate','plate'],{friends:2}),match(['plate','plate','plate'],{friends:3}),match(['plate','cup','plate','cup','plate','cup'],{friends:3})],
 sequence:[match(['seed','sprout','flower'],{ordered:true,voice:'sequence-grow'}),match(['wet-hands','soap-hands','rinse-hands','dry-hands'],{ordered:true,voice:'sequence-wash'}),match(['eggs','caterpillar','chrysalis','butterfly'],{ordered:true,voice:'sequence-butterfly'})],
 ...PLAYFUL_LESSONS
};
export const DISCOVERY_NAMES={
 ...PLAYFUL_NAMES,
 'shape-circle':'圆形嵌块','shape-square':'方形嵌块','shape-triangle':'三角形嵌块','shape-oval':'椭圆形嵌块',
 'rod-1':'最短的木棒','rod-2':'较短的木棒','rod-3':'中等长的木棒','rod-4':'较长的木棒','rod-5':'最长的木棒',
 'tile-coral':'珊瑚红色板','tile-teal':'青绿色板','tile-gold':'金黄色板','tile-light':'浅绿色板','tile-mid':'中绿色板','tile-dark':'深绿色板',
 'bead-circle':'圆形珠子','bead-square':'方形珠子','bead-triangle':'三角形珠子',plate:'餐盘',cup:'小杯子',
 sprout:'小芽','wet-hands':'打湿双手','soap-hands':'涂肥皂搓手','rinse-hands':'冲洗干净','dry-hands':'擦干双手',eggs:'蝴蝶卵',caterpillar:'毛毛虫',chrysalis:'蛹',butterfly:'蝴蝶'
};
export const isDiscovery=kind=>Object.hasOwn(DISCOVERY,kind);
export const lesson=round=>DISCOVERY[round.kind]?.[round.level];
export function discoveryTarget(round,type){
 const task=lesson(round);if(!task)return null;
 const available=task.ordered?task.targets.slice(round.placed.length,round.placed.length+1):task.targets;
 return available.find(t=>matchesSlot(t,type)&&!round.placed.some(p=>p.target===t.id))?.id||null;
}
const matchesSlot=(slot,type)=>slot.accepts?slot.accepts.includes(type):slot.type===type;
export function acceptsDiscovery(round,item,target){
 const task=lesson(round);if(!task||round.placed.some(p=>p.target===target))return false;
 const slot=task.targets.find(t=>t.id===target);
 return !!slot&&matchesSlot(slot,item.type)&&(!task.ordered||slot===task.targets[round.placed.length]);
}
export const instruction=round=>lesson(round)?.voice||round.kind;
