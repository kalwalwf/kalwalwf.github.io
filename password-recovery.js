// KWF safe email-based password recovery, appended after website-enhancements.js.
// Uses the existing Supabase client, auth account, and roles; never stores passwords.
// PASSWORD_RECOVERY emails redirect to the same GitHub Pages website.
const kwfRecoveryCopy = {
  ur: {
    forgot: 'پاس ورڈ بھول گئے؟',
    requestTitle: 'پاس ورڈ دوبارہ حاصل کریں',
    requestHelp: 'اپنی رجسٹرڈ ای میل درج کریں۔ آپ کو محفوظ Reset Link بھیجا جائے گا۔',
    email: 'رجسٹرڈ ای میل',
    send: 'Reset Link بھیجیں',
    sentTitle: 'اپنی ای میل چیک کریں',
    sent: 'اگر یہ ای میل رجسٹرڈ ہے تو Password Reset Link بھیج دیا گیا ہے۔ Inbox اور Spam فولڈر چیک کریں۔',
    back: 'لاگ اِن پر واپس',
    newTitle: 'نیا پاس ورڈ بنائیں',
    newHelp: 'نیا پاس ورڈ کم از کم 8 حروف کا رکھیں۔',
    newPassword: 'نیا پاس ورڈ',
    confirmPassword: 'نئے پاس ورڈ کی تصدیق',
    save: 'پاس ورڈ تبدیل کریں',
    mismatch: 'دونوں پاس ورڈ ایک جیسے ہونے چاہئیں۔',
    tooShort: 'کم از کم 8 حروف کا پاس ورڈ استعمال کریں۔',
    expired: 'Reset Link کی مدت ختم ہوگئی ہے یا لنک غلط ہے۔ براہِ کرم دوبارہ لنک حاصل کریں۔',
    updated: 'پاس ورڈ کامیابی سے تبدیل ہوگیا۔ اب نئے پاس ورڈ سے لاگ اِن کریں۔',
    wait: 'براہِ کرم انتظار کریں…',
    unavailable: 'لاگ اِن سروس ابھی تیار نہیں؛ صفحہ دوبارہ کھولیں۔'
  },
  en: {
    forgot: 'Forgot password?',
    requestTitle: 'Reset your password',
    requestHelp: 'Enter the email address registered to your account. We will email a secure reset link.',
    email: 'Registered email',
    send: 'Send reset link',
    sentTitle: 'Check your email',
    sent: 'If this email is registered, a password reset link has been sent. Check your inbox and spam folder.',
    back: 'Back to sign in',
    newTitle: 'Set a new password',
    newHelp: 'Choose a new password with at least 8 characters.',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    save: 'Update password',
    mismatch: 'Passwords do not match.',
    tooShort: 'Password must be at least 8 characters.',
    expired: 'The reset link is expired or invalid. Please request a new one.',
    updated: 'Password updated. Sign in with your new password.',
    wait: 'Please wait…',
    unavailable: 'Authentication is not ready. Please reload this page.'
  }
};
function kwfRecoveryText(key) {
  return kwfRecoveryCopy[state.language === 'en' ? 'en' : 'ur'][key];
}
const kwfRecoveryHash = new URLSearchParams(location.hash.replace(/^#/, ''));
const kwfRecoveryUrl = new URLSearchParams(location.search);
state.kwfPasswordRecovery = kwfRecoveryUrl.get('kwf_reset') === '1' || kwfRecoveryHash.get('type') === 'recovery';
state.kwfRecoveryLinkError = kwfRecoveryHash.has('error') || kwfRecoveryHash.has('error_code');
state.kwfRecoveryBusy = false;
state.kwfRecoveryNotice = '';
if (state.kwfPasswordRecovery) {
  state.publicPage = 'auth';
  state.authView = 'kwfNewPassword';
}

function kwfRecoveryCard(title, help, body) {
  return '<div class="authbg"><div class="authcard kwf-recovery-card">' +
    '<div class="authbrand">' + logo() +
    '<h1>Kalwal Welfare Foundation</h1><p>KWF Welfare Management Portal</p></div>' +
    '<h3>' + title + '</h3><p class="kwf-recovery-help">' + help + '</p>' +
    body + '<div class="authlinks"><button type="button" class="btn ghost tiny" data-action="kwfRecoveryBack">' +
    kwfRecoveryText('back') + '</button><button type="button" class="btn ghost tiny" data-action="language">' +
    t('changeLang') + '</button></div></div></div>';
}

const kwfPriorAuthView = authView;
authView = function() {
  if (state.authView === 'kwfForgot') {
    return kwfRecoveryCard(kwfRecoveryText('requestTitle'), kwfRecoveryText('requestHelp'),
      '<form data-form="kwfRequestReset">' +
      '<label class="kwf-recovery-field">' + kwfRecoveryText('email') +
      '<input type="email" name="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="name@example.com"></label>' +
      '<button class="btn kwf-recovery-submit" type="submit">' + kwfRecoveryText('send') + '</button></form>');
  }
  if (state.authView === 'kwfResetSent') {
    return kwfRecoveryCard(kwfRecoveryText('sentTitle'), kwfRecoveryText('sent'),
      '<div class="kwf-recovery-info" role="status">✓ ' + kwfRecoveryText('sent') + '</div>');
  }
  if (state.authView === 'kwfNewPassword') {
    const message = state.kwfRecoveryLinkError ?
      '<div class="kwf-recovery-error" role="alert">' + kwfRecoveryText('expired') + '</div>' :
      '<form data-form="kwfSavePassword">' +
      '<label class="kwf-recovery-field">' + kwfRecoveryText('newPassword') +
      '<input type="password" name="password" required minlength="8" autocomplete="new-password"></label>' +
      '<label class="kwf-recovery-field">' + kwfRecoveryText('confirmPassword') +
      '<input type="password" name="confirm_password" required minlength="8" autocomplete="new-password"></label>' +
      '<button class="btn kwf-recovery-submit" type="submit">' + kwfRecoveryText('save') + '</button></form>';
    return kwfRecoveryCard(kwfRecoveryText('newTitle'), kwfRecoveryText('newHelp'), message);
  }
  const markup = kwfPriorAuthView();
  if (state.authView !== 'login') return markup;
  return markup.replace('</form>',
    '<div class="kwf-forgot-row"><button class="kwf-forgot-link" type="button" data-action="kwfForgot">' +
    kwfRecoveryText('forgot') + '</button></div></form>');
};

const kwfPriorRender = render;
render = function() {
  if (state.kwfPasswordRecovery && state.ready) {
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === 'ur' ? 'rtl' : 'ltr';
    document.title = 'KWF | ' + kwfRecoveryText('newTitle');
    $('app').innerHTML = authView();
    return;
  }
  return kwfPriorRender();
};

const kwfPriorClickAction = clickAction;
clickAction = async function(el) {
  const action = el.dataset.action;
  if (action === 'kwfForgot') {
    state.authView = 'kwfForgot';
    state.publicPage = 'auth';
    render();
    return;
  }
  if (action === 'kwfRecoveryBack') {
    state.authView = 'login';
    state.publicPage = 'auth';
    if (state.kwfPasswordRecovery) {
      state.kwfPasswordRecovery = false;
      state.kwfRecoveryLinkError = false;
      history.replaceState(null, '', location.pathname);
      // A recovery link starts a temporary authenticated session.
      if (state.client) {
        await state.client.auth.signOut({scope: 'local'}).catch(console.warn);
        state.user = null;
        state.profile = null;
      }
    }
    render();
    return;
  }
  return kwfPriorClickAction(el);
};

const kwfPriorProcessForm = processForm;
processForm = async function(form) {
  const action = form.dataset.form;
  if (action !== 'kwfRequestReset' && action !== 'kwfSavePassword') {
    return kwfPriorProcessForm(form);
  }
  if (state.kwfRecoveryBusy) return;
  const button = form.querySelector('[type="submit"]');
  state.kwfRecoveryBusy = true;
  if (button) button.disabled = true;
  try {
    if (!state.client) throw new Error(kwfRecoveryText('unavailable'));
    if (action === 'kwfRequestReset') {
      const email = String(new FormData(form).get('email') || '').trim();
      const redirectTo = location.origin + location.pathname + '?kwf_reset=1';
      const {error} = await state.client.auth.resetPasswordForEmail(email, {redirectTo});
      if (error) throw error;
      state.authView = 'kwfResetSent';
      render();
    } else {
      const data = new FormData(form);
      const password = String(data.get('password') || '');
      const confirm = String(data.get('confirm_password') || '');
      if (password.length < 8) throw new Error(kwfRecoveryText('tooShort'));
      if (password !== confirm) throw new Error(kwfRecoveryText('mismatch'));
      if (!state.kwfPasswordRecovery || state.kwfRecoveryLinkError) {
        throw new Error(kwfRecoveryText('expired'));
      }
      const {data:sessionData, error:sessionError} = await state.client.auth.getSession();
      if (sessionError || !sessionData.session) throw new Error(kwfRecoveryText('expired'));
      const {error} = await state.client.auth.updateUser({password});
      if (error) throw error;
      await state.client.auth.signOut({scope: 'local'}).catch(console.warn);
      state.user = null;
      state.profile = null;
      state.kwfPasswordRecovery = false;
      state.kwfRecoveryLinkError = false;
      state.authView = 'login';
      state.publicPage = 'auth';
      history.replaceState(null, '', location.pathname);
      render();
      notify(kwfRecoveryText('updated'));
    }
  } catch (error) {
    notify(errorStr(error), true);
  } finally {
    state.kwfRecoveryBusy = false;
    if (button && button.isConnected) button.disabled = false;
  }
};

// Some Supabase flows emit PASSWORD_RECOVERY without retaining type=recovery in the URL.
function kwfListenRecoveryEvents(attempts) {
  if (state.client) {
    state.client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        state.kwfPasswordRecovery = true;
        state.kwfRecoveryLinkError = false;
        state.publicPage = 'auth';
        state.authView = 'kwfNewPassword';
        queueMicrotask(() => render());
      }
    });
    if (state.kwfPasswordRecovery) queueMicrotask(() => render());
  } else if (attempts > 0) {
    setTimeout(() => kwfListenRecoveryEvents(attempts - 1), 100);
  }
}
kwfListenRecoveryEvents(60);
