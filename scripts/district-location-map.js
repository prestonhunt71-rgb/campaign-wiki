import {deltaCityMap} from '../data/delta-city-districts.js';
import {deltaCityArticleId,districtArticleIds} from '../data/delta-city-article-ids.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function getDistrictBounds(points,mapWidth=1100,mapHeight=1430){
 const xs=points.map(([x])=>x),ys=points.map(([,y])=>y);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const padding=Math.max(12,Math.min(35,Math.max(maxX-minX,maxY-minY)*0.06));
 const x=Math.max(0,minX-padding),y=Math.max(0,minY-padding);
 return {x,y,width:Math.min(mapWidth,maxX+padding)-x,height:Math.min(mapHeight,maxY+padding)-y};
}
export function districtForArticle(article){
 if(!article?.parentIds?.includes(deltaCityArticleId))return null;
 return deltaCityMap.districts.find(d=>districtArticleIds[d.id]===article.id)??null;
}
export function districtLocationMapHtml(article){
 const district=districtForArticle(article);
 if(!district)return '';
 const {x,y,width,height}=getDistrictBounds(district.points);
 return `<section class="cw-sidebar-fact cw-district-location"><h2>Location</h2><svg role="img" aria-label="${escape(article.title)} — location in Delta City" viewBox="${x} ${y} ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"><image href="modules/campaign-wiki/assets/delta-city-finalmap.png" x="0" y="0" width="1100" height="1430"/><polygon points="${district.points.map(p=>p.join(',')).join(' ')}"/></svg></section>`;
}
