import {isTelegram} from "./telegrams.js";
import {articlePaths, visibleArticles} from './unified-core.js';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key = value => String(value ?? '').trim().toLowerCase().replace(/[’‘]/g,"'");
export function isMediaArticle(data, article) {
  return !article.organizer && articlePaths(data, article).some(path => path[0] === 'root:images' && path.length > 2 &&
    (path[1] === 'organizer:media' || key(data.articles[path[1]]?.title) === 'media'));
}
export function findNewsstand(data) {
  const matches = Object.values(data.articles).filter(article => articlePaths(data,article).some(path=>path[0]==='root:places') &&
    [article.title,...(article.aliases||[])].some(name=>["nakamura news and sundries","ken's newsstand"].includes(key(name))));
  return matches.length === 1 ? matches[0] : null;
}
export function newestFirst(a,b) {
  return String(b.date||'').localeCompare(String(a.date||'')) ||
    String(b.createdAt||'').localeCompare(String(a.createdAt||'')) || a.id.localeCompare(b.id);
}
export function newsstandStock(data,asPlayer=false) {
  const stand=findNewsstand(data), visible=visibleArticles(data,asPlayer);
  if(!stand || !visible.some(a=>a.id===stand.id)) return [];
  const categories=new Set(visible.filter(a=>a.parentIds.includes(stand.id)&&shelfNames.has(key(a.title))&&
    articlePaths(data,a).some(p=>p[0]==='root:images'&&(p[1]==='organizer:media'||key(data.articles[p[1]]?.title)==='media'))).map(a=>a.id));
  return visible.filter(a=>!categories.has(a.id)&&!isTelegram(data,a)&&isMediaArticle(data,a)&&
    (a.parentIds.includes(stand.id)||articlePaths(data,a).some(p=>p.slice(0,-1).some(id=>categories.has(id))))).sort(newestFirst);
}
export function latestNewspaper(data, asPlayer = false) {
  return newsstandStock(data,asPlayer).find(a=>a.quote?.trim()) ?? null;
}
export function newsboyCry(article) {
  const headline = article.quote.trim();
  const wrappers = [h => `EXTRA! EXTRA! — ${h} — READ ALL ABOUT IT!`, h => `GET YOUR PAPER! — ${h}`,
    h => `LATEST EDITION! — ${h} — GET THE WHOLE STORY!`, h => `READ ALL ABOUT IT! — ${h}`];
  let hash = 0;
  for (const char of article.id) hash = (Math.imul(hash, 31) + char.codePointAt(0)) >>> 0;
  return wrappers[hash % wrappers.length](headline);
}
export function latestNewspaperTickerHtml(data, asPlayer = false) {
  const article = latestNewspaper(data, asPlayer), stand = findNewsstand(data);
  if (!article || !stand) return '';
  const cry = escapeHtml(newsboyCry(article));
  return `<button type="button" class="cw-newspaper-ticker" data-action="open" data-id="${escapeHtml(stand.id)}" aria-label="${escapeHtml(`Visit ${stand.title}: ${article.quote.trim()}`)}"><span class="cw-newspaper-track" aria-hidden="true"><span>${cry}</span><span class="cw-newspaper-repeat">${cry}</span></span></button>`;
}
const shelfNames = new Map([
 ['newspapers','Newspapers'],
 ['magazines','Magazines & Periodicals'],['magazine','Magazines & Periodicals'],['periodicals','Magazines & Periodicals'],
 ['pulps','Magazines & Periodicals'],['pulp','Magazines & Periodicals'],['comics','Comic Books'],['comic books','Comic Books'],
 ['books','Books for Your Leisure'],['postcards','Picture Post Cards'],['post cards','Picture Post Cards']
]);
export function shelfFor(data,article) {
 const categories=articlePaths(data,article).filter(p=>p[0]==='root:images').flatMap(p=>p.slice(2,-1)).map(id=>shelfNames.get(key(data.articles[id]?.title))).filter(Boolean);
 const unique=[...new Set(categories)];
 return unique.length===1 ? unique[0] : 'Sundries';
}
export function newsstandShelves(data,asPlayer=false) {
 const stock=newsstandStock(data,asPlayer), papers=stock.filter(a=>a.quote?.trim());
 const groups=new Map([['Back Numbers',papers.slice(1,6)],['Newspapers',[]],['Magazines & Periodicals',[]],['Comic Books',[]],['Books for Your Leisure',[]],['Picture Post Cards',[]],['Sundries',[]]]);
 for(const article of stock.filter(a=>!a.quote?.trim())) groups.get(shelfFor(data,article)).push(article);
 return {today:papers[0]??null,groups:[...groups].map(([title,items])=>({title,items:items.slice(0,5)})).filter(g=>g.items.length)};
}
export function newsstandCardHtml(article,featured=false) {
 return `<button type="button" class="cw-relationship-card cw-newsstand-card${featured?' cw-todays-paper-card':''}" data-action="open" data-id="${escapeHtml(article.id)}">${article.image?`<img src="${escapeHtml(article.image)}" alt="" loading="lazy">`:'<span aria-hidden="true">▤</span>'}<span><strong>${escapeHtml(article.title)}</strong>${article.date?`<small>${escapeHtml(article.date)}</small>`:''}${featured?`<em>${escapeHtml(article.quote)}</em>`:''}</span></button>`;
}
export function todaysPaperHtml(data,article,asPlayer=false) {
 if(findNewsstand(data)?.id!==article.id) return '';
 const {today}=newsstandShelves(data,asPlayer);
 return today?`<section class="cw-relationship-section cw-todays-paper"><h2>Today's Paper</h2>${newsstandCardHtml(today,true)}</section>`:'';
}
export function newsstandShelvesHtml(data,article,asPlayer=false) {
 if(findNewsstand(data)?.id!==article.id) return '';
 return newsstandShelves(data,asPlayer).groups.map(({title,items})=>`<section class="cw-relationship-section"><h2>${escapeHtml(title)}</h2><div class="cw-relationship-list">${items.map(a=>newsstandCardHtml(a)).join('')}</div></section>`).join('');
}
