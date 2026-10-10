// Public KWF six-card dashboard — aggregate data only, no account required.
// Uses the existing public_dashboard() Supabase RPC and the same KWF card style.
function kwfPublicCount(field){
  const number=Number(state.dashboard?.[field]??0);
  return Number.isFinite(number)?Math.max(0,Math.trunc(number)):0;
}
function kwfPublicSixStats(){
  const year=kwfPublicCount('year')||new Date().getFullYear();
  const cards=[
    stat(t('annualDonations'),money(state.dashboard?.approved||0)),
    stat(t('annualExpenses'),money(state.dashboard?.spent||0),'red'),
    stat(t('annualBalance'),money(state.dashboard?.balance||0),'gold'),
    stat(t('donors'),kwfPublicCount('donor_count'),'blue'),
    stat(t('families'),kwfPublicCount('beneficiary_count'),'blue'),
    stat(t('aid'),kwfPublicCount('aid_count'))
  ];
  return '<div class="stats annual-stats kwf-six-public-stats" aria-label="KWF '+year+
    ' public financial and beneficiary totals">'+cards.join('')+'</div>';
}
const kwfPriorPublicHomeSix=publicHome;
publicHome=function(){
  const markup=kwfPriorPublicHomeSix();
  const existing=stats(false);
  if(!markup.includes(existing)){
    console.warn('KWF public summary insertion point not found');
    return markup;
  }
  const notes=state.language==='ur'
    ? 'Donors: اس سال کے منظورشدہ عطیات دینے والے منفرد افراد۔ Families: فعال رجسٹرڈ خاندان۔ Aid distributed: منسوخ نہ کیے گئے امدادی ریکارڈز کی کل تعداد۔'
    : 'Donors counts unique people with approved donations this year. Families counts non-archived beneficiary families. Aid distributed counts non-voided aid delivery records.';
  return markup.replace(existing,kwfPublicSixStats())
    .replace('</section>\n  <section class="panel public-campaigns">',
      '<p class="small muted kwf-public-stat-note">'+notes+'</p></section>\n  <section class="panel public-campaigns">');
};
