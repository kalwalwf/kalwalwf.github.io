// KWF Account v2: owner-created staff usernames, verified old-password changes,
// email/phone sign-up and SMS-OTP password recovery.
// Runs after the existing frontend enhancements. No service-role keys in browser.
const kwfAccountV2Home = "https://kalwalwf.github.io/";
const kwfStaffLoginDomain = "staff.kalwalwf.github.io";
state.kwfRegMethod = "email";
state.kwfPhoneForOtp = "";
state.kwfPhoneRecovery = false;
state.kwfStaffAccounts = [];
state.kwfOwnStaffUsername = "";
state.kwfResetStaffUsername = "";
state.kwfAccountBusy = false;

function kwfAccountI18n(ur,en){return state.language==="ur"?ur:en;}
function kwfNormalizePhone(value){
  const input=String(value||"").trim().replace(/[\s()\-]/g,"");
  const match=input.match(/^(?:\+92|92|0)?(3\d{9})$/);
  if(!match)throw new Error(kwfAccountI18n(
    "پاکستانی موبائل نمبر درست لکھیں، مثال: 03001234567",
    "Enter a valid Pakistani mobile number, e.g. 03001234567"));
  return "+92"+match[1];
}
function kwfUsernameEmail(identifier){
  const name=String(identifier||"").trim().toLowerCase();
  if(!/^[a-z][a-z0-9_]{2,23}$/.test(name))throw new Error(kwfAccountI18n(
    "درست Staff Username لکھیں (3 سے 24 حروف)", "Enter a valid 3–24 character Staff username"));
  return name+"@"+kwfStaffLoginDomain;
}
function kwfSafePasswordLength(pw,min=10){
  if(pw.length<min||pw.length>128)throw new Error(kwfAccountI18n(
    "پاس ورڈ کم از کم "+min+" اور زیادہ سے زیادہ 128 حروف کا ہو۔",
    "Use a password of "+min+"–128 characters."));
}
function kwfAccountField(name,label,type,required=true,autocomplete="",value=""){
  return '<label class="kwf-account-field"><span>'+html(label)+'</span>'+
    '<input name="'+html(name)+'" type="'+type+'"'+(required?" required":"")+
    (autocomplete?' autocomplete="'+autocomplete+'"':"")+
    ' value="'+html(String(value||""))+'"></label>';
}
function kwfAccountFormCard(title,description,content){
  return '<div class="authbg"><div class="authcard kwf-account-card">'+
    '<div class="authbrand">'+logo()+'<h1>Kalwal Welfare Foundation</h1><p>KWF Welfare Management Portal</p></div>'+
    '<h3>'+title+'</h3><p class="small muted kwf-account-description">'+description+'</p>'+
    content+
    '<div class="authlinks"><button class="btn tiny ghost" type="button" data-action="kwfBackLogin">'+
    kwfAccountI18n('Login پر واپس','Back to login')+'</button>'+
    '<button class="btn tiny ghost" type="button" data-action="language">'+t('changeLang')+'</button></div>'+
    '</div></div>';
}
function kwfPhoneHelp(){
  return '<p class="small muted kwf-phone-provider-help">'+kwfAccountI18n(
    'موبائل پر OTP وصول کرنے کے لیے Supabase میں SMS Provider فعال ہونا ضروری ہے۔ صرف نمبر لکھنے سے OTP نہیں آتا۔',
    'SMS verification requires an active Supabase SMS provider. Entering a number alone cannot send an OTP.')+
    ' <a href="https://supabase.com/dashboard/project/ekthzqacvsjfngtyvplx/auth/providers" target="_blank" rel="noopener">'+
    kwfAccountI18n('SMS Settings','SMS settings')+'</a></p>';
}
const kwfAccountPriorAuthView=authView;
authView=function(){
  if(state.authView==='login'){
    return kwfAccountFormCard(
      kwfAccountI18n('ڈونر / ایڈمن / اسٹاف لاگ اِن','Donor / Admin / Staff login'),
      kwfAccountI18n('ای میل، موبائل نمبر یا Staff Username سے لاگ اِن کریں۔','Sign in with email, mobile number or staff username.'),
      '<form data-form="kwfLoginV2">'+kwfAccountField('identifier',
       kwfAccountI18n('ای میل / موبائل / Username','Email / Mobile / Username'),'text',true,'username')+
      kwfAccountField('password',kwfAccountI18n('پاس ورڈ','Password'),'password',true,'current-password')+
      '<button class="btn kwf-account-submit" type="submit">'+kwfAccountI18n('لاگ اِن','Sign in')+'</button></form>'+
      '<div class="kwf-account-actions">'+
      '<button class="btn tiny ghost kwf-password-reset-btn" data-action="kwfForgot" type="button">'+kwfAccountI18n('پاس ورڈ ری سیٹ','Password Reset')+'</button>'+
      '<button class="btn tiny ghost" data-action="kwfResendVerification" type="button">'+kwfAccountI18n('Verification Email دوبارہ بھیجیں','Resend verification email')+'</button>'+
      '</div><div class="kwf-account-actions">'+
      '<button class="btn tiny ghost" data-action="visitorRegister" type="button">'+kwfAccountI18n('نیا اکاؤنٹ بنائیں','Create account')+'</button>'+
      '<button class="btn kwf-public-home-btn" data-action="publicHome" type="button">'+kwfAccountI18n('عوامی ہوم پیج','Public Home')+'</button>'+
      '</div>'+
      '<p class="small muted">'+kwfAccountI18n('Staff Username کا پاس ورڈ بھول جائیں تو Owner نیا پاس ورڈ مقرر کرے گا۔',
       'For staff usernames without email, ask the Owner to reset your password.')+'</p>');
  }
  if(state.authView==='register'){
    const phone=state.kwfRegMethod==='phone';
    const method='<div class="kwf-account-methods" role="group" aria-label="Registration method">'+
     '<button type="button" class="btn tiny '+(phone?'ghost':'')+'" data-action="kwfRegMethod" data-method="email">'+kwfAccountI18n('ای میل','Email')+'</button>'+
     '<button type="button" class="btn tiny '+(!phone?'ghost':'')+'" data-action="kwfRegMethod" data-method="phone">'+kwfAccountI18n('موبائل نمبر','Mobile')+'</button></div>';
    return kwfAccountFormCard(
      kwfAccountI18n('نیا ڈونر اکاؤنٹ','Register donor account'),
      kwfAccountI18n('ای میل یا موبائل میں سے ایک طریقہ منتخب کریں۔ موبائل کے لیے SMS تصدیق ضروری ہے۔',
       'Choose email or mobile registration. Mobile signup requires SMS verification.'),
      method+'<form data-form="kwfRegisterV2">'+
      kwfAccountField('full_name',kwfAccountI18n('مکمل نام','Full name'),'text',true,'name')+
      (phone?kwfAccountField('phone',kwfAccountI18n('پاکستانی موبائل نمبر','Pakistan mobile number'),'tel',true,'tel'):
        kwfAccountField('email',kwfAccountI18n('ای میل','Email'),'email',true,'email')+
        kwfAccountField('contact_phone',kwfAccountI18n('موبائل نمبر (اختیاری رابطہ)','Mobile (optional contact)'),'tel',false,'tel'))+
      kwfAccountField('password',kwfAccountI18n('پاس ورڈ (کم از کم 8 حروف)','Password (8+ characters)'),'password',true,'new-password')+
      '<button class="btn kwf-account-submit" type="submit">'+kwfAccountI18n('رجسٹر کریں','Register')+'</button></form>'+
      (phone?kwfPhoneHelp():'<p class="small muted">'+kwfAccountI18n(
        'ای میل Verification کے بعد اکاؤنٹ استعمال کریں۔ اختیاری موبائل نمبر SMS سے تصدیق شدہ نہیں ہوگا۔',
        'Confirm your email to sign in. The optional contact number is not SMS-verified.')+'</p>'));
  }
  if(state.authView==='kwfPhoneSignupVerify'){
    return kwfAccountFormCard(kwfAccountI18n('موبائل کی تصدیق','Verify phone'),
      kwfAccountI18n('اپنے موبائل پر موصول ہونے والا 6 ہندسوں کا OTP درج کریں۔',
      'Enter the six-digit code received by SMS.'),
      '<form data-form="kwfVerifyPhoneSignup">'+
      kwfAccountField('otp',kwfAccountI18n('SMS کوڈ','SMS code'),'text',true,'one-time-code')+
      '<button class="btn kwf-account-submit" type="submit">'+kwfAccountI18n('تصدیق کریں','Verify phone')+'</button></form>'+kwfPhoneHelp());
  }
  if(state.authView==='kwfPhoneForgot'){
    return kwfAccountFormCard(kwfAccountI18n('موبائل سے پاس ورڈ ری سیٹ','Reset password with mobile'),
      kwfAccountI18n('اپنا پہلے سے رجسٹرڈ، تصدیق شدہ موبائل نمبر درج کریں۔',
      'Enter your previously registered, verified mobile number.'),
      '<form data-form="kwfPhoneRequestOtp">'+
      kwfAccountField('phone',kwfAccountI18n('موبائل نمبر','Mobile number'),'tel',true,'tel')+
      '<button class="btn kwf-account-submit" type="submit">'+kwfAccountI18n('SMS OTP بھیجیں','Send SMS OTP')+'</button></form>'+kwfPhoneHelp());
  }
  if(state.authView==='kwfPhoneResetVerify'){
    return kwfAccountFormCard(kwfAccountI18n('SMS OTP تصدیق','Verify SMS OTP'),
      kwfAccountI18n('اپنا SMS کوڈ درج کریں۔ تصدیق کے بعد نیا پاس ورڈ منتخب کریں۔',
      'Enter your OTP to prove you own the phone and then set a new password.'),
      '<form data-form="kwfPhoneVerifyReset">'+kwfAccountField('otp','SMS OTP','text',true,'one-time-code')+
      '<button class="btn kwf-account-submit" type="submit">'+kwfAccountI18n('SMS کوڈ Verify کریں','Verify SMS code')+'</button></form>');
  }
  if(state.authView==='kwfPhoneResetPassword'){
    return kwfAccountFormCard(kwfAccountI18n('نیا پاس ورڈ بنائیں','Choose new password'),
     kwfAccountI18n('OTP تصدیق ہونے کے بعد نیا پاس ورڈ محفوظ کریں۔','Your SMS OTP was verified. Save a new password.'),
     '<form data-form="kwfPhoneSavePassword">'+
     kwfAccountField('new_password',kwfAccountI18n('نیا پاس ورڈ','New password'),'password',true,'new-password')+
     kwfAccountField('confirm_password',kwfAccountI18n('تصدیقی پاس ورڈ','Confirm password'),'password',true,'new-password')+
     '<button class="btn kwf-account-submit" type="submit">'+kwfAccountI18n('پاس ورڈ محفوظ کریں','Save password')+'</button></form>');
  }
  return kwfAccountPriorAuthView();
};

