// KWF Portal v3: private staff identity & permissions, family aid highlighting,
// donor registration counts, search and password visibility.
state.kwfStaffPerms=[];
state.kwfOwnPermissions={can_review_donations:false,can_manage_payment_accounts:false};
state.kwfDonorRegistrationStats={registered_donors:0,registered_today:0,registered_last_30_days:0};
state.kwfStaffEditName='';
state.kwfSearchText='';
state.kwfLastSearchView='';
state.kwfV3Busy=false;
const kwfV3Text=(ur,en)=>state.language==='ur'?ur:en;
function kwfStaffMemberPermissions(id){
  const x=(state.kwfStaffPerms||[]).find(p=>p.user_id===id);
  return x||{user_id:id,can_review_donations:false,can_manage_payment_accounts:false};
}
function kwfStaffFormV3(member,editing=false){
  const p=member||{};
  const title=editing?kwfV3Text('Staff کی معلومات تبدیل کریں','Update staff details'):kwfV3Text('نیا Staff بنائیں','Create staff member');
  const savedPerson=(state.profiles||[]).find(row=>row.id===p.user_id);
  const name=kwfAccountField('full_name',kwfV3Text('Staff کا پورا نام','Staff full name'),'text',true,'name',p.full_name||savedPerson?.full_name||'');
  const father=kwfAccountField('father_name',kwfV3Text('والد کا نام','Father name'),'text',true,'off',p.father_name||'');
  const cnic=kwfAccountField('cnic',kwfV3Text('CNIC (13 digits, optional)','CNIC (13 digits, optional)'),'text',false,'off',p.cnic||'');
  const mobile=kwfAccountField('mobile',kwfV3Text('موبائل نمبر','Mobile number'),'tel',true,'tel',p.mobile||'');
  const username=editing?
    '<p><b>'+kwfV3Text('Username: ','Username: ')+'</b><span dir="ltr">'+html(p.username||'')+'</span></p>':
    kwfAccountField('username','Username','text',true,'off');
  const pw=editing?'':kwfAccountField('password',kwfV3Text('ابتدائی پاس ورڈ (10+ حروف)','Initial password (10+ characters)'),'password',true,'new-password')+
    kwfAccountField('confirm_password',kwfV3Text('پاس ورڈ دوبارہ','Confirm password'),'password',true,'new-password');
  return '<section class="panel kwf-v3-staff-form"><h3>'+title+'</h3>'+
    '<p class="small muted">'+kwfV3Text(
      'صرف Owner یہ معلومات دیکھ اور بدل سکتا ہے۔ CNIC عام رپورٹس یا Audit Log میں نہیں دکھایا جائے گا۔',
      'Only the Owner may view/edit these details. CNIC is excluded from public pages and audit records.')+'</p>'+
    '<form data-form="'+(editing?'kwfEditStaffV3':'kwfCreateStaffV3')+'">'+
    '<div class="kwf-staff-grid">'+name+father+cnic+mobile+username+pw+'</div>'+
    '<div class="kwf-row-actions"><button class="btn" type="submit">'+
    (editing?kwfV3Text('تبدیلی محفوظ کریں','Save staff details'):kwfV3Text('Staff اکاؤنٹ بنائیں','Create staff account'))+
    '</button>'+(editing?'<button class="btn ghost" type="button" data-action="kwfCancelStaffEditV3">'+kwfV3Text('منسوخ','Cancel')+'</button>':'')+
    '</div></form></section>';
}
function kwfMaskStaffCnic(cnic){
  const digits=String(cnic||'');
  return digits.length===13?'*********'+digits.slice(-4):'—';
}
function kwfStaffTableV3(){
  const rows=(state.kwfStaffAccounts||[]).map(p=>{
    const active=p.is_active!==false;
    const person=(state.profiles||[]).find(x=>x.id===p.user_id);
    return '<tr data-staff-username="'+html(p.username)+'"'+(active?'':' class="kwf-inactive-staff"')+'>'+
      '<td><strong>'+html(p.username)+'</strong><div class="small muted">'+html(person?.full_name||'—')+'</div></td>'+
      '<td>'+html(p.father_name||'—')+'</td><td dir="ltr">'+html(kwfMaskStaffCnic(p.cnic))+'</td>'+
      '<td dir="ltr">'+html(p.mobile||'—')+'</td>'+
      '<td><span class="badge">'+(active?kwfV3Text('فعال','Active'):kwfV3Text('غیر فعال','Disabled'))+'</span></td>'+
      '<td><div class="kwf-row-actions">'+
      (active?'<button class="btn ghost tiny" data-action="kwfEditStaffV3" data-username="'+html(p.username)+'">'+kwfV3Text('ترمیم','Edit')+'</button>'+
       '<button class="btn ghost tiny" data-action="kwfResetStaffV2" data-username="'+html(p.username)+'">'+kwfV3Text('پاس ورڈ بدلیں','Reset password')+'</button>'+
       '<button class="btn tiny danger" data-action="kwfDisableStaffV3" data-username="'+html(p.username)+'">'+kwfV3Text('حذف / بند','Disable / Remove')+'</button>':
       '<button class="btn tiny ghost" data-action="kwfEnableStaffV3" data-username="'+html(p.username)+'">'+kwfV3Text('دوبارہ فعال','Re-enable')+'</button>')+
      '</div></td></tr>';
  });
  return table([kwfV3Text('Username / نام','Username / name'),kwfV3Text('والد کا نام','Father name'),
    'CNIC',kwfV3Text('موبائل','Mobile'),kwfV3Text('حیثیت','Status'),kwfV3Text('انتظام','Manage')],rows);
}
function kwfStaffPermissionPanelV3(){
  const staff=(state.profiles||[]).filter(p=>p.role==='staff');
  if(!staff.length)return '<p class="small muted">'+kwfV3Text('فی الحال کوئی فعال Staff ممبر نہیں۔','No active supporting staff members yet.')+'</p>';
  const rows=staff.map(p=>{
    const flags=kwfStaffMemberPermissions(p.id);
    return '<tr><td><strong>'+html(p.full_name||p.id.slice(0,8))+'</strong></td><td>'+
      '<form data-form="kwfPermissionUpdateV3" class="kwf-permission-form" data-user-id="'+html(p.id)+'">'+
      '<label><input type="checkbox" name="review" '+(flags.can_review_donations?'checked':'')+'> '+
      kwfV3Text('عطیات Approve/Reject','Approve/Reject donations')+'</label>'+
      '<label><input type="checkbox" name="payments" '+(flags.can_manage_payment_accounts?'checked':'')+'> '+
      kwfV3Text('Payment Accounts تبدیل','Edit payment accounts')+'</label>'+
      '<button type="submit" class="btn tiny">'+kwfV3Text('اجازت محفوظ کریں','Save permissions')+'</button></form></td></tr>';
  });
  return '<section class="panel kwf-permissions-panel"><h3>'+kwfV3Text('Staff کے مخصوص اختیارات','Authorize supporting staff')+'</h3>'+
    '<p class="small muted">'+kwfV3Text('مالی اختیارات شروع میں بند ہوتے ہیں۔ صرف ضرورت کے مطابق آن کریں۔ تبدیلی Audit Log میں محفوظ ہوگی۔',
      'Financial permissions are OFF by default. Grant only what each staff member needs. Changes are audited.')+'</p>'+
    table([kwfV3Text('ممبر','Member'),kwfV3Text('اختیارات','Permissions')],rows)+'</section>';
}
const kwfV3PriorStaff=staffView;
staffView=function(){
  if(!kwfOwnerOnly())return kwfV3PriorStaff();
  const member=(state.kwfStaffAccounts||[]).find(p=>p.username===state.kwfStaffEditName);
  const form=kwfStaffFormV3(member||null,Boolean(member));
  const reset=state.kwfResetStaffUsername?
    '<section class="panel"><h3>'+kwfV3Text('Staff کا نیا پاس ورڈ','Reset staff password')+
    ': '+html(state.kwfResetStaffUsername)+'</h3>'+
    '<form data-form="kwfResetStaffPasswordV2" class="kwf-v3-reset-form">'+
    kwfAccountField('password',kwfV3Text('نیا پاس ورڈ','New password'),'password',true,'new-password')+
    kwfAccountField('confirm_password',kwfV3Text('دوبارہ پاس ورڈ','Confirm password'),'password',true,'new-password')+
    '<div class="kwf-row-actions"><button type="submit" class="btn">'+kwfV3Text('محفوظ کریں','Save')+'</button>'+
    '<button class="btn ghost" data-action="kwfCloseResetStaffV2" type="button">'+kwfV3Text('منسوخ','Cancel')+'</button></div></form></section>':'';
  return '<h2 class="sectionTitle">'+kwfV3Text('Staff Management','Staff Management')+'</h2>'+
    form+reset+'<section class="panel"><h3>'+kwfV3Text('Staff کے ریکارڈ','Staff records')+'</h3>'+
    kwfStaffTableV3()+'</section>'+kwfStaffPermissionPanelV3();
};
const kwfV3PriorDonationView=donationsView;
donationsView=function(){
  if(kwfUserRole()==='staff' && state.kwfOwnPermissions.can_review_donations){
    return kwfOldDonationsView(); // Original full receipt review page.
  }
  return kwfV3PriorDonationView();
};
const kwfV3PriorSettingsView=settingsView;
settingsView=function(){
  if(kwfUserRole()==='staff'&&!state.kwfOwnPermissions.can_manage_payment_accounts){
    return '<section class="panel"><p>'+kwfV3Text('Payment Accounts تک Owner نے رسائی نہیں دی۔',
    'Owner approval is required to manage payment accounts.')+'</p></section>';
  }
  let markup=kwfV3PriorSettingsView();
  if(kwfUserRole()==='staff' && state.kwfOwnPermissions.can_manage_payment_accounts){
    markup=markup.replace(/(<button type="submit" class="btn") disabled(>)/,'$1$2');
    markup=markup.replace(/<span class="muted">Only Owner can edit<\/span>/g,'');
    markup=markup.replace(/<span class="muted">صرف Owner تبدیلی کر سکتا ہے<\/span>/g,'');
  }
  return markup;
};
const kwfV3PriorFamiliesView=familiesView;
familiesView=function(){
  let markup=kwfV3PriorFamiliesView();
  const served=new Set((state.aid||[]).filter(a=>!a.voided_at).map(a=>a.beneficiary_id));
  if(!served.size)return markup;
  return markup.replace(/(<tbody>)([\s\S]*?)(<\/tbody>)/,(_all,open,body,close)=>{
    let i=0;
    const updated=body.replace(/<tr(?=[\s>])/g,found=>{
      const f=(state.families||[])[i++];
      return f&&served.has(f.id)?'<tr class="kwf-family-helped"':found;
    });
    return open+updated+close;
  });
};
const kwfV3PriorDashboard=dashboardView;
dashboardView=function(){
  let markup=kwfV3PriorDashboard();
  if(!['owner','admin','staff'].includes(kwfUserRole()))return markup;
  const stats=state.kwfDonorRegistrationStats||{};
  return '<section class="kwf-donor-registration-stats">'+
    '<div class="stats">'+
    stat(kwfV3Text('کل رجسٹرڈ ڈونرز','Total registered donors'),Number(stats.registered_donors||0),'blue')+
    stat(kwfV3Text('آج کی رجسٹریشن','Registered today'),Number(stats.registered_today||0))+
    stat(kwfV3Text('گزشتہ 30 دنوں میں','Registered in 30 days'),Number(stats.registered_last_30_days||0))+
    '</div></section>'+markup;
};
const kwfV3PriorShell=shell;
shell=function(){
  let markup=kwfV3PriorShell();
  if(kwfUserRole()==='staff'){
    if(state.kwfOwnPermissions.can_review_donations)
      markup=markup.replace('<button data-view="families"',
        '<button data-view="donations" class="'+(state.view==='donations'?'active':'')+'"><span class="ico">♡</span>'+t('donations')+'</button>'+
        '<button data-view="families"');
    if(state.kwfOwnPermissions.can_manage_payment_accounts)
      markup=markup.replace('<button data-view="account"',
        '<button data-view="settings" class="'+(state.view==='settings'?'active':'')+'"><span class="ico">⚙</span>'+t('settings')+'</button>'+
        '<button data-view="account"');
  }
  if(state.view!==state.kwfLastSearchView){
    state.kwfLastSearchView=state.view;state.kwfSearchText='';
  }
  const searchBar='<div class="kwf-v3-search"><label>'+
    '<span>⌕ '+kwfV3Text('اس صفحے میں تلاش کریں','Search this page')+'</span>'+
    '<input id="kwf-page-search" type="search" autocomplete="off" aria-label="Search displayed records" placeholder="'+
    kwfV3Text('نام، نمبر، کوڈ یا ریکارڈ تلاش کریں','Search names, IDs, numbers, records')+
    '" value="'+html(state.kwfSearchText||'')+'"></label>'+
    '<button class="btn tiny ghost" type="button" data-action="kwfClearSearchV3">'+
    kwfV3Text('صاف','Clear')+'</button></div>';
  return markup.replace('<main class="content">','<main class="content">'+searchBar);
};
function kwfV3ApplySearch(){
  if(typeof document.querySelector!=='function')return;
  const main=document.querySelector('.main .content');
  if(!main)return;
  const needle=String(state.kwfSearchText||'').trim().toLocaleLowerCase();
  const list=main.querySelectorAll('table tbody tr, article');
  for(const el of list){
    el.hidden=!!needle && !el.textContent.toLocaleLowerCase().includes(needle);
  }
}
document.addEventListener('input',event=>{
  if(event.target?.id==='kwf-page-search'){
    state.kwfSearchText=event.target.value;
    kwfV3ApplySearch();
  }
});
function kwfV3DecoratePasswordInputs(){
  if(typeof document.querySelectorAll!=='function')return;
  for(const el of document.querySelectorAll('input[type="password"]')){
    if(el.dataset.kwfEyeDecorated==='1')continue;
    if(!el.parentNode || typeof document.createElement!=='function')continue;
    const wrap=document.createElement('span');
    wrap.className='kwf-password-container';
    el.parentNode.insertBefore(wrap,el);
    wrap.appendChild(el);
    const button=document.createElement('button');
    button.className='kwf-password-toggle';
    button.type='button';
    button.dataset.action='kwfShowPasswordV3';
    button.setAttribute('aria-label',kwfV3Text('پاس ورڈ دکھائیں','Show password'));
    button.setAttribute('aria-pressed','false');
    button.textContent='👁';
    wrap.appendChild(button);
    el.dataset.kwfEyeDecorated='1';
  }
}
const kwfV3PriorRender=render;
render=function(){
  // Staff CNIC/contact details must not stay in the in-memory app after logout.
  if(!state.user){
    state.kwfStaffAccounts=[];
    state.kwfStaffPerms=[];
    state.kwfOwnPermissions={can_review_donations:false,can_manage_payment_accounts:false};
    state.kwfStaffEditName='';
  }
  kwfV3PriorRender();
  kwfV3DecoratePasswordInputs();
  kwfV3ApplySearch();
};
const kwfV3PriorRefresh=refresh;
refresh=async function(silent){
  await kwfV3PriorRefresh(silent);
  if(!state.client||!state.user)return;
  const isAuthorized=kwfUserRole()==='owner';
  const isStaffUser=kwfUserRole()==='staff';
  if(isAuthorized||isStaffUser){
    try{
      const perms=await state.client.from('kwf_staff_permissions').select('*').limit(500);
      if(perms.error)throw perms.error;
      state.kwfStaffPerms=isAuthorized?(perms.data||[]):[];
      state.kwfOwnPermissions=isStaffUser?(perms.data||[]).find(p=>p.user_id===state.user.id)||
        {can_review_donations:false,can_manage_payment_accounts:false}:
        {can_review_donations:isAuthorized,can_manage_payment_accounts:isAuthorized};
    }catch(err){console.warn('Financial permissions unavailable',errorStr(err));}
  }else{
    state.kwfOwnPermissions={can_review_donations:false,can_manage_payment_accounts:false};
    state.kwfStaffPerms=[];
  }
  if(isAuthorized){
    const accounts=await state.client.from('kwf_staff_accounts').select(
      'user_id,username,created_at,father_name,cnic,mobile,is_active,updated_at').order('created_at',{ascending:false}).limit(300);
    if(!accounts.error)state.kwfStaffAccounts=accounts.data||[];
    else console.warn('Staff identity records unavailable',errorStr(accounts.error));
  }
  if(['owner','admin','staff'].includes(kwfUserRole())){
    try{
      const donor=await state.client.rpc('kwf_registered_donor_stats');
      if(donor.error)throw donor.error;
      if(donor.data?.registered_donors!==undefined)
        state.kwfDonorRegistrationStats=donor.data;
    }catch(err){console.warn('Registered donor count unavailable',errorStr(err));}
  }
  render();
};
const kwfV3PriorProcessForm=processForm;
processForm=async function(form){
  const action=form?.dataset?.form;
  if(!['kwfCreateStaffV3','kwfEditStaffV3','kwfPermissionUpdateV3','settings'].includes(action))
    return kwfV3PriorProcessForm(form);
  if(state.kwfV3Busy)return;
  state.kwfV3Busy=true;
  const button=form.querySelector('button[type=submit]');
  if(button)button.disabled=true;
  try{
    const data=new FormData(form);
    if(action==='settings'){
      if(!(kwfOwnerOnly()||state.kwfOwnPermissions.can_manage_payment_accounts))
        throw new Error('Owner must authorize payment account edits');
      const allowed=['bank_name','bank_title','bank_account','easypaisa_name','easypaisa_number','jazzcash_name','jazzcash_number'];
      const value=Object.fromEntries(allowed.map(name=>[name,String(data.get(name)||'').trim()]));
      const res=await state.client.rpc('kwf_update_payment_accounts',{p_value:value});
      if(res.error)throw res.error;
      notify(kwfV3Text('Payment Accounts محفوظ، Audit Log میں ریکارڈ ہوگئے۔','Payment accounts saved and audited.'));
    }else if(action==='kwfPermissionUpdateV3'){
      if(!kwfOwnerOnly())throw new Error('Owner only');
      const id=form.dataset.userId;
      const result=await state.client.rpc('kwf_set_staff_permissions',{
        p_user_id:id,p_review:data.has('review'),p_payments:data.has('payments')
      });
      if(result.error)throw result.error;
      notify(kwfV3Text('Staff کے اختیارات محفوظ ہوگئے۔','Staff permissions saved.'));
    }else{
      if(!kwfOwnerOnly())throw new Error('Owner only');
      const details={
        full_name:String(data.get('full_name')||'').trim(),
        father_name:String(data.get('father_name')||'').trim(),
        cnic:String(data.get('cnic')||'').trim(),
        mobile:String(data.get('mobile')||'').trim()
      };
      if(!details.full_name||!details.father_name||!details.mobile)
        throw new Error(kwfV3Text('نام، والد کا نام اور موبائل درج کریں۔','Enter name, father name and mobile.'));
      let response;
      if(action==='kwfEditStaffV3'){
        response=await kwfInvokeStaffV2({action:'edit',username:state.kwfStaffEditName,...details});
        state.kwfStaffEditName='';
      }else{
        const pw=String(data.get('password')||'');
        kwfSafePasswordLength(pw);
        if(pw!==String(data.get('confirm_password')||''))throw new Error('Passwords do not match');
        const username=String(data.get('username')||'').toLowerCase().trim();
        response=await kwfInvokeStaffV2({action:'create',username,password:pw,...details});
      }
      notify(kwfV3Text('Staff کی معلومات محفوظ ہوگئیں۔','Staff record saved.'));
    }
    form.reset();
    await refresh(true);
  }catch(err){notify(errorStr(err),true);console.error('KWF staff or payment error',err);}
  finally{state.kwfV3Busy=false;if(button?.isConnected)button.disabled=false;}
};
const kwfV3PriorClickAction=clickAction;
clickAction=async function(el){
  const action=el?.dataset?.action;
  if(action==='kwfShowPasswordV3'){
    const input=el.parentNode?.querySelector('input');
    if(!input)return;
    const show=input.type==='password';
    input.type=show?'text':'password';
    el.setAttribute('aria-label',show?kwfV3Text('پاس ورڈ چھپائیں','Hide password'):kwfV3Text('پاس ورڈ دکھائیں','Show password'));
    el.setAttribute('aria-pressed',show?'true':'false');
    el.textContent=show?'🙈':'👁';
    return;
  }
  if(action==='kwfClearSearchV3'){state.kwfSearchText='';render();return;}
  if(action==='kwfEditStaffV3'){
    if(!kwfOwnerOnly())return;
    state.kwfStaffEditName=String(el.dataset.username||'');
    state.kwfResetStaffUsername='';
    render();return;
  }
  if(action==='kwfCancelStaffEditV3'){state.kwfStaffEditName='';render();return;}
  if(action==='kwfDisableStaffV3'||action==='kwfEnableStaffV3'){
    if(!kwfOwnerOnly())return;
    const username=String(el.dataset.username||'');
    const disabling=action==='kwfDisableStaffV3';
    if(!window.confirm(disabling?
      kwfV3Text('Staff Login بند کریں؟ موجودہ مالی Audit Log محفوظ رہے گا۔',
        'Disable this staff login? The financial audit history will be kept.'):
      kwfV3Text('Staff Login دوبارہ فعال کریں؟ مالی اختیارات بند رہیں گے۔',
        'Re-enable staff login? Financial permissions will remain off.')))return;
    try{
      await kwfInvokeStaffV2({action:disabling?'disable':'enable',username});
      await refresh(true);
      notify(kwfV3Text('Staff کی حیثیت تبدیل ہوگئی۔','Staff access updated.'));
    }catch(err){notify(errorStr(err),true);}
    return;
  }
  return kwfV3PriorClickAction(el);
};
