(()=>{
 const keys=['starisle.adventure.v3','starisle.grade2.chapter-one.v2','starisle.music','starisle.musicVolume','starisle.profile.v1'];let user=null,revision=0,running=false,dirty=false,timer,lastLocal='';
 const prefix=()=>`starisle.account.${user.id}.`;
 const notice=text=>{window.starisleCloudStatus=text;window.dispatchEvent(new CustomEvent('starisle:cloud-status',{detail:text}));};
 function read(){const p={};for(const k of keys){const v=(localStorage.getItem(prefix()+k)??(k.startsWith('starisle.music')?localStorage.getItem(k):null));if(v!==null)p[k]=v;}return p;}
 function merge(remote,local){const out={...remote,...local};for(const k of keys.slice(0,2)){if(!remote?.[k]||!local[k])continue;const a=JSON.parse(remote[k]),b=JSON.parse(local[k]);if(a.version!==b.version)throw Error('version');const p={...a,...b};
 for(const field of k===keys[0]?['done','medals','labDone','gifts']:['completed','hints'])p[field]=[...new Set([...(a[field]||[]),...(b[field]||[])])];
 if(k===keys[1]){p.attempts={...a.attempts,...b.attempts};for(const id of Object.keys(p.attempts))p.attempts[id]=Math.max(a.attempts?.[id]||0,b.attempts?.[id]||0);p.exam=(a.exam?.at||0)>(b.exam?.at||0)?a.exam:b.exam;}
 if(k===keys[0]){const ae=a.exams||{},be=b.exams||{},records={...ae.records,...be.records};for(const id of Object.keys(records)){const x=ae.records?.[id],y=be.records?.[id];if(x&&y)records[id]={...((x.at||0)>(y.at||0)?x:y),best:Math.max(x.best||0,y.best||0)};}const drafts={...ae.drafts,...be.drafts};for(const source of [ae,be]){const candidates={...source.drafts};if(source.attempt)candidates[source.attempt.paperId]=source.attempt;for(const [id,d] of Object.entries(candidates))if(!drafts[id]||(d.updatedAt||0)>=(drafts[id].updatedAt||0))drafts[id]=d;}p.exams={records,drafts,attempt:(ae.attempt?.updatedAt||0)>(be.attempt?.updatedAt||0)?ae.attempt:be.attempt};}
 out[k]=JSON.stringify(p);}const pk='starisle.profile.v1';if(remote?.[pk]&&local[pk]){const a=JSON.parse(remote[pk]),b=JSON.parse(local[pk]);out[pk]=JSON.stringify((a.updatedAt||0)>(b.updatedAt||0)?a:b);}return out;}
 async function api(method,data){const r=await fetch('/api/save',{method,headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(8000)});const j=await r.json();if(!r.ok&&r.status!==409)throw Error('offline');return j;}
 function apply(p){for(const k of keys)if(p[k])localStorage.setItem(prefix()+k,p[k]);}
 async function sync(){if(!user||running)return;running=true;notice('正在同步云存档…');try{
 const remote=await api('GET');revision=remote.revision;apply(merge(remote.payload||{},read()));
 for(let n=0;n<5;n++){dirty=false;const sent=read(),r=await api('PUT',{revision,payload:sent});revision=r.revision;apply(merge(r.payload||{},read()));if(r.conflict)continue;if(!dirty){lastLocal=JSON.stringify(read());notice('已保存到云端');return;}}
 dirty=true;notice('进度已存本机，正在等待同步');
 }catch{dirty=true;notice('进度已存本机，联网后自动同步');}finally{running=false;if(dirty){clearTimeout(timer);timer=setTimeout(sync,15000);}}}
 window.starisleCloud={async start(account){user=account;if(user)await sync();},queue(){if(!user)return;dirty=true;clearTimeout(timer);timer=setTimeout(sync,700);},merge};
 window.addEventListener('starisle:save',e=>{if(user&&e.detail?.userId===user.id)window.starisleCloud.queue();});
 // Support existing Cocos builds as well as the new explicit save event.
 setInterval(()=>{if(user&&!running){try{if(JSON.stringify(read())!==lastLocal)window.starisleCloud.queue();}catch{notice('本机存储暂不可用');}}},5000);
 window.addEventListener('online',()=>sync());
 window.addEventListener('storage',e=>{if(user&&e.key?.startsWith(prefix()))window.starisleCloud.queue();});
})();
