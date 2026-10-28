import {learningRoute} from './LearningRoute';
export type {RouteStop} from './LearningRoute';
export {ROUTE_PAGE_SIZE,routeUnlocked,routeNext} from './LearningRoute';
/** Compatibility entry point keeps math callers and old QA tools stable. */
export function mathRoute(grade:number){return learningRoute('math',grade);}