const kwfAccountPriorRender=render;
render=function(){
  if(state.kwfPhoneRecovery && state.ready && 
    ['kwfPhoneResetVerify','kwfPhoneResetPassword'].includes(state.authView)){
    document.documentElement.lang=state.language;
    document.documentElement.dir=state.language==='ur'?'rtl':'ltr';
    $('app').innerHTML=authView();
    return;
  }
  return kwfAccountPriorRender();
};

// My Account: change password by verifying the CURRENT password in an isolated,
// non-persistent Supabase Auth client. Never write old/new passwords to a database.
const kwfAccountPriorAccountView=accountView;
accountView=function(){
  let markup=kwfAccountPriorAccountView();
  if(!state.user)return markup;
  // Direct username-created staff already have a password: they must verify it
  // before making changes. Invited staff retain initial password setup.
  if(state.kwfOwnStaffUsername){
    markup=markup.replace(/<section class="panel kwf-staff-password-panel">[\s\S]*?<\/section>/,'');
  }
  const uname=state.kwfOwnStaffUsername?
    '<p><strong>'+kwfAccountI18n('Staff Username: ','Staff username: ')+'</strong>'+
    '<span class="kwf-account-username">'+html(state.kwfOwnStaffUsername)+'</span></p>':'';
  return markup+
    '<section class="panel kwf-change-password"><h3>'+kwfAccountI18n('پاس ورڈ تبدیل کریں','Change password')+'</h3>'+
    uname+
    '<p class="small muted">'+kwfAccountI18n('سیکیورٹی کے لیے اپنا موجودہ پاس ورڈ درست لکھنا ضروری ہے۔',
     'Your current password must be verified before changing it.')+'</p>'+
    '<form data-form="kwfChangePasswordV2">'+
    kwfAccountField('old_password',kwfAccountI18n('موجودہ پاس ورڈ','Current password'),'password',true,'current-password')+
    kwfAccountField('new_password',kwfAccountI18n('نیا پاس ورڈ (10+ حروف)','New password (10+ characters)'),'password',true,'new-password')+
    kwfAccountField('confirm_password',kwfAccountI18n('نیا پاس ورڈ دوبارہ','Confirm new password'),'password',true,'new-password')+
    '<button class="btn" type="submit">'+kwfAccountI18n('پاس ورڈ تبدیل کریں','Update password')+'</button></form></section>';
};

