import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyUnifiedDatabase,putArticle,removeArticle,visibleArticles} from '../scripts/unified-core.js';
import {deltaCityArticleId,districtArticleIds} from '../data/delta-city-article-ids.js';
import {normalizeMapLocation,directMapPins} from '../scripts/map-location.js';
import {districtLocationMapHtml,mapThumbnailHtml,getDistrictBounds,districtForArticle} from '../scripts/district-location-map.js';
import {deltaCityMapHtml} from '../scripts/delta-city-map.js';
function fixture(){const db=emptyUnifiedDatabase('test');const city=putArticle(db,{id:deltaCityArticleId,title:'Delta City',parentIds:['root:places'],visibility:'always-public'});const district=putArticle(db,{id:districtArticleIds['district-01-downtown'],title:'Downtown',parentIds:[city.id]});const other=putArticle(db,{id:districtArticleIds['district-03-racine'],title:'Racine',parentIds:[city.id]});return {db,city,district,other};}
test('coordinates validate finite canonical numbers and direct parent ownership',()=>{
 for(const value of [{x:NaN,y:1},{x:Infinity,y:1},{x:-1,y:1},{x:1101,y:1},{x:1,y:1431},{x:'10',y:1}])assert.equal(normalizeMapLocation({...value,parentId:'p'},['p']),null);
 assert.equal(normalizeMapLocation({x:1,y:2,parentId:'p'},['q']),null);
 assert.deepEqual(normalizeMapLocation({x:0,y:1430,parentId:'p'},['p']),{x:0,y:1430,parentId:'p'});
});
test('saving coordinates leaves prose and relationships unchanged; parent move clears point',()=>{
 const {db,district,other}=fixture();
 let child=putArticle(db,{id:'child',title:'Museum',parentIds:[district.id,'root:places'],text:'Preserve me',mapLocation:{x:520,y:800,parentId:district.id}});
 assert.equal(child.text,'Preserve me');assert.deepEqual(child.parentIds,[district.id,'root:places']);
 child=putArticle(db,{id:child.id,title:'Renamed Museum'});assert.equal(child.mapLocation.x,520);
 child=putArticle(db,{id:child.id,parentIds:[other.id,'root:places']});assert.equal(child.mapLocation,null);assert.equal(child.text,'Preserve me');
});
test('direct visible children only, no grandchild or neighboring district leakage',()=>{
 const {db,district,other}=fixture();
 const publicChild=putArticle(db,{id:'child',title:'Museum',parentIds:[district.id],mapLocation:{x:520,y:800,parentId:district.id}});
 putArticle(db,{id:'secret',title:'Secret Base',parentIds:[district.id],visibility:'always-gm',mapLocation:{x:525,y:810,parentId:district.id}});
 putArticle(db,{id:'neighbor',title:'Neighbor',parentIds:[other.id],mapLocation:{x:550,y:650,parentId:other.id}});
 const grandchild={id:'grandchild',title:'Inner room',parentIds:[publicChild.id],mapLocation:{x:520,y:800,parentId:district.id}};
 const visible=visibleArticles(db,true);
 assert.deepEqual(directMapPins(district,[...visible,grandchild]).map(a=>a.id),['child']);
 const html=districtLocationMapHtml(district,visible);assert.match(html,/Museum/);assert.doesNotMatch(html,/Secret Base|Neighbor|Inner room/);
 assert.doesNotMatch(deltaCityMapHtml(Object.values(db.articles)),/cw-map-pin|Secret Base|mapLocation/);
});
test('multi-parent map owner stays explicit and deleting owner clears it',()=>{
 const {db,district,other}=fixture();
 const child=putArticle(db,{id:'child',title:'Museum',parentIds:[district.id,other.id],mapLocation:{x:520,y:800,parentId:district.id}});
 assert.equal(directMapPins(district,[child]).length,1);assert.equal(directMapPins(other,[child]).length,0);
 removeArticle(db,district.id);assert.equal(db.articles.child.mapLocation,null);assert.deepEqual(db.articles.child.parentIds,[other.id]);
});
test('invalid parent crops are rejected and unlocated places stay optional',()=>{
 const {db,district}=fixture();
 assert.throws(()=>putArticle(db,{title:'Outside',parentIds:[district.id],mapLocation:{x:0,y:0,parentId:district.id}}),/direct parent district/);
 assert.equal(putArticle(db,{title:'No pin',parentIds:[district.id]}).mapLocation,null);
});
test('shared thumbnails use full city or the exact district bounds and leave other images alone',()=>{
 const {city,district}=fixture();
 assert.match(mapThumbnailHtml(city),/delta-city-finalmap.png/);
 const b=getDistrictBounds(districtForArticle(district).points);
 assert.ok(mapThumbnailHtml(district).includes(`viewBox="${b.x} ${b.y} ${b.width} ${b.height}"`));
 assert.doesNotMatch(mapThumbnailHtml(district),/<polygon|cw-map-pin/);
 assert.equal(mapThumbnailHtml({id:'other',title:'Other',parentIds:[],image:'original.png'}),'');
});
