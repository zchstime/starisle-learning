// Adapted from Turret.getEnemy() / distance() in victorqribeiro/towerDefense.
// Copyright (c) 2020 Victor Ribeiro. MIT; original and LICENSE in this folder.
// Changes: pure function, world-pixel range, eligibility hook for curriculum rules.
export function nearestTarget(pos,enemies,minRange,range,eligible=()=>true){
 let enemy=null,closeDist=Infinity;
 for(let i=0;i<enemies.length;i++){
  const candidate=enemies[i],dist=Math.sqrt((pos.x-candidate.pos.x)**2+(pos.y-candidate.pos.y)**2);
  if(dist<closeDist&&dist>minRange&&dist<range&&candidate.health>0&&eligible(candidate)){closeDist=dist;enemy=candidate;}
 }
 return enemy;
}
