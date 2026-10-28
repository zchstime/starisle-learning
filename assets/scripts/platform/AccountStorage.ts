import {sys} from 'cc';
/** Account identity is established by the server before the game starts. Guest keys stay intact. */
const previewItems=new Map<string,string>();
export function accountStorage(){
 if(typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('contentPreview')==='1')return {getItem:(key:string)=>previewItems.get(key)??null,setItem:(key:string,value:string)=>{previewItems.set(key,value);}};
 const account=typeof window!=='undefined'?(window as any).starisleAccount:null;
 const prefix=account?.id?'starisle.account.'+account.id+'.':'';
 return {getItem:(key:string)=>sys.localStorage.getItem(prefix+key)??(key.startsWith('starisle.music')?sys.localStorage.getItem(key):null),setItem:(key:string,value:string)=>{sys.localStorage.setItem(prefix+key,value);if(account?.id&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('starisle:save',{detail:{userId:account.id,key}}));}};
}
