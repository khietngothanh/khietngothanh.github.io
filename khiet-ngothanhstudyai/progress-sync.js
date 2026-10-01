(()=>{'use strict';
window.createCloudProgressSync=function({getState,applyState,validate,fresh,blank,lessons,legacyRaw,onStatus,initialUser}){
  const prefix='prompt-lab-supabase-v1:';
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const flatten=s=>{const out={last:s.last};for(const[n,r]of Object.entries(s.lessons)){for(const f of ['basic','applied','notes','done'])out[`lesson/${n}/${f}`]=r[f];r.activities.forEach((v,i)=>out[`lesson/${n}/activity/${i}`]=v);r.checks.forEach((v,i)=>out[`lesson/${n}/check/${i}`]=v);}return out;};
  const unflatten=map=>{const s=fresh();for(const[key,value]of Object.entries(map)){if(key==='last'){s.last=value;continue;}const m=/^lesson\/(\d+)\/(basic|applied|notes|done|activity\/(\d+)|check\/(\d+))$/.exec(key);if(!m||!lessons[Number(m[1])-1])throw Error('Dữ liệu trực tuyến không hợp lệ.');const r=s.lessons[m[1]]||(s.lessons[m[1]]=blank(lessons[Number(m[1])-1].sections.length));if(m[3]!==undefined)r.activities[Number(m[3])]=value;else if(m[4]!==undefined)r.checks[Number(m[4])]=value;else r[m[2]]=value;}return validate(s);};
  let user=null,fields={},pending={},conflicts={},observed=flatten(getState()),busy=false,loaded=false,timer,mode='loading',lastTime='',cacheError=false,cacheProtected=false,notice='';
  const copy=v=>JSON.parse(JSON.stringify(v));
  function ui(){const count=Object.keys(pending).length,clash=Object.keys(conflicts).length;
    let message=mode==='loading'?'Đang tải tiến độ theo tài khoản…':mode==='login'?'Cần đăng nhập để đồng bộ. Bài đang viết vẫn được giữ trong phiên này.':mode==='offline'?'Chưa kết nối được. Bản nháp sẽ được gửi khi có mạng.':mode==='error'?'Chưa lưu trực tuyến được. Giữ trang mở hoặc xuất sao lưu rồi thử lại.':busy?'Đang lưu trực tuyến…':clash?`${clash} mục được sửa trên hai thiết bị. Chọn bản cần giữ.`:count?`${count} thay đổi đang chờ lưu trực tuyến.`:`Đã đồng bộ${lastTime?' · '+lastTime:''}.`;
    if(cacheError)message+=' Không lưu được bản nháp trên thiết bị; hãy xuất sao lưu.';
    if(notice)message+=' '+notice;
    onStatus(message,{user,mode,busy,pending:count,conflicts:clash,loaded});
  }
  function persist(){if(!user)return;if(cacheProtected){cacheError=true;ui();return;}try{localStorage.setItem(prefix+user.id,JSON.stringify({version:4,userId:user.id,fields,pending,conflicts}));cacheError=false;}catch{cacheError=true;}ui();}
  function refresh(){const values={};for(const[k,f]of Object.entries(fields))values[k]=f.value;for(const[k,p]of Object.entries(pending))values[k]=p.value;const s=unflatten(values);observed=flatten(s);applyState(s);persist();}
  function queue(key,value,revision=fields[key]?.revision||0){pending[key]={value,revision,mutationId:crypto.randomUUID()};}
  function changed(){if(!loaded)return;const next=flatten(getState());for(const[k,v]of Object.entries(next)){if(!equal(v,observed[k])&&!(observed[k]===undefined&&(v===''||v===false)))queue(k,v);}observed=copy(next);persist();clearTimeout(timer);timer=setTimeout(sync,800);}
  async function api(options){try{return await window.PROMPT_LAB_ACCOUNT.request(options);}catch(error){if(error.status===401){loaded=false;mode='login';}else if(navigator.onLine)mode='error';throw error;}}
  async function connect(){if(busy||!navigator.onLine){if(!navigator.onLine){mode='offline';ui();}return;}busy=true;ui();
    try{
      const data=await api();if(!data.user?.id||!Array.isArray(data.fields))throw Error('invalid_data');
      if(user&&user.id!==data.user.id){loaded=false;mode='login';notice='Tài khoản đã thay đổi. Tải lại trang để mở dữ liệu của tài khoản mới.';return;}
      const first=!loaded;user=data.user;
      if(first){try{const raw=localStorage.getItem(prefix+user.id);if(raw){const cached=JSON.parse(raw);if(cached.version!==4||cached.userId!==user.id||!cached.pending||!cached.fields)throw Error('cache');fields=cached.fields;pending=cached.pending;conflicts=cached.conflicts||{};unflatten(Object.fromEntries(Object.entries({...fields,...pending}).map(([k,v])=>[k,v.value])));}}catch{cacheError=true;cacheProtected=true;notice='Bản nháp thiết bị có lỗi; chưa tự nhập bản đó.';fields={};pending={};conflicts={};}}
      const remote={};for(const f of data.fields){if(!Number.isSafeInteger(f.revision)||f.revision<1)throw Error('invalid_data');remote[f.key]=f;}unflatten(Object.fromEntries(Object.entries(remote).map(([k,f])=>[k,f.value])));
      for(const[k,p]of Object.entries(pending)){const r=remote[k];if(r&&equal(r.value,p.value)){delete pending[k];delete conflicts[k];}else if((r?.revision||0)!==p.revision){if(k==='last'){delete pending[k];delete conflicts[k];}else conflicts[k]=r||{key:k,value:'',revision:0};}else delete conflicts[k];}
      fields=remote;
      if(first&&legacyRaw){
        let migrated=false;try{migrated=localStorage.getItem(prefix+user.id+':migrated')==='1';}catch{}
        if(!migrated){const legacy=validate(JSON.parse(legacyRaw)),flat=flatten(legacy);for(const[k,v]of Object.entries(flat)){if(v===''||v===false||pending[k]||k==='last'&&fields[k])continue;if(fields[k]&&equal(fields[k].value,v))continue;queue(k,v,0);if(fields[k])conflicts[k]=fields[k];}
          try{localStorage.setItem(prefix+user.id+':before-migration',legacyRaw);localStorage.setItem(prefix+user.id+':migrated','1');}catch{cacheError=true;}
          notice='Đã giữ bản sao dữ liệu cũ; các mục khác nhau cần bạn chọn.';
        }
      }
      loaded=true;mode='cloud';lastTime=new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});refresh();
    }catch(error){if(mode!=='login'&&mode!=='error')mode='offline';ui();}finally{busy=false;ui();}
    if(loaded&&Object.keys(pending).some(k=>!conflicts[k]))await sync();
  }
  async function sync(){if(busy||!loaded||mode==='login')return;if(!navigator.onLine){mode='offline';ui();return;}const changes=[];let bytes=20;for(const[k,p]of Object.entries(pending)){if(conflicts[k])continue;const c={key:k,...p},size=new TextEncoder().encode(JSON.stringify(c)).length;if(changes.length&&(bytes+size>950000||changes.length>=20))break;changes.push(c);bytes+=size;}
    if(!changes.length){ui();return;}busy=true;ui();
    try{const data=await api({method:'POST',headers:{'Content-Type':'application/json','X-Prompt-Lab':'1'},body:JSON.stringify({changes})});if(!Array.isArray(data.accepted)||!Array.isArray(data.conflicts))throw Error('invalid_response');
      for(const r of data.accepted){const sent=changes.find(c=>c.key===r.key);fields[r.key]=r;if(pending[r.key]?.mutationId===sent?.mutationId){delete pending[r.key];delete conflicts[r.key];}else if(pending[r.key]){pending[r.key].revision=r.revision;pending[r.key].mutationId=crypto.randomUUID();}}
      for(const r of data.conflicts){fields[r.key]=r;if(pending[r.key]){if(equal(pending[r.key].value,r.value)||r.key==='last'){delete pending[r.key];delete conflicts[r.key];}else conflicts[r.key]=r;}}
      mode='cloud';lastTime=new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});refresh();
    }catch{if(mode!=='login'&&mode!=='error')mode='offline';persist();}finally{busy=false;ui();}
    if(mode==='cloud'&&Object.keys(pending).some(k=>!conflicts[k]))timer=setTimeout(sync,200);
  }
  function resolve(key,choice){const r=conflicts[key];if(!r)return;if(choice==='remote'){fields[key]=r;delete pending[key];}else if(pending[key]){pending[key].revision=r.revision;pending[key].mutationId=crypto.randomUUID();}delete conflicts[key];refresh();sync();}
  function replace(next){if(!loaded){throw Error('Hãy kết nối tài khoản trước khi nhập sao lưu.');}const flat=flatten(next);for(let n=1;n<=lessons.length;n++){const r=next.lessons[n]||blank(lessons[n-1].sections.length);Object.assign(flat,flatten({version:3,last:next.last,lessons:{[n]:r}}));}for(const[k,v]of Object.entries(flat)){queue(k,v);delete conflicts[k];}refresh();sync();}
  window.addEventListener('online',connect);window.addEventListener('offline',()=>{mode='offline';ui();});window.addEventListener('focus',connect);
  window.addEventListener('beforeunload',e=>{if(cacheError&&Object.keys(pending).length){e.preventDefault();e.returnValue='';}});
  setInterval(()=>{if(document.visibilityState==='visible')connect();},20000);
  if(initialUser){user=initialUser;try{const raw=localStorage.getItem(prefix+user.id);if(raw){const cached=JSON.parse(raw);if(cached.version!==4||cached.userId!==user.id||!cached.pending||!cached.fields)throw Error('cache');fields=cached.fields;pending=cached.pending;conflicts=cached.conflicts||{};unflatten(Object.fromEntries(Object.entries({...fields,...pending}).map(([k,v])=>[k,v.value])));loaded=true;refresh();}}catch{cacheError=true;cacheProtected=true;fields={};pending={};conflicts={};notice='Bản nháp thiết bị có lỗi; chưa tự nhập bản đó.';}}
  connect();return{changed,retry:connect,resolve,replace,getConflicts:()=>copy(conflicts),getPending:()=>copy(pending),getUser:()=>user,isLoaded:()=>loaded,flatten};
};
function localProgress({getState,applyState,validate,onStatus}){
  let error=false;
  function notify(){onStatus(error?'Không lưu được trên thiết bị. Hãy xuất sao lưu trước khi đóng trang.':'Đã lưu trên thiết bị này. Đăng nhập để đồng bộ giữa các thiết bị.',{user:null,mode:'local',busy:false,pending:0,conflicts:0,loaded:true});}
  function changed(){try{localStorage.setItem('prompt-lab-academy-v3',JSON.stringify(getState()));error=false;}catch{error=true;}notify();}
  window.addEventListener('beforeunload',e=>{if(error){e.preventDefault();e.returnValue='';}});
  notify();return{changed,retry:notify,replace:next=>{applyState(validate(next));changed();},getConflicts:()=>({}),getPending:()=>({}),resolve:()=>{},getUser:()=>null,isLoaded:()=>true};
}
window.createProgressSync=function(options){
  let controller=null;
  window.PROMPT_LAB_ACCOUNT.ready.then(({client,user})=>{
    // Dữ liệu khách không tự động nhập vào bất kỳ tài khoản nào.
    if(client&&user){options.applyState(options.fresh());controller=window.createCloudProgressSync({...options,legacyRaw:'',initialUser:user});}
    else controller=localProgress(options);
  });
  return{changed:()=>controller?.changed(),retry:()=>controller?.retry(),resolve:(...args)=>controller?.resolve(...args),replace:next=>{if(!controller)throw Error('Đang mở dữ liệu.');controller.replace(next);},getConflicts:()=>controller?.getConflicts()||{},getPending:()=>controller?.getPending()||{},getUser:()=>controller?.getUser()||null,isLoaded:()=>controller?.isLoaded()||false};
};
})();
