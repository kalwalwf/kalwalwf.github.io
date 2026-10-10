// Replace the historical "not connected / set up SQL" screen. A slow
// connection is NOT an indication that Supabase has not been configured.
const kwfConnectionPriorClick=clickAction;
setupView=function(){
  const ur=state.language==='ur';
  return '<div class="authbg"><div class="authcard kwf-loading-card" role="status" aria-live="polite">'+
    '<div class="authbrand">'+logo()+'<h1>Kalwal Welfare Foundation</h1>'+
    '<p>KWF Welfare Management Portal</p></div>'+
    '<div class="kwf-loading-spinner" aria-hidden="true"></div>'+
    '<h3>'+(ur?'KWF سے رابطہ ہو رہا ہے…':'Connecting to KWF…')+'</h3>'+
    '<p class="small muted">'+(ur?
    'انٹرنیٹ سست ہو تو چند لمحے انتظار کریں۔ دوبارہ کوشش کرنے کے لیے Retry دبائیں۔':
    'On a slow connection, please wait a moment. Select Retry if the page does not load.')+
    '</p><div class="kwf-loading-actions">'+
    '<button type="button" class="btn" data-action="kwfRetryConnectionV3">'+(ur?'دوبارہ کوشش کریں':'Retry')+'</button>'+
    '</div><p class="small muted">'+(ur?'مالی ریکارڈ لوڈ ہونے تک کوئی تبدیلی نہیں ہوگی۔':
     'No financial records are changed while the website loads.')+'</p></div></div>';
};
clickAction=async function(el){
  if(el?.dataset?.action==='kwfRetryConnectionV3'){
    if(typeof location.reload==='function')location.reload();
    return;
  }
  return kwfConnectionPriorClick(el);
};
// start() in the base app runs before all concatenated enhancements execute,
// so paint the proper loading screen immediately after these overrides load.
if(!state.ready)render();
