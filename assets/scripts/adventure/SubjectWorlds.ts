import {gradeWorld,GradeWorld} from './GradeWorlds';
export const SUBJECT_WORLDS:Record<string,string>={english:'字母奇遇岛',chinese:'书香云庭',science:'未来实验岛',ethics:'友善星城',music:'旋律天空城',art:'彩虹创作岛',pe:'活力竞技岛',labor:'丰收工坊',it:'数字星港',practice:'探索营地'};
/** Subject art and grade routes are independent of saved task identifiers. */
export function learningWorld(subject:string,grade:number):GradeWorld{
 const base=gradeWorld(grade),name=SUBJECT_WORLDS[subject];
 return name?{...base,key:'world-subject-'+subject,name}:base;
}
