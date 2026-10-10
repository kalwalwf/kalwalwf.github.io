// KWF v7 — encrypted OWNER-ONLY records + receipts backup.
// Never publish passwords, PostgreSQL credentials or service-role keys.
// Backup: all required public application tables, Auth identifiers (no passwords),
// private donation receipt files; AES-256-GCM/PBKDF2 encrypted on THIS device.
// Restore: explicit owner confirmation, only missing rows in original project;
// existing rows are NEVER overwritten or deleted.
const kwfBackupProject='ekthzqacvsjfngtyvplx';
const kwfBackupTables=[
 'profiles','campaigns','beneficiaries','settings','kwf_staff_accounts',
 'kwf_staff_permissions','donations','expenses','aid_records',
 'donation_reviews','staff_invites','record_actions','auth_identifiers'
];
const kwfBackupRestoreOrder=[
 'profiles','campaigns','beneficiaries','settings','kwf_staff_accounts',
 'kwf_staff_permissions','donations','expenses','aid_records',
 'donation_reviews','staff_invites','record_actions'
];
let kwfPreparedRestore=null;
let kwfBackupBusy=false;
const kwfBackupTr=(ur,en)=>state.language==='ur'?ur:en;
function kwfBackupPanel(){
 if(!state.user||!kwfOwnerOnly())return '';
 return '<section class="panel kwf-backup-workspace">'+
  '<h3>🔐 '+kwfBackupTr('KWF Backup & Restore','KWF Backup & Restore')+'</h3>'+
  '<p class="kwf-backup-intro">'+kwfBackupTr(
   'صرف Owner اس نظام کو استعمال کر سکتا ہے۔ Database Records اور Private Donation Receipts کو ایک پاس ورڈ والی محفوظ فائل میں ڈاؤن لوڈ کریں۔',
   'Only the Owner can use this service. Download foundation records and private donation receipts in one encrypted backup file.')+'</p>'+
  '<div class="kwf-backup-caution"><b>'+kwfBackupTr('اہم','Important')+':</b> '+
   kwfBackupTr(
    'اس Backup میں ذاتی/مالی ڈیٹا ہے، مگر Login Passwords اور Supabase کا اصل مکمل Database Schema شامل نہیں۔ نئی Supabase Project میں خودکار Restore ممکن نہیں؛ Auth اور Schema کی الگ بحالی ضروری ہے۔ Backup Password بھولنے کی صورت میں فائل کھل نہیں سکے گی۔',
    'Contains sensitive personal and financial data but NOT login passwords or a full PostgreSQL/Auth schema dump. Automatic restore to a NEW Supabase project is not supported: an administrator must first restore its schema and Auth accounts. A forgotten backup passphrase cannot be recovered.')+'</div>'+
  '<details class="kwf-backup-section" open><summary>1. '+
   kwfBackupTr('محفوظ Backup ڈاؤن لوڈ کریں','Download encrypted records & receipts')+'</summary>'+
   '<p class="small muted">'+kwfBackupTr(
    'کم از کم 12 حروف کا نیا Backup Password بنائیں۔ اسے Login Password سے مختلف رکھیں۔ اس فائل کی دو محفوظ کاپیاں رکھیں۔',
    'Choose a separate backup passphrase of at least 12 characters. Store the passphrase safely and keep two independent copies of the backup.')+'</p>'+
   '<div class="kwf-backup-row">'+
    '<label class="kwf-backup-field">'+kwfBackupTr('Backup Password','Backup passphrase')+
     '<input id="kwf-backup-newpass" type="password" minlength="12" autocomplete="new-password" placeholder="12+ characters"></label>'+
    '<label class="kwf-backup-field">'+kwfBackupTr('Password دوبارہ','Repeat passphrase')+
     '<input id="kwf-backup-repeat" type="password" minlength="12" autocomplete="new-password" placeholder="Repeat password"></label>'+
   '</div>'+
   '<div class="kwf-backup-buttons"><button type="button" class="btn" data-action="kwfBackupDownload">'+
    kwfBackupTr('🔒 Backup Download','🔒 Download encrypted backup')+'</button></div>'+
   '<div id="kwf-backup-create-status" class="kwf-backup-progress" role="status" aria-live="polite"></div>'+
  '</details>'+
  '<details class="kwf-backup-section"><summary>2. '+
   kwfBackupTr('Backup کی جانچ اور Restore','Preview / restore an existing backup')+'</summary>'+
   '<p class="small muted">'+kwfBackupTr(
    'اپنی .kwfbackup فائل کھول کر پہلے جائزہ لیں۔ Restore صرف اسی موجودہ Supabase Project کے غائب ریکارڈ شامل کرتا ہے؛ موجودہ ڈیٹا نہ مٹاتا ہے نہ بدلتا ہے۔',
    'Preview your .kwfbackup first. Restore only adds MISSING rows to this same active Supabase project. It does not replace or delete existing data.')+'</p>'+
   '<div class="kwf-backup-row">'+
    '<label class="kwf-backup-field">'+kwfBackupTr('محفوظ Backup فائل','Encrypted backup file')+
     '<input id="kwf-backup-file" type="file" accept=".kwfbackup,application/json"></label>'+
    '<label class="kwf-backup-field">'+kwfBackupTr('Backup Password','Backup passphrase')+
     '<input id="kwf-backup-openpass" type="password" autocomplete="off" placeholder="Existing backup password"></label>'+
   '</div>'+
   '<div class="kwf-backup-buttons"><button type="button" class="btn ghost" data-action="kwfBackupPreview">'+
    kwfBackupTr('فائل چیک کریں','Preview backup')+'</button></div>'+
   '<div id="kwf-backup-restore-status" class="kwf-backup-progress" role="status" aria-live="polite"></div>'+
   '<div id="kwf-backup-preview-result" class="kwf-backup-preview"></div>'+
  '</details>'+
  '<details class="kwf-backup-section"><summary>3. '+
   kwfBackupTr('Website Source کا Backup','Backup website source code separately')+'</summary>'+
   '<p class="small muted">'+kwfBackupTr(
    'Website دوبارہ بنانے کے لیے یہ دونوں ZIP فائلیں بھی ڈاؤن لوڈ کریں۔ صرف Database Backup کافی نہیں۔',
    'Download BOTH repository ZIP files as well. The encrypted data backup alone cannot rebuild the website.')+'</p>'+
   '<div class="kwf-backup-download-sources">'+
    '<a href="https://github.com/kalwalwf/kalwalwf.github.io/archive/refs/heads/main.zip" target="_blank" rel="noopener">'+
      kwfBackupTr('Website Code ZIP','Website code ZIP')+' ↗</a>'+
    '<a href="https://github.com/talhakalwal21/kwf-welfare-web/archive/refs/heads/main.zip" target="_blank" rel="noopener">'+
      kwfBackupTr('اصل KWF Code ZIP','Original KWF source ZIP')+' ↗</a>'+
    '<a href="./kwf-offline-backup-reader.html" download="KWF_Offline_Backup_Reader.html">'+
      kwfBackupTr('Offline Backup Reader محفوظ کریں','Save offline backup reader')+' ↓</a></div>'+
   '<p class="small muted">'+kwfBackupTr(
    'GitHub Account بند ہونے سے پہلے Website Source ZIPs اور Offline Reader اپنے کمپیوٹر پر محفوظ کریں۔',
    'Save the source ZIPs and offline reader on your computer BEFORE a GitHub account outage or deletion.')+'</p>'+
  '</details>'+
 '</section>';
}
const kwfBackupPriorAccount=accountView;
accountView=function(){
 return kwfBackupPriorAccount()+(kwfOwnerOnly()?kwfBackupPanel():'');
};
const kwfBackupPriorStaff=staffView;
staffView=function(){
 const base=kwfBackupPriorStaff();
 return kwfOwnerOnly()?base+kwfBackupPanel():base;
};

