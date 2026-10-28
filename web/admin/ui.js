export const state={user:null,draft:null,modules:[],arts:[],page:'overview',render:()=>{}};
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const $=(s,root=document)=>root.querySelector(s);
export const $$=(s,root=document)=>[...root.querySelectorAll(s)];
export async function api(route,data){const r=await fetch('/api/admin/'+route,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});const body=await r.json();if(!r.ok){if(r.status===401&&route!=='login')window.dispatchEvent(new Event('admin:expired'));throw Error(body.error||'请求失败');}return body;}
let timer;export function toast(message){const el=$('#toast');el.textContent=message;el.style.display='block';clearTimeout(timer);timer=setTimeout(()=>el.style.display='none',6500);}
export function action(fn){return async event=>{const button=event?.currentTarget;if(button?.tagName==='BUTTON')button.disabled=true;try{await fn(event);}catch(e){toast(e.message);}finally{if(button?.isConnected)button.disabled=false;}};}
export const tag=(text,kind='')=>`<span class="tag ${kind}">${esc(text)}</span>`;
export const name=id=>state.draft?.subjects.find(s=>s.id===id)?.name||id;
export function options(items,value){return items.map(i=>{const [id,label]=Array.isArray(i)?i:[i,i];return `<option value="${esc(id)}" ${String(value)===String(id)?'selected':''}>${esc(label)}</option>`;}).join('');}
export function field(label,key,value='',extra=''){return `<label>${esc(label)}<input name="${key}" value="${esc(value)}" ${extra}></label>`;}
export function area(label,key,value='',extra=''){return `<label ${extra}>${esc(label)}<textarea name="${key}">${esc(value)}</textarea></label>`;}
export function select(label,key,items,value){return `<label>${esc(label)}<select name="${key}">${options(items,value)}</select></label>`;}
export function dialog(title,body,onSave,submitLabel='保存草稿'){const d=$('#editor');d.innerHTML=`<div class="modal-head"><h2>${esc(title)}</h2><button data-close aria-label="关闭">×</button></div>${onSave?'<form>':'<div class="modal-body">'}${body}${onSave?'<p class="form-error error" hidden></p><div class="modal-actions"><button type="button" data-close>取消</button><button class="primary" type="submit">' + esc(submitLabel) + '</button></div></form>':'</div>'}`;$$('[data-close]',d).forEach(b=>b.onclick=()=>d.close());if(onSave)$('form',d).onsubmit=async e=>{e.preventDefault();const b=$('[type=submit]',d),err=$('.form-error',d);b.disabled=true;err.hidden=true;try{await onSave(Object.fromEntries(new FormData(e.target)),e.target);d.close();}catch(ex){err.textContent=ex.message;err.hidden=false;}finally{b.disabled=false;}};if(!d.open)d.showModal();return d;}
export async function save(next){const r=await api('save',{...next,revision:state.draft.revision});state.draft={...next,revision:r.revision};toast('草稿已保存，发布后将在游戏中生效');await state.render();}
export function preview(level){window.open('/?contentPreview=1'+(level?'&level='+encodeURIComponent(level):''),'_blank','noopener');}
export function table(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${headers.length}" class="empty">暂无内容</td></tr>`}</tbody></table></div>`;}

export const time=value=>new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
