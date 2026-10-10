// Stable family serial numbers (assigned in PostgreSQL on INSERT).
// The original family table contains action columns and aided-family colors;
// prepend just the Sr. No. column without replacing those features.
const kwfFamilySerialOriginalView=familiesView;
familiesView=function(){
  const page=kwfFamilySerialOriginalView();
  const tableStart=page.indexOf('<table class="dataTable">');
  if(tableStart<0)return page;
  const tableClose=page.indexOf('</table>',tableStart);
  if(tableClose<0)return page;
  let before=page.slice(0,tableStart);
  let tableMarkup=page.slice(tableStart,tableClose+8);
  let after=page.slice(tableClose+8);
  const head=tableMarkup.indexOf('<thead><tr>');
  const start=tableMarkup.indexOf('<tbody>');
  const end=tableMarkup.indexOf('</tbody>',start);
  if(head<0 || start<0 || end<0)return page;
  tableMarkup=tableMarkup.slice(0,head)+
    tableMarkup.slice(head).replace('<thead><tr>',
      '<thead><tr><th class="kwf-serial-heading">'+(state.language==='ur'?'سیریل نمبر':'Sr. No.')+'</th>');
  // Recalculate tbody bounds after header insertion.
  const b1=tableMarkup.indexOf('<tbody>');
  const b2=tableMarkup.indexOf('</tbody>',b1);
  let row=0;
  const rows=tableMarkup.slice(b1+7,b2).replace(/<tr\b[^>]*>/g,function(open){
    const family=(state.families||[])[row++];
    const num=family?.serial_no;
    return open+'<td class="kwf-serial-cell">'+html(num==null?'—':String(num))+'</td>';
  });
  tableMarkup=tableMarkup.slice(0,b1+7)+rows+tableMarkup.slice(b2);
  return before+tableMarkup+after;
};
