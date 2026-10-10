// Reliable registration email confirmation, resend and invalid-link messages.
// Official production website address (not localhost:3000).
const kwfOfficialAuthUrl = 'https://kalwalwf.github.io/';
const kwfPreviousAuthViewForEmail = authView;
authView = function(){
  var out=kwfPreviousAuthViewForEmail();
  if (state.authView === 'login' || state.authView === 'register'){
    var action='<button type="button" class="btn ghost tiny kwf-resend-email" data-action="kwfResendVerification">'+
      (state.language==='ur'?'Verification Email دوبارہ بھیجیں':'Resend verification email')+'</button>';
    return out.replace('<button class="btn ghost tiny" data-action="language">',action+
      '<button class="btn ghost tiny" data-action="language">');
  }
  return out;
};
const kwfPreviousAuthClickForEmail = clickAction;
clickAction = async function(el){
  if(el.dataset.action === 'kwfResendVerification'){
    if(!state.client){notify('Authentication service is loading',true);return;}
    var box=document.querySelector('input[name="email"]');
    var typed=box && String(box.value||'').trim();
    var email=typed || prompt(state.language==='ur'?
      'اپنی رجسٹرڈ ای میل لکھیں تاکہ Verification Link دوبارہ بھیجا جا سکے:':
      'Enter your registration email to resend verification:');
    if(!email) return;
    try{
      var result=await state.client.auth.resend({
        type:'signup',email:String(email).trim(),
        options:{emailRedirectTo:kwfOfficialAuthUrl}
      });
      if(result.error) throw result.error;
      notify(state.language==='ur'?
        'اگر ای میل تصدیق کی منتظر ہے تو نیا Verification Link بھیج دیا گیا ہے۔ Inbox/Spam چیک کریں۔':
        'If this email is awaiting verification, a new link has been sent. Check inbox and spam.');
    }catch(e){notify(errorStr(e),true);}
    return;
  }
  return kwfPreviousAuthClickForEmail(el);
};
(function(){
  var hash=new URLSearchParams(location.hash.replace(/^#/,''));
  var error=hash.get('error_code')||hash.get('error');
  if(!error || !['otp_expired','access_denied','otp_disabled','otp_invalid'].includes(error))return;
  var message=state.language==='ur'?
    'ای میل کا تصدیقی لنک غلط ہے یا اس کی مدت ختم ہو گئی ہے۔ نئے لنک کے لیے Login پر Verification Email دوبارہ بھیجیں دبائیں۔':
    'This email confirmation link is invalid or expired. Use Resend verification email on the login page.';
  setTimeout(function(){
    notify(message,true);
    state.publicPage='auth';
    if(!state.kwfPasswordRecovery) state.authView='login';
    render();
  },700);
})();
