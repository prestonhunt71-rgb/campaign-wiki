import {districtForArticle,getDistrictBounds} from './district-map-geometry.js';
import {directMapPins} from './map-location.js';
import {deltaCityArticleId} from '../data/delta-city-article-ids.js';
export {districtForArticle,getDistrictBounds} from './district-map-geometry.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const canonicalMapImage='modules/campaign-wiki/assets/delta-city-finalmap.png';
export function districtMapSvg(article,{pins=[],picker=false}={}){
 const district=districtForArticle(article);if(!district)return '';
 const {x,y,width,height}=getDistrictBounds(district.points);
 const radius=Math.max(width,height)/55;
 const markers=pins.map(child=>`<g class="cw-map-pin" role="link" tabindex="0" data-action="open" data-id="${escape(child.id)}" aria-label="${escape(child.title)}" transform="translate(${child.mapLocation.x} ${child.mapLocation.y})"><circle r="${radius}"/><title>${escape(child.title)}</title></g>`).join('');
 return `<svg ${picker?'data-location-picker tabindex="0" role="application"':'role="group"'} aria-label="${escape(article.title)} — location in Delta City" viewBox="${x} ${y} ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"><image href="${canonicalMapImage}" x="0" y="0" width="1100" height="1430"/>${markers}${picker?`<circle class="cw-picker-point" r="${radius}" hidden/>`:''}</svg>`;
}
export function districtLocationMapHtml(article,visibleArticles=[]){
 if(!districtForArticle(article))return '';
 return `<section class="cw-sidebar-fact cw-district-location"><h2>Location</h2>${districtMapSvg(article,{pins:directMapPins(article,visibleArticles)})}<span class="cw-map-pin-label" role="status" hidden></span></section>`;
}
export function mapThumbnailHtml(article){
 const district=districtForArticle(article);
 if(district){const b=getDistrictBounds(district.points);return `<svg class="cw-map-thumbnail" aria-hidden="true" viewBox="${b.x} ${b.y} ${b.width} ${b.height}" preserveAspectRatio="xMidYMid meet"><image href="${canonicalMapImage}" x="0" y="0" width="1100" height="1430"/></svg>`;}
 if(article?.id===deltaCityArticleId)return `<img src="${canonicalMapImage}" alt="">`;
 return '';
}
export function activateDistrictPins(root,openArticle){
 root.querySelectorAll('.cw-map-pin').forEach(pin=>{
  const label=pin.closest('.cw-district-location').querySelector('.cw-map-pin-label');
  const show=()=>{label.textContent=pin.getAttribute('aria-label');label.hidden=false;};
  const hide=()=>{label.hidden=true;};
  pin.addEventListener('pointerenter',show);pin.addEventListener('pointerleave',hide);
  pin.addEventListener('focus',show);pin.addEventListener('blur',hide);
  pin.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openArticle(pin.dataset.id);});
  pin.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();openArticle(pin.dataset.id);}});
 });
}
