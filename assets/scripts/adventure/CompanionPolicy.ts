/** Deterministic pacing, independent of rendering and storage. */
export class CompanionPolicy {
 lastActivity=0; lastNudge=-Infinity; context=''; nudged=false; quietUntil=0;
 activity(now:number){this.lastActivity=now;}
 enter(context:string,now:number){if(context===this.context)return;this.context=context;this.nudged=false;this.lastActivity=now;}
 rest(now:number){this.quietUntil=now+10*60*1000;this.lastActivity=now;}
 canNudge(now:number,screen:string,blocked:boolean){return !blocked&&['map','play'].includes(screen)&&!this.nudged&&now>=this.quietUntil&&now-this.lastActivity>=60000&&now-this.lastNudge>=180000;}
 didNudge(now:number){this.nudged=true;this.lastNudge=now;}
}
