import {deltaCityMap} from "../data/delta-city-districts.js";
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Optional explicit Article IDs, keyed by district ID. Null uses an exact visible title match.
export const districtArticleIds = Object.fromEntries(deltaCityMap.districts.map(d => [d.id, null]));
export function isDeltaCityArticle(article) {
  return article?.title === 'Delta City' && article.parentIds?.includes('root:places');
}
export function deltaCityMapHtml(visibleArticles) {
  const polygons = deltaCityMap.districts.map(d => {
    const explicit = districtArticleIds[d.id];
    const matches = visibleArticles.filter(a => explicit ? a.id === explicit : a.title.toLocaleLowerCase() === d.name.toLocaleLowerCase());
    const target = matches.length === 1 ? matches[0].id : '';
    return `<polygon tabindex="0" role="${target ? 'link' : 'button'}" aria-label="${escape(d.name)}" data-district="${d.id}" data-name="${escape(d.name)}" data-article-id="${escape(target)}" points="${d.points.map(p=>p.join(',')).join(' ')}"></polygon>`;
  }).join('');
  return `<div class="cw-delta-map"><img src="modules/campaign-wiki/assets/delta-city-finalmap.png" width="1100" height="1430" alt="Delta City district map"><svg viewBox="0 0 1100 1430" preserveAspectRatio="xMidYMid meet" aria-label="Interactive Delta City districts">${polygons}</svg><span class="cw-delta-tooltip" role="status" hidden></span></div>`;
}
export function activateDeltaCityMap(root, openArticle) {
  const map = root.querySelector('.cw-delta-map');
  if (!map) return;
  const tooltip = map.querySelector('.cw-delta-tooltip');
  let touchSelection = null;
  const hide = () => { tooltip.hidden = true; };
  const show = (polygon, x, y) => {
    tooltip.textContent = polygon.dataset.name;
    tooltip.hidden = false;
    const box = map.getBoundingClientRect();
    tooltip.style.left = `${Math.max(0, Math.min(x - box.left + 12, box.width - tooltip.offsetWidth))}px`;
    tooltip.style.top = `${Math.max(0, Math.min(y - box.top + 12, box.height - tooltip.offsetHeight))}px`;
  };
  const identify = polygon => {const box=polygon.getBoundingClientRect();show(polygon,box.left+box.width/2,box.top+box.height/2);};
  map.querySelectorAll('[data-district]').forEach(polygon => {
    polygon.addEventListener('pointermove', event => {if(event.pointerType !== 'touch') show(polygon,event.clientX,event.clientY);});
    polygon.addEventListener('pointerleave', hide);
    polygon.addEventListener('focus', () => identify(polygon));
    polygon.addEventListener('blur', () => {polygon.classList.remove('is-selected');if(touchSelection===polygon)touchSelection=null;hide();});
    polygon.addEventListener('pointerdown', event => {
      if(event.pointerType !== 'touch') return;
      polygon.dataset.touch = 'true';
      touchSelection?.classList.remove('is-selected');
      touchSelection=polygon;
      polygon.classList.add('is-selected');
      show(polygon,event.clientX,event.clientY);
    });
    polygon.addEventListener('click', event => {
      event.preventDefault();
      if(polygon.dataset.touch){delete polygon.dataset.touch;identify(polygon);return;}
      if(polygon.dataset.articleId)openArticle(polygon.dataset.articleId);
      else identify(polygon);
    });
    polygon.addEventListener('keydown', event => {
      if(event.key === 'Escape'){polygon.classList.remove('is-selected');hide();return;}
      if(event.key !== 'Enter' && event.key !== ' ')return;
      event.preventDefault();
      if(polygon.dataset.articleId)openArticle(polygon.dataset.articleId);
      else identify(polygon);
    });
  });
}
