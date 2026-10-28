/** Visual identity is independent of task IDs and saved progress. Coordinates use 1440 × 810. */
export interface GradeWorld {key:string;name:string;homes:number[][];trail:string;}
export const GRADE_WORLDS:GradeWorld[]=[
 {key:'world-grade-1',name:'晨光草甸',homes:[[245,410],[560,300],[880,420],[1190,280]],trail:'#FFF2BA'},
 {key:'world-grade-2',name:'樱花环游',homes:[[250,305],[580,440],[930,420],[1190,260]],trail:'#FFE0E6'},
 {key:'world-grade-3',name:'蓝湾瀑布',homes:[[230,430],[560,275],[885,435],[1190,300]],trail:'#C9FAFF'},
 {key:'world-grade-4',name:'树屋秘境',homes:[[240,450],[560,340],[880,240],[1190,390]],trail:'#E2F6AD'},
 {key:'world-grade-5',name:'水晶峡谷',homes:[[240,280],[565,430],[890,285],[1190,440]],trail:'#FFE4BF'},
 {key:'world-grade-6',name:'星空学院',homes:[[240,400],[560,245],[890,425],[1190,265]],trail:'#E6DEFF'},
];
export function gradeWorld(grade:number){return GRADE_WORLDS[Math.max(0,Math.min(5,Math.floor(grade)-1))]||GRADE_WORLDS[0];}
