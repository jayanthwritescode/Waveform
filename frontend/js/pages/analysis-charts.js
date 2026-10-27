import {escapeHtml as html} from '../utils/html.js';
export function bars(rows,empty='No recorded data yet.') {
  if(!rows.length)return `<p class="analysis-empty">${html(empty)}</p>`;
  const max=Math.max(...rows.map(row=>row.count),1);
  return `<ul class="analysis-bars">${rows.slice(0,10).map(row=>`<li><div><span>${html(row.label)}</span><strong>${row.count}</strong></div><meter min="0" max="${max}" value="${row.count}" aria-label="${html(row.label)}: ${row.count}">${row.count}</meter></li>`).join('')}</ul>${rows.length>10?`<p class="generation-help">Top 10 of ${rows.length} labels.</p>`:''}`;
}
export function dailyChart(rows) {
  const total=rows.reduce((sum,row)=>sum+row.count,0);
  if(!total)return '<p class="analysis-empty">No recorded generations in this window. Generate a playlist to begin; comparison and artist requests do not create sessions.</p>';
  const max=Math.max(...rows.map(row=>row.count),1),width=600,height=120;
  const points=rows.map((row,i)=>`${(i/(rows.length-1)*width).toFixed(2)},${(height-row.count/max*(height-12)).toFixed(2)}`).join(' ');
  return `<figure class="daily-chart"><svg viewBox="0 0 ${width} ${height+8}" role="img" aria-label="Recorded generations per UTC day, ${total} total; maximum ${max} in one day"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><figcaption>${html(rows[0].day)} — ${html(rows.at(-1).day)} · UTC days · peak ${max}</figcaption></figure><details><summary>Daily counts table</summary><div class="analysis-table-scroll"><table><thead><tr><th scope="col">UTC day</th><th scope="col">Generations</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${html(row.day)}</td><td>${row.count}</td></tr>`).join('')}</tbody></table></div></details>`;
}
