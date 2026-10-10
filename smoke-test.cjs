// Build-time non-network regression checks for KWF GitHub Pages.
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const js=fs.readFileSync(process.argv[2]||'_site/app.js','utf8');
const app={innerHTML:''};
const document={
  documentElement:{lang:'en',dir:'ltr'},title:'',
  getElementById(id){return id==='app'?app:null;},
  querySelector(){return null;},addEventListener(){},
  createElement(){return {className:'',textContent:'',append(){},remove(){}};},
  body:{append(){}}
};
const ctx=vm.createContext({
  window:{KWF_CONFIG:{}},document,console,
  localStorage:{getItem(){return 'en';},setItem(){}},
  location:{hash:'',search:'',origin:'https://kalwalwf.github.io',pathname:'/'},
  URLSearchParams,URL,FormData,
  setTimeout(){return 0;},setInterval(){return 0;},queueMicrotask(){},
  confirm(){return true;},prompt(){return 'test reason';},
  history:{replaceState(){}},Blob,navigator:{language:'en'},
  Intl,Date,Math,Number,String,Array,Object,JSON,RegExp,alert(){}
});
vm.runInContext(js,ctx,{timeout:10000,filename:'kwf-website-app.js'});
function run(expression){return vm.runInContext(expression,ctx,{timeout:5000});}
run("state.ready=true;state.authView='login';state.publicPage='auth';render();");
assert.match(app.innerHTML,/kwfForgot/,'login has forgot password');
assert.match(app.innerHTML,/kwfResendVerification/,'login has resend verification');
run("state.authView='kwfForgot';render();");
assert.match(app.innerHTML,/kwfRequestReset/,'email reset request exists');
run("state.authView='kwfNewPassword';render();");
assert.match(app.innerHTML,/kwfSavePassword/,'new password form exists');
run("state.authView='login';state.user={id:'10000000-0000-4000-8000-000000000001',email:'test@example.com'};state.profile={full_name:'Test Owner',role:'owner'};state.view='staff';state.families=[{id:'20000000-0000-4000-8000-000000000002',family_code:'F100',family_name:'Test family',category:'general',status:'active',contact_phone:'',address:'',notes:''}];state.expenses=[];state.aid=[];state.donations=[];state.profiles=[{id:state.user.id,full_name:'Test Owner',role:'owner',phone:''}];state.campaigns=[];state.kwfStaffInvites=[];state.kwfActivity=[];render();");
assert.match(app.innerHTML,/kwfStaffInvite/,'owner can add staff');
run("state.kwfStaffInvites=[{id:'33333333-3333-4333-8333-333333333333',email:'staff@example.com',status:'pending',delivery_state:'not_requested',invited_at:'2026-10-10T10:00:00Z'}];render();");
assert.match(app.innerHTML,/kwfSendInvite/,'pending staff invitation has Send Email button');
assert.match(app.innerHTML,/mailto:/,'pending staff invitation has manual email fallback');
assert.match(app.innerHTML,/Email not sent yet/,'invitation status does not falsely claim delivery');
assert.match(app.innerHTML,/kwfMarkSeen/,'owner sees staff activity logs');
assert.match(app.innerHTML,/kwf-alert-button/,'owner sees notification badge');
assert.match(run("familiesView()"),/kwfEditRecord/,'owner sees edit family');
assert.match(run("accountView()"),/Test Owner/,'account profile visible');
run("state.profile={full_name:'Test Staff',role:'staff'};");
assert.match(run("accountView()"),/kwfStaffSetPassword/,'invited staff can set login password');
run("state.profile={full_name:'Test Owner',role:'owner'};");
run("state.view='families';state.kwfEdit={kind:'beneficiary',record:state.families[0]};render();");
assert.match(app.innerHTML,/kwfSaveEdit/,'edit dialog renders');
run("state.kwfEdit=null;state.profile={full_name:'Test Staff',role:'staff'};");
assert.equal(run("isStaff()"),true,'supporting staff has dashboard access');
assert.match(run("familiesView()"),/kwfEditRecord/,'staff can edit family');
assert.doesNotMatch(run("shell()"),/data-view="settings"/,'staff has no settings navigation');
console.log('PASS: KWF login, forgot password, verification resend, profile, admin staff, alerts, edit, and limited staff menu');