function kwfBackupElement(id){
 return typeof document!=='undefined'&&document.getElementById?document.getElementById(id):null;
}
function kwfBackupProgress(message,isError=false,id='kwf-backup-create-status'){
 const el=kwfBackupElement(id);
 if(el){
   el.className='kwf-backup-progress '+(isError?'kwf-backup-error':'');
   el.textContent=message;
 }
}
function kwfBackupBase64(bytes){
 let result='';
 for(let i=0;i<bytes.length;i+=16384){
   const chunk=bytes.subarray(i,i+16384);
   result+=String.fromCharCode.apply(null,chunk);
 }
 return btoa(result);
}
function kwfBackupFromBase64(s){
 const binary=atob(s);
 const out=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);
 return out;
}
function kwfBackupDownloadBlob(blob,name){
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function kwfBackupDeriveKey(passphrase,salt){
 const keyMaterial=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),
  {name:'PBKDF2'},false,['deriveKey']);
 return crypto.subtle.deriveKey({
  name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'
 },keyMaterial,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function kwfBackupZipLib(){
 return import('./kwf-backup-lib.js');
}
async function kwfBackupFetchAll(table){
 const rows=[];
 for(let offset=0;offset<2000000;offset+=150){
   const response=await state.client.rpc('kwf_backup_export_page',{
     p_table:table,p_offset:offset,p_limit:150
   });
   if(response.error)throw new Error('Could not back up '+table+': '+response.error.message);
   if(!Array.isArray(response.data))throw new Error('Invalid '+table+' backup response');
   rows.push(...response.data);
   if(response.data.length<150)return rows;
 }
 throw new Error('Too many '+table+' records for browser backup. Use PostgreSQL pg_dump instead.');
}
async function kwfBackupGetReceiptsManifest(){
 const result=[];
 for(let offset=0;offset<2000000;offset+=150){
  const response=await state.client.rpc('kwf_backup_receipts_page',{p_offset:offset,p_limit:150});
  if(response.error)throw new Error('Could not list private receipts: '+response.error.message);
  if(!Array.isArray(response.data))throw new Error('Invalid receipt manifest');
  result.push(...response.data);
  if(response.data.length<150)return result;
 }
 throw new Error('Too many receipts; a full server-side storage backup is needed.');
}
function kwfBackupValidPath(path){
 return typeof path==='string'&&path.length<700&&
  /^[0-9a-f-]{36}\/[A-Za-z0-9._/-]+$/i.test(path)&&
  !path.startsWith('/')&&!path.includes('..');
}
async function kwfBackupCreate(){
 if(!kwfOwnerOnly()||!state.user||!state.client)throw new Error('Only Foundation Owner may create a backup');
 const password=kwfBackupElement('kwf-backup-newpass')?.value||'';
 const confirm=kwfBackupElement('kwf-backup-repeat')?.value||'';
 if(password.length<12)throw new Error('Backup passphrase must be 12 characters or longer');
 if(password!==confirm)throw new Error('Backup passphrases do not match');
 const {zipSync,strToU8}=await kwfBackupZipLib();
 let totalBytes=0;
 const add=(entries,path,bytes)=>{
  if(totalBytes+bytes.byteLength>45*1024*1024)
    throw new Error('Backup exceeds safe browser size limit (45 MB). Use full pg_dump + storage export.');
  entries[path]=bytes;
  totalBytes+=bytes.byteLength;
 };
 const entries={};
 const manifest={
  format:'KWF_DATA_AND_RECEIPTS',version:1,
  created_at:new Date().toISOString(),
  project_ref:kwfBackupProject,owner_id:state.user.id,
  tables:{},receipts:[],
  restore_limitations:[
   'Only missing rows in original Supabase project can be restored automatically.',
   'Login passwords and complete Auth/PostgreSQL schema are NOT included.',
   'For new project recovery, recreate Auth accounts with matching UUIDs and schema first.'
  ]
 };
 for(const table of kwfBackupTables){
   kwfBackupProgress('Backing up '+table+'…');
   const rows=await kwfBackupFetchAll(table);
   manifest.tables[table]=rows.length;
   add(entries,'tables/'+table+'.json',strToU8(JSON.stringify(rows)));
 }
 const receipts=await kwfBackupGetReceiptsManifest();
 for(let i=0;i<receipts.length;i++){
   const meta=receipts[i];
   if(!kwfBackupValidPath(meta.name))
     throw new Error('Unrecognized receipt path. Backup cancelled to avoid an incomplete archive.');
   kwfBackupProgress('Downloading private receipt '+(i+1)+' / '+receipts.length+'…');
   const file=await state.client.storage.from('kwf-receipts').download(meta.name);
   if(file.error||!file.data)
     throw new Error('Could not back up receipt '+(i+1)+': '+(file.error?.message||'Download unavailable'));
   if(file.data.size>10*1024*1024)
     throw new Error('Individual receipt exceeds 10 MB browser backup limit.');
   const bytes=new Uint8Array(await file.data.arrayBuffer());
   add(entries,'receipts/'+meta.name,bytes);
   manifest.receipts.push({
     path:meta.name,mime_type:String(meta.mime_type||'application/octet-stream'),size:bytes.length
   });
 }
 add(entries,'manifest.json',strToU8(JSON.stringify(manifest,null,2)));
 kwfBackupProgress('Compressing and encrypting…');
 const archive=zipSync(entries,{level:6});
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await kwfBackupDeriveKey(password,salt);
 const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,archive));
 const envelope={
   format:'KWF_AES256_GCM_PBKDF2',version:1,
   created_at:manifest.created_at,
   iterations:310000,
   salt:kwfBackupBase64(salt),iv:kwfBackupBase64(iv),
   ciphertext:kwfBackupBase64(encrypted)
 };
 const file=new Blob([JSON.stringify(envelope)],{type:'application/octet-stream'});
 const stamp=manifest.created_at.replace(/[:.]/g,'-');
 kwfBackupDownloadBlob(file,'KWF_SECURE_'+stamp+'.kwfbackup');
 const p=kwfBackupElement('kwf-backup-newpass');
 const c=kwfBackupElement('kwf-backup-repeat');
 if(p)p.value='';if(c)c.value='';
 kwfBackupProgress('Backup downloaded: '+kwfBackupTables.length+' datasets, '+
   manifest.receipts.length+' receipt files. Save the passphrase and TWO copies of the file.');
}
function kwfBackupNormalizeRows(unzipped,lib,table){
 const file=unzipped['tables/'+table+'.json'];
 if(!file)throw new Error('Backup is missing '+table);
 const rows=JSON.parse(lib.strFromU8(file));
 if(!Array.isArray(rows)||rows.length>2000000)throw new Error('Invalid '+table+' records');
 return rows;
}
async function kwfBackupPreview(){
 if(!kwfOwnerOnly()||!state.user)throw new Error('Owner login required');
 kwfPreparedRestore=null;
 const file=kwfBackupElement('kwf-backup-file')?.files?.[0];
 const passphrase=kwfBackupElement('kwf-backup-openpass')?.value||'';
 if(!file)throw new Error('Choose an encrypted .kwfbackup file');
 if(!passphrase)throw new Error('Enter the backup passphrase');
 if(file.size>100*1024*1024)throw new Error('File exceeds the 100 MB browser limit');
 kwfBackupProgress('Decrypting locally; no backup is uploaded…',false,'kwf-backup-restore-status');
 const envelope=JSON.parse(await file.text());
 if(envelope.format!=='KWF_AES256_GCM_PBKDF2'||envelope.version!==1||
   envelope.iterations!==310000)throw new Error('Unknown backup format/version');
 const salt=kwfBackupFromBase64(envelope.salt);
 const iv=kwfBackupFromBase64(envelope.iv);
 if(salt.length!==16||iv.length!==12)throw new Error('Invalid encryption parameters');
 const key=await kwfBackupDeriveKey(passphrase,salt);
 let decrypted;
 try{
   decrypted=new Uint8Array(await crypto.subtle.decrypt({
     name:'AES-GCM',iv
   },key,kwfBackupFromBase64(envelope.ciphertext)));
 }catch(_err){throw new Error('Incorrect passphrase or damaged encrypted backup');}
 if(decrypted.byteLength>70*1024*1024)throw new Error('Decrypted ZIP exceeds allowed size');
 const lib=await kwfBackupZipLib();
 let totalUnpacked=0;
 const files=lib.unzipSync(decrypted,{
   filter(entry){
     const size=Number(entry.originalSize||0);
     totalUnpacked+=size;
     return size<=20*1024*1024&&totalUnpacked<=80*1024*1024;
   }
 });
 if(!files['manifest.json'])throw new Error('Manifest is missing or archive too large');
 const manifest=JSON.parse(lib.strFromU8(files['manifest.json']));
 if(manifest.format!=='KWF_DATA_AND_RECEIPTS'||manifest.version!==1)
   throw new Error('Unsupported KWF backup manifest');
 if(manifest.project_ref!==kwfBackupProject)
   throw new Error('This backup belongs to a different Supabase project. New-project recovery requires an administrator.');
 if(manifest.owner_id!==state.user.id)
   throw new Error('Backup Owner account differs from current Owner. Automatic restore is disabled.');
 const tables={};
 for(const table of kwfBackupTables){
   const rows=kwfBackupNormalizeRows(files,lib,table);
   if(rows.length!==manifest.tables[table])throw new Error('Record count verification failed for '+table);
   tables[table]=rows;
 }
 if(!Array.isArray(manifest.receipts))throw new Error('Invalid receipt manifest');
 const totalFiles=manifest.receipts.length;
 if(totalFiles>10000)throw new Error('Too many receipt files');
 for(const item of manifest.receipts){
   if(!kwfBackupValidPath(item.path)||!files['receipts/'+item.path])
     throw new Error('Backup contains an invalid or missing receipt file');
   if(files['receipts/'+item.path].length!==item.size)
     throw new Error('Receipt length does not match manifest');
 }
 const wipe=kwfBackupElement('kwf-backup-openpass');
 if(wipe)wipe.value='';
 kwfPreparedRestore={manifest,tables,files};
 const text=Object.entries(manifest.tables).map(([key,value])=>'<li>'+html(key)+': <b>'+Number(value)+'</b></li>').join('');
 const result=kwfBackupElement('kwf-backup-preview-result');
 if(result){
   result.innerHTML='<div class="kwf-backup-success"><b>Backup verified:</b> '+html(manifest.created_at)+
    '<div>'+Object.values(manifest.tables).reduce((a,b)=>a+Number(b),0)+' database rows; '+
    totalFiles+' private receipts.</div></div>'+
    '<p class="kwf-backup-caution">'+kwfBackupTr(
      'Restore صرف غائب ریکارڈز دوبارہ شامل کرے گا۔ موجودہ ڈیٹا نہیں بدلے گا۔ اگر Auth Users پرانے Project میں موجود نہیں تو Restore ناکام ہو سکتا ہے۔',
      'Restore adds missing records only. It does not overwrite any existing rows. If original Auth user IDs no longer exist in this project, restoration may fail.')+'</p>'+
    '<details><summary>Show backed-up table counts</summary><ul>'+text+'</ul></details>'+
    '<button class="btn" type="button" data-action="kwfBackupRestore">'+
    kwfBackupTr('غائب ریکارڈ Restore کریں','Restore missing records')+'</button>';
 }
 kwfBackupProgress('Decrypted and verified on your device. No records changed yet.',false,'kwf-backup-restore-status');
}
async function kwfBackupRestore(){
 if(!kwfPreparedRestore||!kwfOwnerOnly()||!state.user)throw new Error('Preview a backup as Owner first');
 const {manifest,tables,files}=kwfPreparedRestore;
 if(manifest.project_ref!==kwfBackupProject||manifest.owner_id!==state.user.id)
   throw new Error('This is not an eligible same-project Owner backup');
 if(!window.confirm('Restore MISSING KWF records into this existing Supabase project? Existing rows will not be overwritten.'))return;
 const typed=window.prompt('Type RESTORE to confirm. This will add missing records but never delete existing records.');
 if(typed!=='RESTORE')return;
 const counts={};
 for(const table of kwfBackupRestoreOrder){
   counts[table]={inserted:0,skipped:0};
   const all=tables[table]||[];
   for(let offset=0;offset<all.length;offset+=100){
     kwfBackupProgress('Restoring '+table+': '+Math.min(offset+100,all.length)+'/'+all.length,
       false,'kwf-backup-restore-status');
     const response=await state.client.rpc('kwf_backup_restore_missing',{
       p_table:table,p_rows:all.slice(offset,offset+100)
     });
     if(response.error)throw new Error('Restore stopped at '+table+': '+response.error.message+
       '. Some preceding missing rows may already have been added; retrying the same backup is safe.');
     counts[table].inserted+=Number(response.data?.inserted||0);
     counts[table].skipped+=Number(response.data?.skipped||0);
   }
 }
 let receiptsRestored=0,receiptsSkipped=0;
 const receiptProblems=[];
 for(let i=0;i<manifest.receipts.length;i++){
   const item=manifest.receipts[i];
   kwfBackupProgress('Restoring receipt '+(i+1)+' / '+manifest.receipts.length,
     false,'kwf-backup-restore-status');
   try{
     const result=await state.client.functions.invoke('kwf-restore-receipt',{
       body:{path:item.path,size:item.size}
     });
     if(result.error||!result.data?.token){
       let reason=result.data?.error||result.error?.message||'No upload permission';
       if(result.error?.context?.json){
         try{const detail=await result.error.context.json();reason=detail.error||reason;}catch(_error){}
       }
       throw new Error(reason);
     }
     const file=new Blob([files['receipts/'+item.path]],{
       type:item.mime_type||'application/octet-stream'
     });
     const uploaded=await state.client.storage.from('kwf-receipts').uploadToSignedUrl(
       item.path,result.data.token,file,{contentType:item.mime_type||'application/octet-stream',upsert:false}
     );
     if(uploaded.error){
       if(/already exists|duplicate|409|resource already/i.test(uploaded.error.message||'')){
         receiptsSkipped++;continue;
       }
       throw uploaded.error;
     }
     receiptsRestored++;
   }catch(err){
     receiptProblems.push((i+1)+': '+String(err.message||err).slice(0,120));
   }
 }
 counts.receipts={restored:receiptsRestored,already_present:receiptsSkipped,errors:receiptProblems.length};
 const log=await state.client.rpc('kwf_backup_log_restore',{p_counts:counts});
 if(log.error)console.warn('Restore audit could not be saved:',log.error.message);
 const summary=Object.values(counts).reduce((sum,v)=>sum+Number(v.inserted||0),0);
 const result=kwfBackupElement('kwf-backup-preview-result');
 if(result){
   result.innerHTML='<div class="'+(receiptProblems.length?'kwf-backup-error':'kwf-backup-success')+'">'+
   'Restore finished. <b>'+summary+'</b> missing database rows added; '+
   receiptsRestored+' receipt files restored, '+receiptsSkipped+' already present; '+
   receiptProblems.length+' receipt errors.'+
   (receiptProblems.length?'<p>'+html(receiptProblems.slice(0,6).join('; '))+'</p>':'')+
   '</div><p>Existing database rows have not been overwritten.</p>';
 }
 kwfBackupProgress(receiptProblems.length?'Restore partly completed. Review receipt errors and retry.':
  'Restore completed. Please refresh the dashboard and verify counts.',
  receiptProblems.length>0,'kwf-backup-restore-status');
 kwfPreparedRestore=null;
}
const kwfBackupPriorClick=clickAction;
clickAction=async function(el){
 const action=el?.dataset?.action;
 if(!['kwfBackupDownload','kwfBackupPreview','kwfBackupRestore'].includes(action))
   return kwfBackupPriorClick(el);
 if(kwfBackupBusy)return;
 if(!kwfOwnerOnly()){
   notify('Only Foundation Owner may use Backup & Restore',true);
   return;
 }
 kwfBackupBusy=true;
 const button=el;
 button.disabled=true;
 try{
  if(action==='kwfBackupDownload')await kwfBackupCreate();
  else if(action==='kwfBackupPreview')await kwfBackupPreview();
  else await kwfBackupRestore();
 }catch(err){
   const statusId=action==='kwfBackupDownload'?'kwf-backup-create-status':'kwf-backup-restore-status';
   kwfBackupProgress('Backup operation stopped: '+String(err.message||err),
     true,statusId);
   notify(String(err.message||err),true);
   console.error('KWF owner backup operation failed',err);
 }finally{
  kwfBackupBusy=false;
  if(button.isConnected)button.disabled=false;
 }
};
const kwfBackupPriorRefresh=refresh;
refresh=async function(silent){
 await kwfBackupPriorRefresh(silent);
 if(!kwfOwnerOnly()||!state.user)kwfPreparedRestore=null;
};
