import {deltaCityMap} from '../data/delta-city-districts.js';
import {deltaCityArticleId,districtArticleIds} from '../data/delta-city-article-ids.js';
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
