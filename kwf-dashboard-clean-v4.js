// KWF v4 — focused staff management and donor instructions.
// Loaded after v3, preserving the existing data/auth/approval functionality.
state.kwfDeleteBusy=false;
const kwfV4Word=(ur,en)=>state.language==='ur'?ur:en;

function kwfV4StaffRows(){
  const members=state.kwfStaffAccounts||[];
  if(!members.length){
    return '<div class="kwf-v4-empty">'+kwfV4Word('ابھی کوئی Username Staff اکاؤنٹ نہیں۔','No username-based staff accounts yet.')+'</div>';
  }
  const rows=members.map(member=>{
    const person=(state.profiles||[]).find(p=>p.id===member.user_id);
    const enabled=member.is_active!==false;
    const displayName=person?.full_name||member.username;
    const buttons=[
      enabled?'<button type="button" class="btn ghost tiny" data-action="kwfEditStaffV3" data-username="'+html(member.username)+'">'+kwfV4Word('ترمیم','Edit')+'</button>':'',
      enabled?'<button type="button" class="btn ghost tiny" data-action="kwfResetStaffV2" data-username="'+html(member.username)+'">'+kwfV4Word('پاس ورڈ','Password')+'</button>':'',
      enabled?'<button type="button" class="btn ghost tiny" data-action="kwfDisableStaffV3" data-username="'+html(member.username)+'">'+kwfV4Word('بند کریں','Disable')+'</button>':
        '<button type="button" class="btn ghost tiny" data-action="kwfEnableStaffV3" data-username="'+html(member.username)+'">'+kwfV4Word('فعال کریں','Enable')+'</button>',
      '<button type="button" class="btn tiny kwf-v4-delete" data-action="kwfDeleteMemberV4" data-id="'+html(member.user_id)+'" data-label="'+html(displayName)+'">'+
      kwfV4Word('حذف','Delete')+'</button>'
    ].filter(Boolean).join('');
    return '<tr><td><strong>'+html(displayName)+'</strong><div class="small muted">@'+html(member.username)+'</div></td>'+
      '<td>'+html(member.father_name||'—')+'</td><td>'+html(member.mobile||'—')+'</td>'+
      '<td><span class="badge '+(enabled?'':'kwf-v4-muted-badge')+'">'+(enabled?kwfV4Word('فعال','Active'):kwfV4Word('بند','Disabled'))+'</span></td>'+
      '<td><div class="kwf-v4-actions">'+buttons+'</div></td></tr>';
  });
  return table([
    kwfV4Word('Staff','Staff'),
    kwfV4Word('والد کا نام','Father name'),
    kwfV4Word('موبائل','Mobile'),
    kwfV4Word('حیثیت','Status'),
    kwfV4Word('انتظام','Manage')
  ],rows);
}
function kwfV4TestMembers(){
  // Username staff are managed above, so avoid repeating them below.
  const staffIds=new Set((state.kwfStaffAccounts||[]).map(x=>x.user_id));
  const members=(state.profiles||[])
    .filter(p=>p.role!=='owner'&&!staffIds.has(p.id));
  if(!members.length){
    return '<p class="small muted">'+kwfV4Word('کوئی اضافی ممبر نہیں۔','No other registered accounts.')+'</p>';
  }
  const rows=members.map(member=>{
    const title=member.full_name?.trim()||kwfV4Word('بغیر نام ممبر','Unnamed member');
    const safeId=member.id.slice(0,8)+'…';
    return '<tr><td><b>'+html(title)+'</b><div class="small muted">'+html(safeId)+'</div></td>'+
      '<td><span class="badge">'+html(member.role)+'</span></td>'+
      '<td><div class="kwf-v4-actions">'+
      '<button type="button" class="btn tiny kwf-v4-delete" data-action="kwfDeleteMemberV4" data-id="'+html(member.id)+'" data-label="'+html(title)+'">'+
      kwfV4Word('اکاؤنٹ حذف کریں','Delete account')+'</button>'+
      '</div></td></tr>';
  });
  return table([kwfV4Word('نام','Name'),kwfV4Word('رول','Role'),kwfV4Word('انتظام','Manage')],rows);
}
function kwfV4StaffSummary(){
  const count=(state.kwfStaffAccounts||[]).filter(x=>x.is_active!==false).length;
  const donorCount=(state.profiles||[]).filter(x=>x.role==='donor').length;
  return '<div class="kwf-v4-inline-stats">'+
    '<span><strong>'+count+'</strong> '+kwfV4Word('فعال Staff','Active staff')+'</span>'+
    '<span><strong>'+Number(state.kwfDonorRegistrationStats?.registered_donors||donorCount)+'</strong> '+
    kwfV4Word('رجسٹرڈ Donors','Registered donors')+'</span></div>';
}
const kwfV4PreviousStaffView=staffView;
staffView=function(){
  if(!kwfOwnerOnly()){
    return '<section class="panel"><h3>'+kwfV4Word('Staff Management','Staff management')+'</h3>'+
      '<p class="muted">'+kwfV4Word('Staff اکاؤنٹس صرف Owner منظم کر سکتا ہے۔','Only the Foundation Owner can manage staff accounts.')+'</p></section>';
  }
  const editing=(state.kwfStaffAccounts||[]).find(p=>p.username===state.kwfStaffEditName);
  const editPanel=editing?kwfStaffFormV3(editing,true):'';
  const addPanel=editing?'':kwfStaffFormV3(null,false);
  const reset=state.kwfResetStaffUsername?
    '<section class="panel kwf-v4-reset"><h3>'+kwfV4Word('Staff پاس ورڈ ری سیٹ کریں','Reset staff password')+
    ' — '+html(state.kwfResetStaffUsername)+'</h3>'+
    '<form data-form="kwfResetStaffPasswordV2">'+
    kwfAccountField('password',kwfV4Word('نیا پاس ورڈ (10+ حروف)','New password (10+ characters)'),'password',true,'new-password')+
    kwfAccountField('confirm_password',kwfV4Word('پاس ورڈ دوبارہ','Confirm password'),'password',true,'new-password')+
    '<div class="kwf-v4-actions"><button type="submit" class="btn">'+kwfV4Word('محفوظ کریں','Save password')+'</button>'+
    '<button type="button" class="btn ghost" data-action="kwfCloseResetStaffV2">'+kwfV4Word('منسوخ','Cancel')+'</button></div></form></section>':'';
  const permissions=kwfStaffPermissionPanelV3();
  return '<div class="kwf-v4-admin">'+
    '<header class="kwf-v4-heading"><div><h2 class="sectionTitle">'+kwfV4Word('Staff Management','Staff management')+'</h2>'+
      '<p class="muted small">'+kwfV4Word('ممبرز، رسائی اور محفوظ اکاؤنٹ حذف کرنا','Manage members, access and safe account deletion')+'</p></div>'+
      kwfV4StaffSummary()+'</header>'+
    '<section class="panel kwf-v4-main-list"><div class="kwf-v4-panel-head"><h3>'+kwfV4Word('Staff ممبران','Staff members')+'</h3>'+
      '<span class="muted small">'+kwfV4Word('تبدیلیاں صرف Owner کر سکتا ہے','Owner controlled')+'</span></div>'+
      kwfV4StaffRows()+'</section>'+
    (editing?editPanel:
      '<details class="kwf-v4-details kwf-v4-add-panel"><summary><span class="kwf-v4-summary-icon">+</span> '+
        kwfV4Word('نیا Staff شامل کریں','Add staff member')+'</summary>'+addPanel+'</details>')+
    reset+
    '<details class="kwf-v4-details kwf-v4-permission-details"><summary>🔐 '+
      kwfV4Word('Staff کو مالی اجازت دیں','Staff permissions')+'</summary>'+permissions+'</details>'+
    '<details class="kwf-v4-details kwf-v4-member-details"><summary>♙ '+
      kwfV4Word('Donor / Test Accounts حذف کریں','Manage donor / test accounts')+'</summary>'+
      '<div class="panel"><p class="small muted">'+kwfV4Word(
        'صرف وہ اکاؤنٹس مستقل حذف ہو سکتے ہیں جن کا Donation، Aid یا مالی ریکارڈ نہیں۔ پہلے مالی ریکارڈ چیک ہوگا۔',
        'Only accounts without linked financial or aid records can be permanently deleted. The server checks first.')+
      '</p>'+kwfV4TestMembers()+'</div></details>'+
    '<details class="kwf-v4-details kwf-v4-audit"><summary>▤ '+
      kwfV4Word('تبدیلیوں کی History / Audit Log','Activity & audit log')+'</summary>'+
      kwfActivityPanel()+'</details>'+
    '</div>';
};
// The old "Other members and email invitations" form/section is intentionally
// NOT included; email invitation records remain in Supabase for history.

