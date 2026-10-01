(()=>{'use strict';
const config=window.PROMPT_LAB_CONFIG||{},$=s=>document.querySelector(s);
let client=null,user=null,readyDone=false,signingOut=false,initialId=null;
const configured=Boolean(config.supabaseUrl&&config.supabasePublishableKey);
const message=text=>{$('#account-message').textContent=text;};
const validConfig=()=>{
  try{const u=new URL(config.supabaseUrl);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co'))return false;
    const key=config.supabasePublishableKey;if(key.startsWith('sb_secret_'))return false;
    if(key.startsWith('sb_publishable_'))return true;
    const payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    return payload.role==='anon';
  }catch{return false;}
};
function accountView(){
  $('#account-signed-in').hidden=!user;$('#account-sign-in').hidden=Boolean(user)||!client;
  $('#account-email-label').textContent=user?.email||'Chưa đăng nhập';
  if(!configured)message('Bạn có thể học và lưu trên thiết bị này. Đồng bộ theo tài khoản sẽ có khi website hoàn tất kết nối.');
  else if(!client)message('Kết nối tài khoản chưa hoạt động. Bài làm trên thiết bị vẫn được giữ; hãy xuất sao lưu khi cần.');
  else if(user)message('Bài làm, ghi chú và tiến độ được lưu riêng theo tài khoản. Dùng cùng email trên các thiết bị.');
}
function open(){accountView();$('#account-dialog').showModal();}
const ready=(async()=>{
  if(configured&&validConfig()){
    try{
      client=SupabaseSDK.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'prompt-lab-auth-v1'}});
      const {data,error}=await client.auth.getSession();if(error)throw error;
      user=data.session?.user||null;initialId=user?.id||null;readyDone=true;
      client.auth.onAuthStateChange((_event,session)=>{
        const next=session?.user||null;
        if(readyDone&&!signingOut&&(next?.id||null)!==initialId){location.reload();return;}
        user=next;
      });
    }catch{client=null;user=null;}
  }
  accountView();return {client,user};
})();
$('#account-open').onclick=open;$('#sign-in').onclick=open;
$('#account-dialog-close').onclick=()=>$('#account-dialog').close();
$('#email-form').onsubmit=async e=>{
  e.preventDefault();if(!client)return;
  const button=$('#send-code');button.disabled=true;message('Đang gửi mã đăng nhập…');
  try{const email=$('#login-email').value.trim();const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true}});if(error)throw error;
    $('#otp-form').hidden=false;$('#login-code').focus();message('Mã đăng nhập đã được gửi. Kiểm tra hộp thư và thư rác, rồi nhập mã bên dưới.');
  }catch{message('Chưa gửi được mã. Kiểm tra email, chờ một phút rồi thử lại. Nếu email chưa được cho phép, chủ website cần cấu hình dịch vụ gửi thư.');}
  finally{button.disabled=false;}
};
$('#otp-form').onsubmit=async e=>{
  e.preventDefault();if(!client)return;$('#verify-code').disabled=true;
  try{const {error}=await client.auth.verifyOtp({email:$('#login-email').value.trim(),token:$('#login-code').value.trim(),type:'email'});if(error)throw error;
    location.reload();
  }catch{message('Mã không đúng hoặc đã hết hạn. Hãy kiểm tra lại hoặc yêu cầu mã mới.');$('#verify-code').disabled=false;}
};
$('#sign-out').onclick=async()=>{
  if(!client)return;$('#sign-out').disabled=true;signingOut=true;
  try{const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;location.reload();}
  catch{signingOut=false;$('#sign-out').disabled=false;message('Chưa đăng xuất được. Hãy thử lại.');}
};
let lockedId=null;
window.PROMPT_LAB_ACCOUNT={ready,open,configured,
  async request(options={}){
    await ready;if(!client)throw Object.assign(Error('login'),{status:401});
    const {data:sessionData,error:sessionError}=await client.auth.getSession();
    const id=sessionData?.session?.user?.id;
    if(sessionError||!id||(lockedId&&id!==lockedId))throw Object.assign(Error('login'),{status:401});
    const write=options.method==='POST';
    const payload=write?JSON.parse(options.body):null;
    const rpc=write?'prompt_lab_write_progress':'prompt_lab_read_progress';
    const {data,error}=await client.rpc(rpc,write?{changes:payload.changes}:{}).abortSignal(AbortSignal.timeout(15000));
    if(error)throw Object.assign(Error('storage'),{status:error.status||((error.code==='42501'||error.code==='PGRST301')?401:503)});
    if(!data?.user?.id||data.user.id!==id)throw Object.assign(Error('login'),{status:401});
    lockedId=id;return data;
  }
};
})();
