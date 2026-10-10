// Independent build-time security checks for the KWF encrypted backup format.
// No user data, credentials or network required.
'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto').webcrypto;
const fs=require('node:fs');
const vm=require('node:vm');
const {zipSync,unzipSync,strToU8,strFromU8}=require('fflate');

(async()=>{
 const manifest={format:'KWF_DATA_AND_RECEIPTS',version:1,
  tables:{beneficiaries:1},receipts:[],project_ref:'ekthzqacvsjfngtyvplx'};
 const entry={
   'manifest.json':strToU8(JSON.stringify(manifest)),
   'tables/beneficiaries.json':strToU8(JSON.stringify([{id:'test-record',family_name:'Test record'}]))
 };
 const zipped=zipSync(entry,{level:6});
 const password='long-test-passphrase-do-not-use';
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const derive=async text=>{
   const raw=await crypto.subtle.importKey('raw',new TextEncoder().encode(text),'PBKDF2',false,['deriveKey']);
   return crypto.subtle.deriveKey({
     name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'
   },raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 };
 const key=await derive(password);
 const sealed=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,zipped);
 const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,sealed);
 const unzipped=unzipSync(new Uint8Array(clear));
 assert.deepEqual(JSON.parse(strFromU8(unzipped['manifest.json'])),manifest,'manifest decrypts accurately');
 assert.match(strFromU8(unzipped['tables/beneficiaries.json']),/Test record/,'sample record survives encryption');
 const wrongKey=await derive('incorrect-secret-passphrase');
 await assert.rejects(
   crypto.subtle.decrypt({name:'AES-GCM',iv},wrongKey,sealed),
   /operation|decrypt|authentication/i,
   'wrong passphrase must not decrypt backup'
 );
 const tampered=new Uint8Array(sealed);
 tampered[0]^=1;
 await assert.rejects(
   crypto.subtle.decrypt({name:'AES-GCM',iv},key,tampered),
   /operation|decrypt|authentication/i,
   'modified ciphertext must fail GCM authentication'
 );
 const reader=fs.readFileSync('_site/kwf-offline-backup-reader.html','utf8');
 const script=reader.match(/<script>([\s\S]*?)<\/script>/i);
 assert.ok(script,'standalone reader contains inline offline JavaScript');
 new vm.Script(script[1],{filename:'kwf-offline-reader-inline.js'});
 assert.doesNotMatch(script[1],/fetch\(|XMLHttpRequest|import\s*\(/,
   'Offline reader must not depend on any network resource');
 assert.match(reader,/KWF_AES256_GCM_PBKDF2/,'Reader validates the encrypted format');
 const app=fs.readFileSync('_site/app.js','utf8');
 assert.match(app,/kwfBackupDownload/,'Owner app includes encrypted backup action');
 assert.match(app,/kwfBackupRestore/,'Owner app includes restore action');
 assert.match(app,/kwf_backup_restore_missing/,'Restore uses append-only server RPC');
 assert.match(app,/kwf_backup_receipts_page/,'Private storage receipts are included');
 console.log('PASS: Backup encrypt/decrypt round trip, bad passphrase and tampering denied, portable offline reader syntax, owner UI and append-only restore');
})().catch(error=>{console.error(error);process.exit(1);});
