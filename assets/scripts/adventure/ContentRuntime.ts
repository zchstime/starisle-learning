import {enrichChapters,validPicture} from './PictureActivities';
import {CATALOG,ALL_LEVELS,Chapter} from './Catalog';
import {SUBJECTS,SubjectDefinition} from './Subjects';
export const KNOWN_LEVEL_IDS=new Set(ALL_LEVELS.map(l=>l.id));
export const KNOWN_CHAPTER_IDS=new Set(CATALOG.map(c=>c.id));
export const KNOWN_SUBJECT_IDS=new Set(SUBJECTS.map(s=>s.id));
const MODULES=new Set(['choice','number','sentence','cargo','groups','tiles','listen','picture']);
const CACHE='starisle.content.v1';
const ID=/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
interface ContentBundle {schemaVersion:number;release:number;subjects:SubjectDefinition[];chapters:Chapter[];requiredModules:{id:string;version:number}[];knownLevelIds:string[];knownChapterIds:string[];knownSubjectIds:string[];}
let release=0,checked=0,inFlight=false;
export function isContentPreview(){return typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('contentPreview')==='1';}
/** Built-in catalog preview is restricted to loopback hosts and never reads the admin draft. */
export function isLocalPreview(){return typeof window!=='undefined'&&['127.0.0.1','localhost','::1'].includes(window.location.hostname)&&new URLSearchParams(window.location.search).get('localPreview')==='1';}
/** Validate completely before mutating any shared array. All imports keep live references. */
export function applyContent(bundle:ContentBundle){
 if(!bundle||bundle.schemaVersion!==1||!Number.isSafeInteger(bundle.release)||!Array.isArray(bundle.requiredModules)||bundle.requiredModules.some(m=>!MODULES.has(m.id)||m.version!==1))throw Error('内容需要更新版本的游戏客户端');
 if(!Array.isArray(bundle.subjects)||!bundle.subjects.length||bundle.subjects.length>200||!Array.isArray(bundle.chapters)||bundle.chapters.length>5000)throw Error('内容目录格式无效');
 const subjects=new Set<string>(),chapters=new Set<string>(),levels=new Set<string>();
 for(const s of bundle.subjects){if(!ID.test(s.id)||subjects.has(s.id)||typeof s.name!=='string'||s.name.length>30)throw Error('学科格式无效');subjects.add(s.id);}
 for(const c of bundle.chapters){if(!ID.test(c.id)||chapters.has(c.id)||!subjects.has(c.subject)||!Number.isInteger(c.grade)||c.grade<1||c.grade>6||!Array.isArray(c.levels)||!c.levels.length)throw Error('章节格式无效');chapters.add(c.id);for(const l of c.levels){if(!ID.test(l.id)||levels.has(l.id)||!MODULES.has(l.kind)||typeof l.goal!=='string'||!Number.isFinite(l.target)||(l.kind==='picture'&&!validPicture(l.activity)))throw Error('题目格式无效');levels.add(l.id);}}
 for(const ids of [bundle.knownLevelIds,bundle.knownChapterIds,bundle.knownSubjectIds])if(!Array.isArray(ids)||ids.length>100000||ids.some(id=>!ID.test(id)))throw Error('内容历史格式无效');
 enrichChapters(bundle.chapters);
 SUBJECTS.splice(0,SUBJECTS.length,...bundle.subjects);CATALOG.splice(0,CATALOG.length,...bundle.chapters);ALL_LEVELS.splice(0,ALL_LEVELS.length,...bundle.chapters.flatMap(c=>c.levels));
 bundle.knownLevelIds.forEach(id=>KNOWN_LEVEL_IDS.add(id));levels.forEach(id=>KNOWN_LEVEL_IDS.add(id));bundle.knownChapterIds.forEach(id=>KNOWN_CHAPTER_IDS.add(id));chapters.forEach(id=>KNOWN_CHAPTER_IDS.add(id));bundle.knownSubjectIds.forEach(id=>KNOWN_SUBJECT_IDS.add(id));subjects.forEach(id=>KNOWN_SUBJECT_IDS.add(id));release=bundle.release;
}
async function get(url:string){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);try{const response=await fetch(url,{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('内容服务暂不可用');return await response.json();}finally{clearTimeout(timer);}}
export async function loadContent(){
 if(typeof window==='undefined'||typeof fetch==='undefined')return;
 if(isLocalPreview())return;
 if(isContentPreview()){applyContent(await get('/api/admin/preview'));return;}
 try{const cached=window.localStorage.getItem(CACHE);if(cached)applyContent(JSON.parse(cached));}catch{/* Built-in content remains available if the cache is invalid. */}
 try{const bundle=await get('/api/content/current');applyContent(bundle);try{window.localStorage.setItem(CACHE,JSON.stringify(bundle));}catch{}}catch{/* Keep the last compatible content or the bundled curriculum. */}
 checked=Date.now();
}
/** Only called on a safe map screen. Do not swap puzzle data during an attempt. */
export async function refreshContent(canApply:()=>boolean){
 if(isContentPreview()||isLocalPreview()||inFlight||Date.now()-checked<30000)return false;inFlight=true;checked=Date.now();
 try{const version=await get('/api/content/version');if(version.release===release)return false;const bundle=await get('/api/content/current');if(!canApply())return false;applyContent(bundle);try{window.localStorage.setItem(CACHE,JSON.stringify(bundle));}catch{}return true;}catch{return false;}finally{inFlight=false;}
}