function kwfStaffUsernameTable(){
  const users=state.kwfStaffAccounts||[];
  if(!users.length)return '<p class="small muted">'+kwfAccountI18n('ابھی کوئی Username والا Staff اکاؤنٹ نہیں۔',
    'No username-based staff accounts yet.')+'</p>';
  return table(
    [kwfAccountI18n('Username','Username'),kwfAccountI18n('نام','Name'),
      kwfAccountI18n('حیثیت','Role'),kwfAccountI18n('انتظام','Manage')],
    users.map(function(x){
      const p=(state.profiles||[]).find(z=>z.id===x.user_id);
      const role=p?.role||'—';
      return '<tr><td><b>'+html(x.username)+'</b></td><td>'+html(p?.full_name||'—')+
       '</td><td>'+html(role)+'</td><td>'+
       (role==='staff'?'<button type="button" class="btn tiny ghost" data-action="kwfResetStaffV2" data-username="'+
         html(x.username)+'">'+kwfAccountI18n('پاس ورڈ ری سیٹ','Reset password')+'</button>':'—')+
       '</td></tr>';
    })
  );
}
const kwfAccountPriorStaffView=staffView;
staffView=function(){
  if(!kwfOwnerOnly())return kwfAccountPriorStaffView();
  const panel='<section class="panel kwf-create-staff-v2"><h3>'+
    kwfAccountI18n('نیا Staff Username / Password بنائیں','Create staff username / password')+'</h3>'+
    '<p class="muted">'+kwfAccountI18n(
      'Staff کا نام، Username اور Password یہاں بنائیں۔ ای میل یا OTP کی ضرورت نہیں۔ پاس ورڈ صرف متعلقہ Staff کو ذاتی طور پر دیں۔',
      'Create a staff username and password here. No email invitation or OTP is required. Share the password privately.')+
      '</p><form data-form="kwfCreateStaffV2">'+
      kwfAccountField('full_name',kwfAccountI18n('Staff کا نام','Staff name'),'text',true,'name')+
      kwfAccountField('username','Username','text',true,'off')+
      kwfAccountField('password',kwfAccountI18n('ابتدائی پاس ورڈ (10+ حروف)','Initial password (10+ characters)'),'password',true,'new-password')+
      kwfAccountField('confirm_password',kwfAccountI18n('پاس ورڈ دوبارہ درج کریں','Confirm password'),'password',true,'new-password')+
      '<button class="btn" type="submit">'+kwfAccountI18n('Staff اکاؤنٹ بنائیں','Create staff account')+'</button></form></section>'+
      '<section class="panel"><h3>'+kwfAccountI18n('Username والے Staff اکاؤنٹس','Staff accounts')+'</h3>'+
      kwfStaffUsernameTable()+'</section>';
  const reset=state.kwfResetStaffUsername?'<section class="panel kwf-reset-staff-v2">'+
    '<h3>'+kwfAccountI18n('Staff کا پاس ورڈ ری سیٹ','Reset staff password')+
    ': '+html(state.kwfResetStaffUsername)+'</h3><form data-form="kwfResetStaffPasswordV2">'+
    kwfAccountField('password',kwfAccountI18n('نیا پاس ورڈ (10+ حروف)','New password (10+ characters)'),'password',true,'new-password')+
    kwfAccountField('confirm_password',kwfAccountI18n('پاس ورڈ دوبارہ','Confirm password'),'password',true,'new-password')+
    '<div class="kwf-account-actions"><button class="btn" type="submit">'+kwfAccountI18n('پاس ورڈ ری سیٹ کریں','Reset password')+
    '</button><button class="btn ghost" type="button" data-action="kwfCloseResetStaffV2">'+
    kwfAccountI18n('منسوخ','Cancel')+'</button></div></form></section>':'';
  return '<h2 class="sectionTitle">'+kwfAccountI18n('Staff Management','Staff Management')+'</h2>'+
    panel+reset+
    '<section class="panel"><h3>'+kwfAccountI18n('تمام ممبران اور ان کی رسائی','Members and access')+'</h3>'+
    table([kwfAccountI18n('نام','Name'),kwfAccountI18n('فون','Phone'),
      kwfAccountI18n('رول','Role'),kwfAccountI18n('انتظام','Manage')],kwfStaffMemberRows())+
    '</section>'+kwfActivityPanel();
};

