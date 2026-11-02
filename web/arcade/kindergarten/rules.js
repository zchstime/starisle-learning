import {SHOP,TIDY,HOMES,GARDEN,needed} from './life.js';
import {DISCOVERY,isDiscovery,lesson,acceptsDiscovery} from './discovery.js';
// Picture-first preschool tasks. Child-facing quantities never require numerals.
export const KINDS=['feed','sort','build','shop','tidy','garden',...Object.keys(DISCOVERY)];
export const FEED=[2,3,4];
export const SORT=[
 {rule:'kind',targets:[{id:'apple',icon:'apple'},{id:'banana',icon:'banana'}],items:[{type:'apple',group:'apple'},{type:'banana',group:'banana'},{type:'apple',group:'apple'},{type:'banana',group:'banana'}]},
 {rule:'size',targets:[{id:'small',icon:'apple',scale:'small'},{id:'big',icon:'apple',scale:'big'}],items:[{type:'apple',group:'small',scale:'small'},{type:'banana',group:'big',scale:'big'},{type:'berry',group:'small',scale:'small'},{type:'apple',group:'big',scale:'big'},{type:'banana',group:'small',scale:'small'},{type:'berry',group:'big',scale:'big'}]},
 {rule:'use',targets:[{id:'food',icon:'apple'},{id:'toy',icon:'ball'}],items:[{type:'banana',group:'food'},{type:'ball',group:'toy'},{type:'apple',group:'food'},{type:'teddy',group:'toy'},{type:'berry',group:'food'},{type:'book',group:'toy'}]}
];
export const BUILD=[['square','triangle'],['square','square','triangle'],['square','circle','triangle']];
export function createRound(kind,level=0){if(!KINDS.includes(kind))throw Error('Unknown kindergarten activity');return {kind,level:Math.max(0,Math.min(2,level)),placed:[],done:false};}
export function accept(round,item,target){
 if(round.done||round.placed.some(p=>p.id===item.id))return {ok:false,reason:'used'};
 let ok=false;
 if(round.kind==='feed')ok=item.type==='apple'&&target==='bunny';
 if(round.kind==='sort')ok=item.group===target;
 if(round.kind==='build')ok=item.type===BUILD[round.level][round.placed.length]&&target==='slot-'+round.placed.length;
 if(round.kind==='shop')ok=target==='bag'&&needed(round).includes(item.type);
 if(round.kind==='tidy')ok=Object.hasOwn(HOMES,item.type)&&HOMES[item.type]===target&&needed(round).includes(item.type);
 if(round.kind==='garden')ok=target==='pot'&&item.type===GARDEN[round.placed.length];
 if(isDiscovery(round.kind))ok=acceptsDiscovery(round,item,target);
 if(!ok)return {ok:false,reason:'mismatch'};
 round.placed.push({id:item.id,type:item.type,target});const required=isDiscovery(round.kind)?lesson(round).targets.length:round.kind==='shop'?SHOP[round.level].length:round.kind==='tidy'?TIDY[round.level].length:round.kind==='garden'?GARDEN.length:round.kind==='feed'?FEED[round.level]:round.kind==='sort'?SORT[round.level].items.length:BUILD[round.level].length;
 round.done=round.placed.length===required;return {ok:true,done:round.done,count:round.placed.length};
}
