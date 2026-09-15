import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {emptyUnifiedDatabase,putArticle,primaryArticlePath,ROOT_IDS} from '../scripts/unified-core.js';
function fixture(){
 const db=emptyUnifiedDatabase();
 const add=(id,parentIds,extra={})=>putArticle(db,{id,title:id,parentIds,...extra});
 add('media',['root:images']); add('comics',['media']); add('hero',['root:arcs','root:people']);
 const article=add('issue',['comics','hero'],{parentPathHints:{comics:['root:images','media','comics']}});
 return {db,article,add};
}
test('breadcrumbs use first saved relationship even when a later path is shorter',()=>{
 const {db,article}=fixture();
 assert.deepEqual(primaryArticlePath(db,article),['root:images','media','comics','issue']);
 putArticle(db,{...article,title:'Renamed issue'});
 assert.deepEqual(primaryArticlePath(db,db.articles.issue),['root:images','media','comics','issue']);
});
test('primary path honors the selected branch and falls back after stale hints',()=>{
 const {db,add}=fixture();
 const child=add('child',['hero'],{parentPathHints:{hero:['root:people','hero']}});
 assert.deepEqual(primaryArticlePath(db,child),['root:people','hero','child']);
 db.articles.hero.parentIds=['root:arcs'];
 assert.deepEqual(primaryArticlePath(db,child),['root:arcs','hero','child']);
});
test('first surviving parent becomes primary; corrupt paths terminate safely',()=>{
 const {db,article}=fixture();
 article.parentIds=['hero'];
 assert.deepEqual(primaryArticlePath(db,article),['root:arcs','hero','issue']);
 db.articles.hero.parentIds=['issue'];
 assert.equal(primaryArticlePath(db,article),null);
});
test('rendered breadcrumb ignores secondary navigation route and emits one path',()=>{
 const {db,article}=fixture();
 const source=readFileSync(new URL('../scripts/campaign-wiki.js',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('function breadcrumbRows('),source.indexOf('\nfunction articleRole('));
 const render=vm.runInNewContext(`(${fn})`,{primaryArticlePath,ROOT_IDS,esc:String,rootLabel:id=>id,visibilityLabel:()=> 'Public'});
 const html=render(db,article,['root:arcs','hero','issue']);
 assert.match(html,/media/); assert.match(html,/comics/); assert.doesNotMatch(html,/hero|root:arcs/);
 assert.equal((html.match(/<nav /g)||[]).length,1);
});
