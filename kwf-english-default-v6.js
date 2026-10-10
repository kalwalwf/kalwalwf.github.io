// KWF site language bootstrap. Run BEFORE the original app initializes.
// First-time visitors open in English. An intentionally selected Urdu/English
// preference remains stored in kwfLanguage and survives page reloads.
try {
  const preference=localStorage.getItem('kwfLanguage');
  if(preference!=='ur' && preference!=='en'){
    localStorage.setItem('kwfLanguage','en');
  }
} catch (_err) {
  // Private/incognito storage failures must never prevent the site from loading.
}
