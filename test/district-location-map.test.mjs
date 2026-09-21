import test from 'node:test';
import assert from 'node:assert/strict';
import {deltaCityMap} from '../data/delta-city-districts.js';
import {deltaCityArticleId,districtArticleIds} from '../data/delta-city-article-ids.js';
import {getDistrictBounds,districtForArticle,districtLocationMapHtml} from '../scripts/district-location-map.js';
import {districtLabelLayout} from '../scripts/district-label-layout.js';
test('all 28 district crops contain every original vertex with prescribed padding',()=>{
 assert.equal(new Set(Object.values(districtArticleIds)).size,28);
 for(const d of deltaCityMap.districts){
  const original=JSON.stringify(d.points),b=getDistrictBounds(d.points);
  const xs=d.points.map(p=>p[0]),ys=d.points.map(p=>p[1]);
  const pad=Math.max(12,Math.min(35,Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))*.06));
  assert.equal(b.x,Math.max(0,Math.min(...xs)-pad));
  assert.equal(b.y,Math.max(0,Math.min(...ys)-pad));
  assert.ok(b.width>0&&b.height>0&&b.x+b.width<=1100&&b.y+b.height<=1430);
  for(const [x,y] of d.points)assert.ok(x>=b.x&&x<=b.x+b.width&&y>=b.y&&y<=b.y+b.height,d.name);
  assert.equal(JSON.stringify(d.points),original);
 }
});
test('edge clipping and minimum/maximum padding',()=>{
 assert.deepEqual(getDistrictBounds([[0,0],[10,10]]),{x:0,y:0,width:22,height:22});
 assert.deepEqual(getDistrictBounds([[100,100],[1000,1400]]),{x:65,y:65,width:970,height:1365});
});
test('stable IDs select districts despite title edits without changing article data',()=>{
 for(const d of deltaCityMap.districts){
  const a={id:districtArticleIds[d.id],title:'Renamed district',text:'Keep all prose',parentIds:[deltaCityArticleId,'another-parent'],visibility:'always-gm'};
  const before=JSON.stringify(a),html=districtLocationMapHtml(a),b=getDistrictBounds(d.points);
  assert.equal(districtForArticle(a),d);
  assert.match(html,/Location/);
  assert.ok(html.includes(`viewBox="${b.x} ${b.y} ${b.width} ${b.height}"`));
  assert.match(html, /<polygon class="cw-district-outline"/);
  assert.match(html, /<text class="cw-district-label"/);
  const layout=districtLabelLayout(d);
  assert.ok(layout,d.name);
  assert.equal(layout.size,14,d.name);
  assert.ok(layout.angle>=-90&&layout.angle<=90,d.name);
  assert.match(html,/textLength="[\d.]+" lengthAdjust="spacingAndGlyphs" transform="rotate\(/);
  assert.doesNotMatch(html,/<tspan/);
  assert.equal(JSON.stringify(a),before);
 }
});
test('other articles, same-title records, and moved articles do not get a map',()=>{
 assert.equal(districtLocationMapHtml({id:'other',title:'Downtown',parentIds:[deltaCityArticleId]}),'');
 assert.equal(districtLocationMapHtml({id:districtArticleIds['district-01-downtown'],parentIds:['root:places']}),'');
});
