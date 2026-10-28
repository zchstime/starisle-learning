// Picture-first preschool tasks. Child-facing quantities never require numerals.
export const KINDS=['feed','sort','build'];
export const FEED=[2,3,4];
export const SORT=[['apple','banana','apple','banana'],['berry','apple','banana','apple','berry','banana'],['banana','berry','apple','berry','banana','apple']];
export const BUILD=[['square','triangle'],['square','square','triangle'],['square','circle','triangle']];
export function createRound(kind,level=0){if(!KINDS.includes(kind))throw Error('Unknown kindergarten activity');return {kind,level:Math.max(0,Math.min(2,level)),placed:[],done:false};}
export function accept(round,item,target){
 if(round.done||round.placed.some(p=>p.id===item.id))return {ok:false,reason:'used'};
 let ok=false;
 if(round.kind==='feed')ok=item.type==='apple'&&target==='bunny';
 if(round.kind==='sort')ok=item.type===target;
 if(round.kind==='build')ok=item.type===BUILD[round.level][round.placed.length]&&target==='slot-'+round.placed.length;
 if(!ok)return {ok:false,reason:'mismatch'};
 round.placed.push({id:item.id,type:item.type,target});const required=round.kind==='feed'?FEED[round.level]:round.kind==='sort'?SORT[round.level].length:BUILD[round.level].length;
 round.done=round.placed.length===required;return {ok:true,done:round.done,count:round.placed.length};
}