function kwfV4DonorGuide(compact=false){
  const title=kwfV4Word('عطیہ کیسے جمع کروائیں؟','How to submit a donation');
  const help=kwfV4Word('یہ چار مراحل مکمل کریں۔ رسید اپ لوڈ کرنا خودکار منظوری نہیں ہے۔',
    'Follow these steps. Uploading a receipt does not automatically approve a donation.');
  const items=state.language==='ur'?[
    'Donations & receipts کھولیں اور فاؤنڈیشن کے اصل Bank / JazzCash / Easypaisa اکاؤنٹس دیکھیں۔',
    'انہی تصدیق شدہ اکاؤنٹس میں ادائیگی کریں اور رسید محفوظ رکھیں۔',
    'رقم، Payment Method، Transaction ID لکھیں اور رسید JPG/PNG/PDF اپ لوڈ کریں۔',
    'Submit کرنے کے بعد History میں Pending نظر آئے گا؛ Admin تصدیق کرکے Approve یا Reject کرے گا۔'
  ]:[
    'Open Donations & receipts and check the foundation’s official bank, JazzCash or Easypaisa details.',
    'Pay only to the official account shown, and keep the payment receipt.',
    'Enter amount, payment method and transaction reference; upload a JPG/PNG/PDF receipt.',
    'Submit; your donation appears as Pending until the authorized reviewer verifies and approves or rejects it.'
  ];
  const steps=items.map((item,i)=>'<li><span class="kwf-v4-step">'+(i+1)+'</span><span>'+html(item)+'</span></li>').join('');
  return '<section class="panel kwf-v4-donor-guide'+(compact?' compact':'')+'">'+
    '<div class="kwf-v4-panel-head"><h3>'+title+'</h3>'+
    '<span class="badge">'+kwfV4Word('Donor Guide','Donor guide')+'</span></div>'+
    (compact?'':'<p class="small muted">'+help+'</p>')+
    '<ol class="kwf-v4-steps">'+steps+'</ol>'+
    (compact?'':'<div class="kwf-v4-donor-actions"><button class="btn" type="button" data-view="donations">'+
      kwfV4Word('عطیہ جمع کروائیں','Submit a donation')+' →</button>'+
      '<button class="btn ghost" type="button" data-view="donations">'+
      kwfV4Word('میری رسیدیں دیکھیں','See my donations')+'</button></div>')+
    '</section>';
}
const kwfV4PriorDashboard=dashboardView;
dashboardView=function(){
  const original=kwfV4PriorDashboard();
  if(kwfUserRole()==='donor')return kwfV4DonorGuide()+original;
  if(!['owner','admin','staff'].includes(kwfUserRole()))return original;
  const stats=state.kwfDonorRegistrationStats||{};
  const narrow='<div class="kwf-v4-donors-compact"><strong>'+kwfV4Word('رجسٹرڈ Donors','Registered donors')+
    ': '+Number(stats.registered_donors||0)+'</strong>'+
    '<span>'+kwfV4Word('آج','Today')+': '+Number(stats.registered_today||0)+'</span>'+
    '<span>'+kwfV4Word('30 دن','30 days')+': '+Number(stats.registered_last_30_days||0)+'</span></div>';
  return original.replace(/<section class="kwf-donor-registration-stats">[\s\S]*?<\/section>/,narrow);
};
const kwfV4PriorDonations=donationsView;
donationsView=function(){
  const base=kwfV4PriorDonations();
  if(kwfUserRole()==='donor'){
    return kwfV4DonorGuide(true)+base;
  }
  if(!isStaff() || state.reviewId)return base;
  // An empty Pending tab is not an error: donors must first submit receipts.
  const pending=(state.donations||[]).filter(d=>d.status==='pending'&&!d.deleted_at);
  if(pending.length===0&&(state.filter||'pending')==='pending'){
    return '<div class="kwf-v4-empty-review">'+kwfV4Word(
      'ابھی تصدیق کے لیے کوئی نئی رسید نہیں آئی۔ Donor اپنے اکاؤنٹ سے عطیہ جمع کرے تو یہاں نظر آئے گا۔',
      'No pending receipts. A donation appears here after a donor submits it from their own account.')+
      '</div>'+base;
  }
  return base;
};
const kwfV4PriorShell=shell;
shell=function(){
  let body=kwfV4PriorShell();
  if(kwfUserRole()!=='owner'){
    body=body.replace(/<button data-view="staff"[^>]*>[\s\S]*?<\/button>/,'');
  }
  // Avoid a search input above information-only dashboards and profile pages.
  if(['dashboard','account'].includes(state.view)){
    body=body.replace(/<div class="kwf-v3-search">[\s\S]*?<\/div>/,'');
  }
  return body;
};
async function kwfV4CallDelete(action,id,confirmation){
  const res=await state.client.functions.invoke('kwf-delete-member',{
    body:{action,user_id:id,...(confirmation?{confirmation}:{})}
  });
  let payload=res.data||{};
  if(res.error){
    try{
      if(res.error.context&&typeof res.error.context.json==='function')
        payload=await res.error.context.json();
    }catch(_ignored){}
    throw new Error(payload.error||res.error.message||'Member service could not complete request');
  }
  if(payload.error)throw new Error(payload.error);
  return payload;
}
const kwfV4PriorClick=clickAction;
clickAction=async function(el){
  if(el?.dataset?.action==='kwfDeleteMemberV4'){
    if(!kwfOwnerOnly()||!state.user)return;
    if(state.kwfDeleteBusy)return;
    const id=String(el.dataset.id||'');
    if(!/^[0-9a-f-]{36}$/i.test(id) || id===state.user.id)return;
    state.kwfDeleteBusy=true;
    const btn=el;
    btn.disabled=true;
    try{
      const preview=await kwfV4CallDelete('preview',id);
      if(preview.status!=='eligible'||!preview.allowed){
        notify(kwfV4Word(
          'اس ممبر کا مالی یا امدادی ریکارڈ موجود ہے، اس لیے مستقل حذف نہیں کر سکتے۔ Staff کے لیے Disable استعمال کریں۔',
          'This account has financial, aid or dependent records and cannot be permanently deleted. For staff, use Disable instead.'),true);
        return;
      }
      const display=preview.display_name||el.dataset.label||'member';
      const question=kwfV4Word(
        'کیا آپ واقعی '+display+' کا اکاؤنٹ اور Login ہمیشہ کے لیے ختم کرنا چاہتے ہیں؟\\nپرانا Audit Log محفوظ رہے گا۔ یہ کام واپس نہیں ہو سکتا۔',
        'Permanently DELETE the account and login for '+display+'?\\nAudit history will be preserved. This cannot be undone.');
      if(!window.confirm(question))return;
      const typed=window.prompt(kwfV4Word('تصدیق کے لیے DELETE لکھیں:','Type DELETE to confirm permanent deletion:'));
      if(typed!=='DELETE'){
        if(typed!==null)notify(kwfV4Word('حذف منسوخ کر دیا گیا۔','Deletion cancelled.'));
        return;
      }
      const result=await kwfV4CallDelete('delete',id,'DELETE');
      if(result.status!=='deleted')throw new Error('Deletion did not complete');
      await refresh(true);
      notify(kwfV4Word('Test اکاؤنٹ حذف ہوگیا؛ Audit History برقرار ہے۔',
        'The account and login were deleted. Audit history remains.'));
    }catch(err){
      notify(errorStr(err),true);console.error('KWF member deletion failed',err);
    }finally{
      state.kwfDeleteBusy=false;
      if(btn.isConnected)btn.disabled=false;
    }
    return;
  }
  return kwfV4PriorClick(el);
};
