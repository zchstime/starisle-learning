import {chapters,Level,Chapter,Subject} from './Catalog';
export interface RouteStop {chapter:number;level:number;task:Level;unit:Chapter;ordinal:number;}
export const ROUTE_PAGE_SIZE=12;
export function hasLearningRoute(subject:Subject){return true;} // All registered subjects have progressive island routes.
export function learningRoute(subject:Subject,grade:number):RouteStop[]{
 const list=chapters(subject,grade),ordered=list.map((unit,chapter)=>({unit,chapter}));
 ordered.sort((a,b)=>(a.unit.curriculum?.order??100+a.chapter)-(b.unit.curriculum?.order??100+b.chapter));
 const result:RouteStop[]=[];for(const {unit,chapter} of ordered)unit.levels.forEach((task,level)=>result.push({chapter,level,task,unit,ordinal:result.length}));return result;
}
export function routeUnlocked(route:RouteStop[],done:string[],index:number){return index>=0&&index<route.length&&(done.includes(route[index].task.id)||index===0||route.slice(0,index).every(s=>done.includes(s.task.id)));}
export function routeNext(route:RouteStop[],done:string[]){return route.findIndex(s=>!done.includes(s.task.id));}