async function kwfInvokeStaffV2(body){
  if(!kwfOwnerOnly())throw new Error('Only Owner can manage staff usernames');
  if(!state.client?.functions)throw new Error('Staff account service is not available');
  const response=await state.client.functions.invoke('kwf-staff-accounts',{body});
  if(response.error){
    let detail;
    try{detail=await response.error.context?.json();}catch(e){/* Offline error */}
    throw new Error(detail?.error||response.error.message||'Staff service unavailable');
  }
  if(response.data?.error)throw new Error(response.data.error);
  return response.data;
}
async function kwfVerifyCurrentPassword(oldPassword){
  if(!state.user||!state.client)throw new Error('Sign in first');
  const c=window.KWF_CONFIG||{};
  const lib=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm');
  const check=lib.createClient(c.supabaseUrl,c.supabasePublishableKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  });
  const credentials={password:oldPassword};
  if(state.user.email)credentials.email=state.user.email;
  else if(state.user.phone)credentials.phone=state.user.phone;
  else throw new Error('No password-based login identifier is available');
  const response=await check.auth.signInWithPassword(credentials);
  if(response.error||!response.data.user||response.data.user.id!==state.user.id){
    throw new Error(kwfAccountI18n('موجودہ پاس ورڈ درست نہیں۔','Current password is incorrect.'));
  }
  return check;
}
const kwfAccountPriorProcessForm=processForm;
processForm=async function(form){
 const action=form.dataset.form;
 const handled=['kwfCreateStaffV2','kwfResetStaffPasswordV2','kwfChangePasswordV2',
   'kwfLoginV2','kwfRegisterV2','kwfVerifyPhoneSignup',
   'kwfPhoneRequestOtp','kwfPhoneVerifyReset','kwfPhoneSavePassword'];
 if(!handled.includes(action))return kwfAccountPriorProcessForm(form);
 if(state.kwfAccountBusy)return;
 state.kwfAccountBusy=true;
 const button=form.querySelector('button[type=submit]');
 if(button)button.disabled=true;
 try{
  if(!state.client)throw new Error('Authentication connection is not ready');
  const values=Object.fromEntries(new FormData(form).entries());
  if(action==='kwfCreateStaffV2'||action==='kwfResetStaffPasswordV2'){
    const password=String(values.password||'');
    kwfSafePasswordLength(password);
    if(password!==String(values.confirm_password||''))throw new Error(kwfAccountI18n('دونوں پاس ورڈ مختلف ہیں۔','Passwords do not match.'));
    const body=action==='kwfCreateStaffV2'?
      {action:'create',username:String(values.username||'').trim().toLowerCase(),
       full_name:String(values.full_name||'').trim(),password}:
      {action:'reset',username:state.kwfResetStaffUsername,password};
    const result=await kwfInvokeStaffV2(body);
    form.reset();
    state.kwfResetStaffUsername='';
    await refresh(true);
    notify(kwfAccountI18n('Staff Username/Password محفوظ ہوگیا۔ پاس ورڈ ذاتی طور پر بتائیں۔',
       'Staff credentials saved. Share the password privately.'));
    return;
  }
  if(action==='kwfChangePasswordV2'){
    const oldPassword=String(values.old_password||'');
    const newPassword=String(values.new_password||'');
    kwfSafePasswordLength(newPassword);
    if(newPassword!==String(values.confirm_password||''))throw new Error(kwfAccountI18n('نئے پاس ورڈ مختلف ہیں۔','New passwords do not match.'));
    if(newPassword===oldPassword)throw new Error(kwfAccountI18n('نیا پاس ورڈ پرانے سے مختلف رکھیں۔','New password must differ from the old password.'));
    const fresh=await kwfVerifyCurrentPassword(oldPassword);
    try{
      const updated=await fresh.auth.updateUser({password:newPassword});
      if(updated.error)throw updated.error;
    }finally{
      await fresh.auth.signOut({scope:'local'}).catch(()=>{});
    }
    form.reset();
    notify(kwfAccountI18n('پاس ورڈ کامیابی سے تبدیل ہوگیا۔','Password changed successfully.'));
    return;
  }
  if(action==='kwfLoginV2'){
    const raw=String(values.identifier||'').trim(), password=String(values.password||'');
    if(!raw)throw new Error('Email, mobile or username is required');
    let login;
    if(raw.includes('@')) login={email:raw,password};
    else if(/^[+\d][\d\s()-]{8,20}$/.test(raw)) login={phone:kwfNormalizePhone(raw),password};
    else login={email:kwfUsernameEmail(raw),password};
    const {data,error}=await state.client.auth.signInWithPassword(login);
    if(error)throw error;
    state.user=data.user;
    state.view='dashboard';state.publicPage='auth';
    await refresh(true);
    return;
  }
  if(action==='kwfRegisterV2'){
    const pw=String(values.password||'');
    kwfSafePasswordLength(pw,8);
    const name=String(values.full_name||'').trim();
    if(name.length<2)throw new Error('Full name is required');
    if(state.kwfRegMethod==='phone'){
      const phone=kwfNormalizePhone(values.phone);
      const signup=await state.client.auth.signUp({
        phone,password:pw,options:{data:{full_name:name,phone}}
      });
      if(signup.error)throw new Error(
       kwfAccountI18n('موبائل رجسٹریشن / SMS کا مسئلہ: ','Mobile signup / SMS error: ')+errorStr(signup.error));
      state.kwfPhoneForOtp=phone;
      if(signup.data.session?.user){
        state.user=signup.data.user;await refresh(true);
      }else{
        state.authView='kwfPhoneSignupVerify';render();
      }
      notify(kwfAccountI18n('موبائل Verification SMS چیک کریں۔','Check your SMS for the verification code.'));
      return;
    }
    let phone='';
    if(String(values.contact_phone||'').trim())phone=kwfNormalizePhone(values.contact_phone);
    const signup=await state.client.auth.signUp({
      email:String(values.email||'').trim(),password:pw,
      options:{data:{full_name:name,phone},emailRedirectTo:kwfAccountV2Home}
    });
    if(signup.error)throw signup.error;
    state.authView='login';state.user=signup.data.session?.user||null;
    render();
    notify(kwfAccountI18n('Verification Email چیک کریں۔','Check your email for verification.'));
    if(state.user)await refresh(true);
    return;
  }
  if(action==='kwfVerifyPhoneSignup'){
    const result=await state.client.auth.verifyOtp({
      phone:state.kwfPhoneForOtp,
      token:String(values.otp||'').trim(),type:'sms'
    });
    if(result.error)throw result.error;
    state.kwfPhoneForOtp='';
    state.authView='login';state.user=result.data.user||null;
    await refresh(true);
    notify(kwfAccountI18n('موبائل نمبر Verify ہوگیا۔','Mobile number verified.'));
    return;
  }
  if(action==='kwfPhoneRequestOtp'){
    const phone=kwfNormalizePhone(values.phone);
    const result=await state.client.auth.signInWithOtp({
      phone,options:{shouldCreateUser:false}
    });
    if(result.error)throw new Error(
      kwfAccountI18n('SMS بھیجنے میں مسئلہ: ','SMS sending error: ')+errorStr(result.error));
    state.kwfPhoneForOtp=phone;
    state.kwfPhoneRecovery=true;
    state.authView='kwfPhoneResetVerify';render();
    notify(kwfAccountI18n('SMS OTP درج کریں۔','Enter your SMS OTP.'));
    return;
  }
  if(action==='kwfPhoneVerifyReset'){
    if(!state.kwfPhoneRecovery||!state.kwfPhoneForOtp)throw new Error('Start mobile recovery again');
    const verified=await state.client.auth.verifyOtp({
      phone:state.kwfPhoneForOtp,token:String(values.otp||'').trim(),type:'sms'
    });
    if(verified.error)throw verified.error;
    if(!verified.data.session||!verified.data.user)throw new Error('SMS verification did not create an authenticated session');
    state.user=verified.data.user;
    state.authView='kwfPhoneResetPassword';
    render();
    return;
  }
  if(action==='kwfPhoneSavePassword'){
    if(!state.kwfPhoneRecovery)throw new Error('Verify your SMS OTP first');
    const pw=String(values.new_password||'');
    kwfSafePasswordLength(pw);
    if(pw!==String(values.confirm_password||''))throw new Error(kwfAccountI18n('پاس ورڈ مختلف ہیں۔','Passwords do not match.'));
    const current=await state.client.auth.getSession();
    if(current.error||!current.data.session||current.data.session.user.phone!==state.kwfPhoneForOtp){
      throw new Error('Your verified phone session expired. Request a new SMS OTP.');
    }
    const updated=await state.client.auth.updateUser({password:pw});
    if(updated.error)throw updated.error;
    await state.client.auth.signOut({scope:'local'});
    state.user=null;state.profile=null;
    state.kwfPhoneRecovery=false;state.kwfPhoneForOtp='';
    state.authView='login';state.publicPage='auth';
    render();
    notify(kwfAccountI18n('نیا پاس ورڈ محفوظ ہوگیا؛ اب Login کریں۔','Password updated. Sign in with the new password.'));
    return;
  }
 }catch(err){notify(errorStr(err),true);console.error('KWF account action failed:',err);}
 finally{state.kwfAccountBusy=false;if(button&&button.isConnected)button.disabled=false;}
};
const kwfAccountPriorClick=clickAction;
clickAction=async function(el){
  const a=el.dataset.action;
  if(a==='kwfRegMethod'){
    state.kwfRegMethod=el.dataset.method==='phone'?'phone':'email';
    render();return;
  }
  if(a==='kwfPhoneForgot'){
    state.kwfPhoneRecovery=false;state.kwfPhoneForOtp='';
    state.authView='kwfPhoneForgot';state.publicPage='auth';
    render();return;
  }
  if(a==='kwfBackLogin'){
    state.kwfPhoneRecovery=false;state.kwfPhoneForOtp='';
    state.authView='login';state.publicPage='auth';render();return;
  }
  if(a==='kwfResetStaffV2'){
    if(!kwfOwnerOnly())return;
    state.kwfResetStaffUsername=String(el.dataset.username||'');
    render();return;
  }
  if(a==='kwfCloseResetStaffV2'){
    state.kwfResetStaffUsername='';render();return;
  }
  return kwfAccountPriorClick(el);
};
const kwfAccountPriorRefresh=refresh;
refresh=async function(silent){
  await kwfAccountPriorRefresh(silent);
  if(!state.client||!state.user){
    state.kwfStaffAccounts=[];state.kwfOwnStaffUsername='';
    return;
  }
  try{
    if(kwfOwnerOnly()){
      const r=await state.client.from('kwf_staff_accounts')
       .select('username,user_id,created_at').order('created_at',{ascending:false}).limit(250);
      if(r.error)throw r.error;
      state.kwfStaffAccounts=r.data||[];
      state.kwfOwnStaffUsername='';
    }else if(kwfUserRole()==='staff'){
      const r=await state.client.from('kwf_staff_accounts').select('username')
       .eq('user_id',state.user.id).maybeSingle();
      if(r.error)throw r.error;
      state.kwfOwnStaffUsername=r.data?.username||'';
      state.kwfStaffAccounts=[];
    }else{state.kwfStaffAccounts=[];state.kwfOwnStaffUsername='';}
    render();
  }catch(error){console.warn('Could not refresh staff usernames',errorStr(error));}
};
