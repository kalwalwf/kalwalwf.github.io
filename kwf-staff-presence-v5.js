// KWF v5 — authenticated staff Online/Offline presence.
// Only an active staff account may set its own heartbeat. The Owner alone can
// read staff presence. A closed/crashed browser is offline after 90 seconds.
state.kwfOnlineStaff = [];
state.kwfPresenceSession = null;
state.kwfPresenceBound = false;
state.kwfPresenceBusy = false;
state.kwfPresenceReadBusy = false;
state.kwfPresenceToken = '';
state.kwfPresenceUserId = '';

const kwfPresenceWording=(ur,en)=>state.language==='ur'?ur:en;
function kwfStaffIsOnline(userId){
  return Array.isArray(state.kwfOnlineStaff)&&
    state.kwfOnlineStaff.some(s=>s.user_id===userId);
}
function kwfStaffPresenceTag(userId){
  const online=kwfStaffIsOnline(userId);
  const label=online?kwfPresenceWording('آن لائن','Online'):kwfPresenceWording('آف لائن','Offline');
  return '<span class="kwf-presence '+(online?'kwf-online':'kwf-offline')+
    '" data-kwf-presence-user="'+html(userId)+'" title="'+label+'">'+
    '<span class="kwf-presence-dot" aria-hidden="true"></span>'+
    '<span class="kwf-presence-text">'+label+'</span></span>';
}
function kwfPresenceCount(){
  return Array.isArray(state.kwfOnlineStaff)?state.kwfOnlineStaff.length:0;
}
function kwfPresencePaint(){
  if(typeof document.querySelectorAll!=='function')return;
  const tags=document.querySelectorAll('[data-kwf-presence-user]');
  for(const tag of tags){
    const online=kwfStaffIsOnline(tag.getAttribute('data-kwf-presence-user'));
    tag.classList.toggle('kwf-online',online);
    tag.classList.toggle('kwf-offline',!online);
    const label=online?kwfPresenceWording('آن لائن','Online'):kwfPresenceWording('آف لائن','Offline');
    tag.setAttribute('title',label);
    const text=tag.querySelector('.kwf-presence-text');
    if(text)text.textContent=label;
  }
  const count=document.querySelector('[data-kwf-online-count]');
  if(count)count.textContent=String(kwfPresenceCount());
}
function kwfPresenceGetSessionId(){
  if(state.kwfPresenceSession)return state.kwfPresenceSession;
  let id='';
  try{
    if(typeof sessionStorage!=='undefined')id=sessionStorage.getItem('kwf_staff_presence_v5')||'';
    if(!/^[0-9a-f-]{36}$/i.test(id)){
      if(typeof crypto==='undefined'||typeof crypto.randomUUID!=='function')return '';
      id=crypto.randomUUID();
      if(typeof sessionStorage!=='undefined')sessionStorage.setItem('kwf_staff_presence_v5',id);
    }
  }catch(err){
    if(typeof crypto==='undefined'||typeof crypto.randomUUID!=='function')return '';
    id=crypto.randomUUID();
  }
  state.kwfPresenceSession=id;
  return id;
}
function kwfPresenceEnd(beacon=false){
  const id=state.kwfPresenceSession;
  if(!id||!state.kwfPresenceUserId)return;
  // Keepalive is important: pagehide runs while the tab is closing. The
  // browser may abort this request on a crash; server TTL then takes over.
  const config=typeof window!=='undefined'?window.KWF_CONFIG:null;
  const token=state.kwfPresenceToken;
  if(beacon&&token&&config?.supabaseUrl&&config?.supabasePublishableKey&&typeof fetch==='function'){
    try{
      fetch(config.supabaseUrl.replace(/\/$/,'')+'/rest/v1/rpc/kwf_staff_presence_end',{
        method:'POST',keepalive:true,
        headers:{
          'Content-Type':'application/json',
          'apikey':config.supabasePublishableKey,
          'Authorization':'Bearer '+token
        },
        body:JSON.stringify({p_session:id})
      }).catch(()=>{});
    }catch(err){console.warn('Presence leave not sent',err);}
    return;
  }
  if(state.client?.rpc)state.client.rpc('kwf_staff_presence_end',{p_session:id})
    .then(({error})=>{if(error)console.warn('Could not end staff online status:',error.message);})
    .catch(()=>{});
}
async function kwfPresenceHeartbeat(){
  if(state.kwfPresenceBusy||!state.client?.rpc||!state.user||kwfUserRole()!=='staff')return;
  if(typeof document!=='undefined'&&document.visibilityState==='hidden')return;
  const id=kwfPresenceGetSessionId();
  if(!id)return;
  state.kwfPresenceBusy=true;
  try{
    const session=await state.client.auth.getSession();
    if(session.error||!session.data?.session) return;
    state.kwfPresenceToken=session.data.session.access_token||'';
    state.kwfPresenceUserId=state.user.id;
    const result=await state.client.rpc('kwf_staff_heartbeat',{p_session:id});
    if(result.error)console.warn('Staff presence heartbeat:',result.error.message);
  }catch(err){console.warn('Staff presence temporarily unavailable',err);}
  finally{state.kwfPresenceBusy=false;}
}
async function kwfPresenceReadOwner(){
  if(state.kwfPresenceReadBusy||!state.client?.rpc||!state.user||!kwfOwnerOnly())return;
  state.kwfPresenceReadBusy=true;
  try{
    const result=await state.client.rpc('kwf_staff_online_list');
    if(result.error)throw result.error;
    const list=Array.isArray(result.data)?result.data:[];
    state.kwfOnlineStaff=list.filter(x=>x&&typeof x.user_id==='string');
    kwfPresencePaint();
  }catch(err){console.warn('Staff online lookup temporarily unavailable:',err?.message||err);}
  finally{state.kwfPresenceReadBusy=false;}
}
function kwfPresenceBindAuth(){
  if(state.kwfPresenceBound||!state.client?.auth?.onAuthStateChange)return;
  state.kwfPresenceBound=true;
  state.client.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'){
      kwfPresenceEnd(true);
      state.kwfPresenceUserId='';
      state.kwfPresenceToken='';
      state.kwfOnlineStaff=[];
    }else if(session?.access_token){
      state.kwfPresenceToken=session.access_token;
    }
  });
}
const kwfV5PriorRefresh=refresh;
refresh=async function(silent){
  await kwfV5PriorRefresh(silent);
  kwfPresenceBindAuth();
  if(!state.user||!state.client){
    state.kwfOnlineStaff=[];
    return;
  }
  if(kwfUserRole()==='staff')await kwfPresenceHeartbeat();
  if(kwfOwnerOnly())await kwfPresenceReadOwner();
};
// Refresh presence without reloading a form or interrupting text entry.
if(typeof setInterval==='function'){
  setInterval(()=>{
    if(kwfUserRole()==='staff')kwfPresenceHeartbeat();
    else if(kwfOwnerOnly())kwfPresenceReadOwner();
  },25000);
  // Auth initialization may be async on slow 4G; bind when ready.
  setInterval(()=>{if(!state.kwfPresenceBound)kwfPresenceBindAuth();},4000);
}
if(typeof document!=='undefined'&&typeof document.addEventListener==='function'){
  document.addEventListener('visibilitychange',()=>{
    if(kwfUserRole()!=='staff')return;
    if(document.visibilityState==='hidden')kwfPresenceEnd(true);
    else kwfPresenceHeartbeat();
  });
}
if(typeof window!=='undefined'&&typeof window.addEventListener==='function'){
  window.addEventListener('pagehide',()=>kwfPresenceEnd(true));
}
