// Life scenes use pictures and manipulable objects, without reading prerequisites.
export const SHOP=[['apple','banana'],['bread','apple','apple'],['milk','banana','bread','banana']];
export const TIDY=[['book','ball','book','ball'],['book','teddy','shirt','ball'],['shirt','book','ball','sock','teddy','book']];
export const HOMES={book:'bookshelf',ball:'toybox',teddy:'toybox',shirt:'wardrobe',sock:'wardrobe'};
export const GARDEN=['soil','seed','water'];
export const NAMES={apple:'苹果',banana:'香蕉',berry:'蓝莓',bread:'面包',milk:'牛奶',book:'图画书',ball:'皮球',teddy:'小熊',shirt:'上衣',sock:'袜子',soil:'小铲子和泥土',seed:'种子',water:'小水壶',square:'方形积木',circle:'圆形积木',triangle:'三角积木'};
export const LIFE=['shop','tidy','garden'];
export function needed(round){
 const list=round.kind==='shop'?SHOP[round.level]:round.kind==='tidy'?TIDY[round.level]:null;
 if(list){const used=round.placed.map(x=>x.type);return list.filter(type=>{const i=used.indexOf(type);if(i<0)return true;used.splice(i,1);return false;});}
 return round.kind==='garden'?GARDEN.slice(round.placed.length):[];
}
export function expectedTarget(round,type){return round.kind==='shop'?'bag':round.kind==='tidy'?HOMES[type]:round.kind==='garden'?'pot':null;}
