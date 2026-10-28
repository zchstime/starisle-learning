export interface SubjectDefinition {id:string;name:string;art:string;order?:number;status?:string;}
export const SUBJECTS:SubjectDefinition[] = [
 {id:'math',name:'数学',art:'island'}, {id:'english',name:'英语',art:'english'},
 {id:'chinese',name:'语文',art:'planet'}, {id:'science',name:'科学',art:'island'},
 {id:'ethics',name:'道德与法治',art:'planet'}, {id:'music',name:'音乐',art:'planet'},
 {id:'art',name:'美术',art:'planet'}, {id:'pe',name:'体育与健康',art:'garden'},
 {id:'labor',name:'劳动',art:'garden'}, {id:'it',name:'信息科技',art:'planet'},
 {id:'practice',name:'综合实践',art:'garden'},
];
export type Subject=string;
export function subjectInfo(id:Subject){return SUBJECTS.find(s=>s.id===id)||SUBJECTS[0];}
export function bandLabel(grade:number){return grade<3?'低年级体验':grade<5?'中年级体验':'高年级体验';}
