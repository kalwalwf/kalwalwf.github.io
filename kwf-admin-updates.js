// KWF staff, audited edits, owner activity alerts and accessible forms.
// Loaded AFTER existing app.js, website-enhancements.js and password-recovery.js.
state.kwfEdit = null;
state.kwfStaffInvites = [];
state.kwfActivity = [];
state.kwfUnread = 0;
state.kwfStaffBusy = false;
state.kwfInviteEmailBusy = false;

// Staff approval and actual email delivery are independent operations.
// A provider-accepted request is NOT proof of inbox delivery.
async function kwfSendStaffEmail(email){
  if(!kwfOwnerOnly()) throw new Error('Only the Owner can send invitations');
  if(!state.client || !state.client.functions) throw new Error('Email function unavailable. Refresh this page.');
  var result=await state.client.functions.invoke('kwf-send-staff-invite',{body:{email:String(email).trim()}});
  var response=result.data||{};
  if(result.error){
    if(result.error.context && typeof result.error.context.json==='function'){
      try{response=await result.error.context.json();}catch(e){/* network errors lack JSON */}
    }
    throw new Error(response.error || response.provider_error || result.error.message || 'Invitation email failed');
  }
  if(response.status==='accepted'){
    notify(kwfWord('Supabase نے ای میل بھیجنے کی درخواست قبول کی۔ وصول کنندہ Inbox/Spam دیکھے۔','Email request accepted by Supabase. Ask the recipient to check Inbox/Spam.'));
  }else if(response.status==='existing_account'){
    notify(kwfWord('یہ ای میل پہلے سے رجسٹرڈ ہے؛ ممبر Login یا Forgot Password استعمال کرے۔','This email already has an account. Ask the member to sign in or use Forgot Password.'));
  }else{
    notify(response.message || 'Invitation result: '+String(response.status||'unknown'));
  }
  return response;
}
function kwfDeliveryLabel(inv){
  var stateValue=inv.delivery_state||'not_requested';
  if(stateValue==='accepted') return kwfWord('بھیجنے کی درخواست قبول ہوئی؛ Inbox/Spam دیکھیں','Request accepted; check Inbox/Spam');
  if(stateValue==='sending') return kwfWord('بھیج رہے ہیں…','Sending…');
  if(stateValue==='failed') return kwfWord('ای میل نہیں گئی','Email not sent');
  if(stateValue==='existing_account') return kwfWord('اکاؤنٹ پہلے سے موجود','Account already exists');
  return kwfWord('ای میل ابھی نہیں بھیجی گئی','Email not sent yet');
}
function kwfManualInvitationHref(email){
  var subject='KWF Supporting Staff Invitation';
  var body='You have been approved to join Kalwal Welfare Foundation as supporting staff.\n\nPlease visit https://kalwalwf.github.io/ and use Create donor account with this exact email, then verify the email and sign in. Your staff access is approved by the Owner.\n\nKWF Admin Team';
  return 'mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}

function kwfWord(ur, en) {
  return state.language === 'ur' ? ur : en;
}
function kwfUserRole() {
  return state.profile && state.profile.role || 'donor';
}
function kwfEditAllowed() {
  return ['owner','admin','staff'].includes(kwfUserRole());
}
function kwfOwnerOnly() {
  return kwfUserRole()==='owner';
}
function kwfProfileName(id) {
  var p = (state.profiles||[]).find(function(x){return x.id===id;});
  return p ? (p.full_name || p.id.slice(0,8)) : ((id||'').slice(0,8));
}
function kwfEditColumn(markup, rows, kind) {
  if (!kwfEditAllowed() || !Array.isArray(rows) || !rows.length) return markup;
  return markup.replace(/(<table class="dataTable"><thead><tr>)([\s\S]*?)(<\/tr><\/thead><tbody>)([\s\S]*?)(<\/tbody>)/,
    function(_all, start, headers, middle, body, end) {
      var index=0;
      var newRows=body.replace(/<\/tr>/g,function(){
        var r=rows[index++];
        if (!r) return '</tr>';
        return '<td><button type="button" class="btn tiny kwf-edit-button" data-action="kwfEditRecord" data-kind="'+html(kind)+'" data-id="'+html(r.id)+'">'+kwfWord('ترمیم','Edit')+'</button></td></tr>';
      });
      return start+headers+'<th>'+kwfWord('ترمیم','Edit')+'</th>'+middle+newRows+end;
    });
}
const kwfOldFamiliesView = familiesView;
familiesView = function() { return kwfEditColumn(kwfOldFamiliesView(),state.families,'beneficiary'); };
const kwfOldExpensesView = expensesView;
expensesView = function() { return kwfEditColumn(kwfOldExpensesView(),state.expenses,'expense'); };
const kwfOldAidView = aidView;
aidView = function() { return kwfEditColumn(kwfOldAidView(),state.aid,'aid'); };
const kwfOldCampaignsCards = campaignsCards;
campaignsCards = function(records,compact) {
  if (!kwfEditAllowed() || !(records||[]).length) return kwfOldCampaignsCards(records,compact);
  return records.filter(function(x){return !x.archived_at;}).map(function(rec){
    var card=kwfOldCampaignsCards([rec],compact);
    return card.replace('</article>',
      '<div class="record-tools"><button type="button" class="btn tiny kwf-edit-button" data-action="kwfEditRecord" data-kind="campaign" data-id="'+html(rec.id)+'">'+kwfWord('ترمیم','Edit')+'</button></div></article>');
  }).join('');
};
const kwfOldDonationsView = typeof donationsView === 'function' ? donationsView : null;
if (kwfOldDonationsView) {
  donationsView = function(){
    if (kwfUserRole()==='staff') return '<section class="panel"><h3>'+kwfWord('عطیات کی منظوری','Donation approvals')+'</h3><p>'+kwfWord('صرف Owner یا Admin عطیات کی تصدیق کر سکتے ہیں۔','Only Owner or Admin may review donations.')+'</p></section>';
    return kwfOldDonationsView();
  };
}

function kwfInputField(name,label,value,kind,required,items) {
  var textValue = value==null ? '' : String(value);
  var field='<label class="kwf-field"><span>'+html(label)+'</span>';
  if (kind==='select') {
    field+='<select name="'+html(name)+'"'+(required?' required':'')+'>';
    (items||[]).forEach(function(o){
      field+='<option value="'+html(o[0])+'"'+(String(o[0])===textValue?' selected':'')+'>'+html(o[1])+'</option>';
    });
    field+='</select>';
  } else if (kind==='textarea') {
    field+='<textarea name="'+html(name)+'" rows="2"'+(required?' required':'')+'>'+html(textValue)+'</textarea>';
  } else {
    var min = kind==='number' ? ' min="0.01" step="0.01"' : '';
    field+='<input name="'+html(name)+'" type="'+html(kind||'text')+'" value="'+html(textValue)+'"'+(required?' required':'')+min+'>';
  }
  return field+'</label>';
}
function kwfEditModal() {
  if (!state.kwfEdit) return '';
  var edit=state.kwfEdit, rec=edit.record, kind=edit.kind, fields=[];
  if (kind==='beneficiary') {
    fields=[
      kwfInputField('family_code',kwfWord('فیملی کوڈ','Family code'),rec.family_code,'text',true),
      kwfInputField('family_name',kwfWord('خاندان کا نام','Family name'),rec.family_name,'text',true),
      kwfInputField('contact_phone',kwfWord('فون','Phone'),rec.contact_phone,'tel'),
      kwfInputField('category',kwfWord('قسم','Category'),rec.category,'select',true,
        ['general','orphan','widow','medical','education'].map(function(x){return [x,x];})),
      kwfInputField('status',kwfWord('حیثیت','Status'),rec.status,'select',true,[['active','Active'],['inactive','Inactive']]),
      kwfInputField('address',kwfWord('پتہ','Address'),rec.address,'textarea'),
      kwfInputField('notes',kwfWord('نوٹس','Notes'),rec.notes,'textarea')
    ];
  } else if (kind==='campaign') {
    fields=[
      kwfInputField('title',kwfWord('مہم کا نام','Campaign title'),rec.title,'text',true),
      kwfInputField('target_pkr',kwfWord('ہدف رقم','Target PKR'),rec.target_pkr,'number',true),
      kwfInputField('status',kwfWord('حیثیت','Status'),rec.status,'select',true,[['active','Active'],['paused','Paused']]),
      kwfInputField('description',kwfWord('تفصیل','Description'),rec.description,'textarea')
    ];
  } else if (kind==='expense') {
    fields=[
      kwfInputField('category',kwfWord('قسم','Category'),rec.category,'select',true,
       ['operations','transport','medical','ration','other'].map(function(x){return [x,x];})),
      kwfInputField('amount_pkr',kwfWord('رقم','Amount PKR'),rec.amount_pkr,'number',true),
      kwfInputField('spent_on',kwfWord('تاریخ','Date'),rec.spent_on,'date',true),
      kwfInputField('description',kwfWord('تفصیل','Description'),rec.description,'textarea',true)
    ];
  } else if (kind==='aid') {
    var families=(state.families||[]).map(function(f){return [f.id,f.family_code+' — '+f.family_name];});
    var campaigns=[['',kwfWord('بغیر مہم','None')]].concat((state.campaigns||[]).map(function(c){return [c.id,c.title];}));
    fields=[
      kwfInputField('beneficiary_id',kwfWord('خاندان','Family'),rec.beneficiary_id,'select',true,families),
      kwfInputField('aid_type',kwfWord('امداد کی قسم','Aid type'),rec.aid_type,'select',true,
       ['ration','medical','cash','education','other'].map(function(x){return [x,x];})),
      kwfInputField('amount_pkr',kwfWord('رقم','Amount PKR'),rec.amount_pkr,'number',true),
      kwfInputField('aided_on',kwfWord('تاریخ','Date'),rec.aided_on,'date',true),
      kwfInputField('campaign_id',kwfWord('مہم','Campaign'),rec.campaign_id||'','select',false,campaigns),
      kwfInputField('description',kwfWord('تفصیل','Description'),rec.description,'textarea')
    ];
  }
  return '<div class="kwf-modal-backdrop" role="presentation"><section class="kwf-modal" role="dialog" aria-modal="true" aria-label="'+kwfWord('ریکارڈ میں ترمیم','Edit record')+'"><header class="kwf-modal-head"><h2>'+kwfWord('ریکارڈ میں ترمیم','Edit record')+'</h2><button type="button" class="btn ghost tiny" data-action="kwfCloseEdit">✕</button></header>'+
    '<form data-form="kwfSaveEdit"><div class="kwf-edit-grid">'+fields.join('')+'</div>'+
    kwfInputField('reason',kwfWord('تبدیلی کی وجہ (کم از کم 5 حروف)','Reason for change (5+ characters)'),'','textarea',true)+
    '<div class="kwf-modal-actions"><button type="button" class="btn ghost" data-action="kwfCloseEdit">'+kwfWord('منسوخ','Cancel')+'</button>'+
    '<button class="btn" type="submit">'+kwfWord('تبدیلی محفوظ کریں','Save changes')+'</button></div></form></section></div>';
}

function kwfStaffMemberRows(){
  // Legacy fallback: never expose role-promotion actions or invitation UI.
  // Use the same audited, Owner-only deletion endpoint as the current page.
  return (state.profiles||[]).map(function(p){
    var isOwner=p.role==='owner';
    var safeName=p.full_name?.trim() || kwfWord('بغیر نام ممبر','Unnamed member');
    var staffAccount=(state.kwfStaffAccounts||[]).some(a=>a.user_id===p.id);
    var eligibleStaff=p.role==='staff'||staffAccount;
    var buttons=kwfOwnerOnly()&&!isOwner&&p.role!=='admin'&&eligibleStaff?
      '<button type="button" class="btn tiny kwf-v4-delete" data-action="kwfDeleteMemberV4" data-id="'+html(p.id)+'" data-label="'+html(safeName)+'">'+
      kwfWord('ممبر حذف کریں','Delete member')+'</button>':'—';
    return '<tr><td><b>'+html(safeName)+'</b><div class="small muted">'+html((p.id||'').slice(0,8))+'…</div></td>'+
      '<td>'+html(p.phone||'—')+'</td><td><span class="badge">'+html(p.role)+'</span></td><td>'+buttons+'</td></tr>';
  });
}
function kwfStaffInviteRows(){
  return (state.kwfStaffInvites||[]).map(function(inv){
    var delivery=kwfDeliveryLabel(inv);
    var deliveryDetail=inv.delivery_state==='failed' && inv.last_email_response ?
      '<div class="small kwf-invite-failed">'+html(inv.last_email_response)+'</div>' : '';
    var manage='—';
    if(inv.status!=='revoked'){
      manage='<div class="kwf-row-actions">';
      if(inv.status==='pending'){
        manage+='<button type="button" class="btn tiny kwf-invite-send" data-action="kwfSendInvite" data-email="'+html(inv.email)+'">'+
          (inv.delivery_state==='accepted'?kwfWord('دوبارہ ای میل بھیجیں','Resend email'):kwfWord('ای میل بھیجیں','Send email'))+'</button>';
        manage+='<a class="btn tiny ghost kwf-invite-manual" href="'+html(kwfManualInvitationHref(inv.email))+'">'+
          kwfWord('Gmail/Email سے بھیجیں','Send manually')+'</a>';
      }
      manage+='<button type="button" class="btn tiny danger" data-action="kwfCancelInvite" data-id="'+html(inv.id)+'">'+kwfWord('منسوخ','Revoke')+'</button></div>';
    }
    return '<tr><td>'+html(inv.email)+'</td><td><span class="badge">'+html(inv.status)+'</span></td><td>'+
      '<span class="kwf-delivery-state">'+html(delivery)+'</span>'+deliveryDetail+'</td><td>'+
      shortDate(inv.invited_at)+'</td><td>'+manage+'</td></tr>';
  });
}
function kwfActivityPanel(){
  if (!kwfOwnerOnly()) return '';
  var unread=Number(state.kwfUnread||0);
  var items=(state.kwfActivity||[]).slice(0,75);
  var rows=items.map(function(a){
    var style=a.actor_role==='staff' && !a.seen_by_owner_at ? ' class="kwf-unread-row"' : '';
    return '<tr'+style+'><td>'+html(shortDate(a.created_at))+'</td><td>'+html(kwfProfileName(a.actor_id))+
      '<div class="small muted">'+html(a.actor_role||'—')+'</div></td><td>'+html(a.record_type||'—')+
      '</td><td>'+html(a.action||'—')+'</td><td class="kwf-long">'+html(a.reason||'—')+'</td></tr>';
  });
  return '<section class="panel kwf-activity-panel" id="kwf-activity"><div class="panelhead"><h3>'+kwfWord('Staff تبدیلیاں / Audit Log','Staff activity / Audit log')+
    '</h3><div class="kwf-row-actions"><span class="badge">'+unread+' '+kwfWord('نئی اطلاعات','new alerts')+'</span>'+
    '<button class="btn tiny ghost" type="button" data-action="kwfMarkSeen">'+kwfWord('سب دیکھ لیا','Mark all read')+'</button></div></div>'+
    '<p class="muted small">'+kwfWord('ہر ترمیم کا نام، تاریخ اور وجہ سرور پر محفوظ ہوتی ہے۔','The server saves who changed a record, the time and reason.')+'</p>'+
    table([kwfWord('تاریخ','Date'),kwfWord('ممبر','Member'),kwfWord('ریکارڈ','Record'),kwfWord('عمل','Action'),kwfWord('وجہ','Reason')],rows)+'</section>';
}
staffView = function(){
  if (!isStaff()) return limited();
  if (!kwfOwnerOnly()) return '<section class="panel"><h3>'+kwfWord('اسٹاف مینجمنٹ','Staff management')+'</h3>'+
    '<p>'+kwfWord('صرف Owner ممبرز کو منظم کر سکتا ہے۔','Only Owner can manage members.')+'</p></section>';
  return '<h2 class="sectionTitle">'+kwfWord('اسٹاف مینجمنٹ','Staff management')+'</h2>'+
    '<section class="panel"><h3>'+kwfWord('رجسٹرڈ ممبران','Registered members')+'</h3>'+
    table([kwfWord('نام','Name'),kwfWord('فون','Phone'),kwfWord('رول','Role'),kwfWord('انتظام','Manage')],kwfStaffMemberRows())+
    '</section>'+kwfActivityPanel();
};

// Supabase invitation links sign the recipient in without requiring a password.
// Allow the invited staff member to set one securely before the first logout.
const kwfOldAccountView = accountView;
accountView = function(){
  var markup=kwfOldAccountView();
  if (kwfUserRole()!=='staff') return markup;
  var passwordSection='<section class="panel kwf-staff-password-panel"><h3>'+
    kwfWord('اپنا لاگ اِن پاس ورڈ بنائیں','Set your login password')+'</h3>'+
    '<p class="small muted">'+kwfWord('دعوتی لنک سے لاگ اِن ہونے کے بعد اپنا مستقل پاس ورڈ مقرر کریں، تاکہ آئندہ Login کر سکیں۔',
      'After opening your invitation link, set a password so you can sign in again later.')+'</p>'+
    '<form data-form="kwfStaffSetPassword" class="kwf-staff-password-form">'+
    kwfInputField('new_password',kwfWord('نیا پاس ورڈ','New password'),'','password',true)+
    kwfInputField('confirm_password',kwfWord('پاس ورڈ دوبارہ درج کریں','Confirm password'),'','password',true)+
    '<button type="submit" class="btn">'+kwfWord('پاس ورڈ محفوظ کریں','Save password')+'</button>'+
    '</form></section>';
  return markup+passwordSection;
};

const kwfOldShell = shell;
shell = function(){
  var markup=kwfOldShell();
  if (kwfUserRole()==='staff'){
    markup=markup.replace(/<button data-view="(?:donations|settings|staff)"[^>]*>[\s\S]*?<\/button>/g,'');
  }
  if (kwfOwnerOnly()) {
    markup=markup.replace('<div class="topactions">',
      '<div class="topactions"><button class="btn tiny kwf-alert-button" data-action="kwfActivity" title="Staff activity">'+
      '🔔 '+html(String(state.kwfUnread||0))+'</button>');
  }
  if (state.kwfEdit) markup=markup.replace('</main>',kwfEditModal()+'</main>');
  return markup;
};

const kwfOldRefresh = refresh;
refresh = async function(silent){
  // A verified, owner-approved invitation is activated on the first login.
  if (state.client && state.user){
    try { await state.client.rpc('kwf_accept_staff_invitation'); }
    catch(e){ console.warn('Staff invitation check failed',e); }
  }
  await kwfOldRefresh(silent);
  if (state.client && kwfOwnerOnly()){
    try {
      var items=await Promise.all([
        state.client.from('staff_invites').select('*').order('invited_at',{ascending:false}).limit(200),
        state.client.from('record_actions').select('id,record_type,action,actor_id,actor_role,reason,created_at,seen_by_owner_at').order('created_at',{ascending:false}).limit(250),
        state.client.from('record_actions').select('id',{head:true,count:'exact'}).eq('actor_role','staff').is('seen_by_owner_at',null)
      ]);
      for (var x of items) if (x.error) throw x.error;
      state.kwfStaffInvites=items[0].data||[];
      state.kwfActivity=items[1].data||[];
      state.kwfUnread=items[2].count||0;
    }catch(err){ console.warn('KWF staff activity unavailable:',errorStr(err)); }
    render();
  } else {
    state.kwfStaffInvites=[];
    state.kwfActivity=[];
    state.kwfUnread=0;
  }
};

const kwfOldProcessForm = processForm;
processForm = async function(form){
  var action=form.dataset.form;
  if (action!=='kwfStaffInvite' && action!=='kwfSaveEdit' && action!=='kwfStaffSetPassword') return kwfOldProcessForm(form);
  if (state.kwfStaffBusy) return;
  state.kwfStaffBusy=true;
  var button=form.querySelector('button[type="submit"]');
  if (button) button.disabled=true;
  try{
    if (action==='kwfStaffSetPassword'){
      if(kwfUserRole()!=='staff') throw new Error('Only signed-in staff can use this form');
      var values=new FormData(form);
      var password=String(values.get('new_password')||'');
      var confirmPassword=String(values.get('confirm_password')||'');
      if(password.length<8) throw new Error(kwfWord('پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔','Use at least 8 characters.'));
      if(password!==confirmPassword) throw new Error(kwfWord('دونوں پاس ورڈ ایک جیسے نہیں۔','Passwords do not match.'));
      var saved=await state.client.auth.updateUser({password:password});
      if(saved.error) throw saved.error;
      form.reset();
      notify(kwfWord('پاس ورڈ محفوظ ہوگیا۔ آئندہ اسی پاس ورڈ سے Login کریں۔','Password saved. Use it to sign in next time.'));
      return;
    }
    if (action==='kwfStaffInvite'){
      if (!kwfOwnerOnly()) throw new Error('Owner only');
      var email=String(new FormData(form).get('email')||'').trim();
      var result=await state.client.rpc('kwf_invite_staff',{p_email:email});
      if (result.error) throw result.error;
      if(result.data&&result.data.status==='active'){
        notify(kwfWord('ممبر پہلے سے رجسٹرڈ ہے اور Staff بنا دیا گیا ہے۔','Existing verified member activated as staff.'));
      }else{
        try{
          await kwfSendStaffEmail(email);
        }catch(emailError){
          notify(kwfWord('دعوت محفوظ ہے لیکن ای میل نہیں گئی: ','Staff approved but email could not be sent: ')+errorStr(emailError),true);
        }
      }
      await refresh(true);
      return;
    }
    if (!kwfEditAllowed() || !state.kwfEdit) throw new Error('Access denied');
    var data=Object.fromEntries(new FormData(form).entries());
    var reason=String(data.reason||'').trim();
    delete data.reason;
    if (reason.length<5) throw new Error(kwfWord('تبدیلی کی وجہ کم از کم 5 حروف ہو۔','Please enter a reason of at least 5 characters.'));
    var kind=state.kwfEdit.kind, id=state.kwfEdit.record.id;
    var result2=await state.client.rpc('kwf_update_record',{p_kind:kind,p_id:id,p_changes:data,p_reason:reason});
    if (result2.error) throw result2.error;
    state.kwfEdit=null;
    notify(kwfWord('ترمیم اور Audit Log محفوظ ہوگئے۔','Changes and audit log saved.'));
    await refresh(true);
  }catch(err){notify(errorStr(err),true);console.error(err);}
  finally {state.kwfStaffBusy=false;if (button&&button.isConnected) button.disabled=false;}
};

const kwfOldClickAction = clickAction;
clickAction = async function(el){
  var act=el.dataset.action;
  try{
    if(act==='kwfSendInvite'){
      if(!kwfOwnerOnly()) throw new Error('Owner only');
      if(state.kwfInviteEmailBusy) return;
      state.kwfInviteEmailBusy=true;
      el.disabled=true;
      try{
        await kwfSendStaffEmail(el.dataset.email);
      }catch(sendError){
        notify(kwfWord('ای میل نہیں گئی: ','Email not sent: ')+errorStr(sendError),true);
      }finally{
        state.kwfInviteEmailBusy=false;
        await refresh(true);
      }
      return;
    }
    if (act==='kwfEditRecord'){
      if (!kwfEditAllowed()) throw new Error('No edit permission');
      var kind=el.dataset.kind,id=el.dataset.id;
      var list=kind==='beneficiary'?state.families:kind==='expense'?state.expenses:kind==='aid'?state.aid:kind==='campaign'?state.campaigns:[];
      var r=list.find(function(x){return x.id===id;});
      if (!r) throw new Error('Record not found');
      state.kwfEdit={kind:kind,record:r};
      render();
      return;
    }
    if (act==='kwfCloseEdit'){state.kwfEdit=null;render();return;}
    if (act==='kwfSetRole'){
      if (!kwfOwnerOnly()) throw new Error('Owner only');
      var who=kwfProfileName(el.dataset.id),role=el.dataset.role;
      if (!['donor','staff','admin'].includes(role)) return;
      if (!confirm(kwfWord('کیا '+who+' کا رول '+role+' کرنا ہے؟','Change '+who+' to '+role+'?'))) return;
      var r2=await state.client.rpc('kwf_set_staff_role',{p_user_id:el.dataset.id,p_role:role});
      if (r2.error) throw r2.error;
      await refresh(true); notify(kwfWord('رسائی تبدیل ہوگئی۔','Access updated.'));return;
    }
    if (act==='kwfCancelInvite'){
      if (!kwfOwnerOnly()) throw new Error('Owner only');
      if (!confirm(kwfWord('یہ دعوت منسوخ کریں؟','Revoke this invitation?'))) return;
      var r3=await state.client.rpc('kwf_cancel_staff_invite',{p_invite_id:el.dataset.id});
      if (r3.error) throw r3.error;
      await refresh(true);notify(kwfWord('دعوت منسوخ ہوگئی۔','Invitation revoked.'));return;
    }
    if (act==='kwfMarkSeen'){
      if (!kwfOwnerOnly()) throw new Error('Owner only');
      var r4=await state.client.rpc('kwf_mark_staff_activity_seen');
      if (r4.error) throw r4.error;
      await refresh(true);notify(kwfWord('تمام اطلاعات پڑھ لی گئیں۔','Alerts marked as read.'));return;
    }
    if (act==='kwfActivity'){
      if (!kwfOwnerOnly()) return;
      state.view='staff';render();
      document.getElementById('kwf-activity')?.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
  }catch(err){notify(errorStr(err),true);console.error(err);return;}
  return kwfOldClickAction(el);
};

// Refresh owner notification badges once a minute while the admin app is open.
setInterval(function(){
  if (!state.client || !state.user || !kwfOwnerOnly()) return;
  state.client.from('record_actions').select('id',{head:true,count:'exact'})
    .eq('actor_role','staff').is('seen_by_owner_at',null)
    .then(function(r) {
      if (r.error) return;
      if (state.kwfUnread !== r.count){
        var prev=state.kwfUnread;
        state.kwfUnread=r.count||0;
        if (state.kwfUnread>prev) notify(kwfWord('Staff نے ریکارڈ میں نئی تبدیلی کی ہے۔','New staff activity requires review.'));
        render();
      }
    }).catch(console.warn);
},60000);
