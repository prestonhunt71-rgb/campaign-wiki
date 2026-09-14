import test from 'node:test';
import assert from 'node:assert/strict';
import {deltaCityMapHtml,isDeltaCityArticle,districtArticleIds} from '../scripts/delta-city-map.js';
import {deltaCityMap} from '../data/delta-city-districts.js';
test('map selection is restricted to the existing direct Places article',()=>{
 assert.equal(isDeltaCityArticle({title:'Delta City',parentIds:['root:places']}),true);
 assert.equal(isDeltaCityArticle({title:'Delta City',parentIds:['root:people']}),false);
 assert.equal(isDeltaCityArticle({title:'Other',parentIds:['root:places']}),false);
});
test('rendering preserves records and links only unambiguous visible district articles',()=>{
 const records=[{id:'downtown',title:'Downtown',parentIds:['city']},{id:'a',title:'Racine'},{id:'b',title:'Racine'}];
 const before=JSON.stringify(records),html=deltaCityMapHtml(records);
 assert.equal(JSON.stringify(records),before);
 assert.equal((html.match(/<polygon /g)||[]).length,28);
 assert.match(html,/data-article-id="downtown"/);
 assert.doesNotMatch(html,/data-article-id="[ab]"/);
 assert.equal(Object.keys(districtArticleIds).length,28);
 for(const district of deltaCityMap.districts)assert.ok(html.includes(`points="${district.points.map(p=>p.join(',')).join(' ')}"`));
});
