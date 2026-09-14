import {districtForArticle,getDistrictBounds} from './district-map-geometry.js';
export function normalizeMapLocation(value,parentIds=[]){
 if(!value||typeof value.x!=='number'||typeof value.y!=='number'||!Number.isFinite(value.x)||!Number.isFinite(value.y)||value.x<0||value.x>1100||value.y<0||value.y>1430||typeof value.parentId!=='string'||!parentIds.includes(value.parentId))return null;
 return {x:value.x,y:value.y,parentId:value.parentId};
}
export function locationFitsDistrict(location,parent){
 const d=districtForArticle(parent);
 if(!d||location?.parentId!==parent.id)return false;
 const b=getDistrictBounds(d.points);
 return location.x>=b.x&&location.x<=b.x+b.width&&location.y>=b.y&&location.y<=b.y+b.height;
}
export function validateArticleMapLocation(article,database){
 const location=normalizeMapLocation(article.mapLocation,article.parentIds);
 return location&&locationFitsDistrict(location,database.articles[location.parentId])?location:null;
}
export function directMapPins(parent,visibleArticles){
 return visibleArticles.filter(article=>{
  const location=normalizeMapLocation(article.mapLocation,article.parentIds);
  return location&&locationFitsDistrict(location,parent);
 });
}
export function canonicalPointer(svg,clientX,clientY){
 const matrix=svg.getScreenCTM();
 if(!matrix)return null;
 const point=svg.createSVGPoint();point.x=clientX;point.y=clientY;
 const p=point.matrixTransform(matrix.inverse());
 return {x:p.x,y:p.y};
}
