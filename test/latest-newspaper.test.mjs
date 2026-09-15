import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {emptyUnifiedDatabase,putArticle} from '../scripts/unified-core.js';
import {latestNewspaper,latestNewspaperTickerHtml,findNewsstand,newsstandStock,newsstandShelves,newsstandShelvesHtml,todaysPaperHtml} from '../scripts/latest-newspaper.js';
function fixture(){
 const db=emptyUnifiedDatabase();
 const add=(id,props={})=>putArticle(db,{id,title:id,parentIds:['organizer:media','stand'],visibility:'always-public',...props});
 add('stand',{title:'Nakamura News and Sundries',parentIds:['root:places']});
 add('organizer:media',{title:'Media',parentIds:['root:images'],organizer:true});
 return {db,add};
}
test('directly stocked Media still requires a quote for the ticker, with no checkbox',()=>{
 const {db,add}=fixture();
 add('outside',{quote:'Outside',parentIds:['organizer:media']});
 add('npc',{quote:'Hello',parentIds:['stand','root:people']});
 add('blank',{quote:'  '});
 assert.equal(latestNewspaper(db),null);
 assert.equal(latestNewspaperTickerHtml(db),'');
 add('paper',{quote:'Headline',newspaper:false});
 assert.equal(latestNewspaper(db).id,'paper');
});
test('article Date determines current edition, creation breaks ties and session dates do not override',()=>{
 const {db,add}=fixture();
 add('arc',{parentIds:['root:arcs']});add('session',{parentIds:['arc'],date:'1999-01-01'});
 add('old',{quote:'Old',date:'1937-01-01',parentIds:['organizer:media','stand','session']});
 add('new',{quote:'New',date:'1937-01-02'});
 add('undated',{quote:'Undated',createdAt:'2099-01-01T00:00:00Z'});
 assert.equal(latestNewspaper(db).id,'new');
 putArticle(db,{id:'new',quote:'Updated <headline>'});
 assert.match(latestNewspaperTickerHtml(db),/Updated &lt;headline&gt;/);
});
test('player stock and current edition exclude hidden articles and hidden stand',()=>{
 const {db,add}=fixture();add('public',{quote:'Public',date:'1937-01-01'});add('secret',{quote:'Secret',date:'1937-01-02',visibility:'always-gm'});
 assert.equal(latestNewspaper(db,true).id,'public');
 assert.doesNotMatch(newsstandShelvesHtml(db,db.articles.stand,true),/Secret/);
 db.articles.stand.visibility='always-gm';assert.equal(latestNewspaper(db,true),null);
});
test('shelves contain five descending dated items, and back numbers exclude today',()=>{
 const {db,add}=fixture();
 for(const title of ['Magazines','Comics','Books','Postcards'])add(title,{title,organizer:true,parentIds:['organizer:media']});
 for(let i=1;i<=8;i++){
  add('paper'+i,{date:`1937-01-0${i}`,quote:'Headline '+i});
  for(const type of ['Magazines','Comics','Books','Postcards'])add(type+i,{parentIds:[type,'stand'],date:`1937-01-0${i}`});
 }
 add('misc',{date:'1937-01-01'});
 const {today,groups}=newsstandShelves(db);
 assert.equal(today.id,'paper8');assert.deepEqual(groups[0].items.map(a=>a.id),['paper7','paper6','paper5','paper4','paper3']);
 assert.deepEqual(groups.map(g=>g.title),['Back Numbers','Magazines & Periodicals','Comic Books','Books for Your Leisure','Picture Post Cards','Sundries']);
 for(const group of groups.slice(1,5)){assert.equal(group.items.length,5);assert.equal(group.items[0].date,'1937-01-08');}
 assert.match(todaysPaperHtml(db,db.articles.stand),/Today's Paper/);
 assert.equal(todaysPaperHtml(db,db.articles.misc),'');
});
test('newsstand survives a normal rename through preserved aliases and ambiguous matches are rejected',()=>{
 const {db,add}=fixture();putArticle(db,{id:'stand',title:'New name'});assert.equal(findNewsstand(db).id,'stand');
 add('other',{title:"Ken's Newsstand",parentIds:['root:places']});assert.equal(findNewsstand(db),null);
});
test('homepage and newsstand integration keep custom shelves before normal relationships',()=>{
 const source=readFileSync(new URL('../scripts/campaign-wiki.js',import.meta.url),'utf8');
 assert.ok(source.includes('${todaysPaperHtml(data,article,asPlayer)}</div>'));
 assert.ok(source.includes('relationships=newsstandShelvesHtml(data,article,asPlayer)+relationshipSections('));
 assert.ok(source.includes('if(shelved.has(item.article.id))continue;'));
 assert.ok(!source.includes('name="newspaper"'));
});

test('newsstand category children supply all five shelves without individual place links',()=>{
 const {db,add}=fixture();
 for(const title of ['Newspapers','Magazines','Comics','Books','Postcards']){
  add(title,{parentIds:['organizer:media','stand'],quote:'Category description',date:'2099-01-01'});
  add(title+' item',{parentIds:[title],date:'1937-01-02'});
 }
 add('current',{parentIds:['Newspapers'],quote:'Current headline',date:'1937-01-03'});
 add('previous',{parentIds:['Newspapers'],quote:'Previous headline',date:'1937-01-01'});
 const stock=newsstandStock(db);
 assert.equal(stock.length,7);
 assert.ok(stock.every(a=>!a.parentIds.includes('stand')));
 assert.equal(latestNewspaper(db).id,'current');
 const {groups}=newsstandShelves(db);
 assert.deepEqual(groups.map(g=>g.title),['Back Numbers','Newspapers','Magazines & Periodicals','Comic Books','Books for Your Leisure','Picture Post Cards']);
 assert.equal(groups[0].items[0].id,'previous');
 assert.equal(groups[1].items[0].id,'Newspapers item');
});

test('nested category stock is deduplicated and unrelated Media branches stay out',()=>{
 const {db,add}=fixture();
 add('Magazines',{parentIds:['organizer:media','stand'],organizer:true});
 add('series',{parentIds:['Magazines'],organizer:true});
 add('issue',{parentIds:['series','Magazines','stand']});
 add('Posters',{parentIds:['organizer:media','stand'],organizer:true});
 add('poster',{parentIds:['Posters']});
 add('Books',{parentIds:['organizer:media'],organizer:true});
 add('unstocked book',{parentIds:['Books']});
 assert.deepEqual(newsstandStock(db).map(a=>a.id),['issue']);
 putArticle(db,{id:'issue',parentIds:['series']});
 assert.deepEqual(newsstandStock(db).map(a=>a.id),['issue']);
 putArticle(db,{id:'Magazines',parentIds:['organizer:media']});
 assert.deepEqual(newsstandStock(db),[]);
});

test('hidden shelf categories do not supply player stock',()=>{
 const {db,add}=fixture();
 add('Newspapers',{parentIds:['organizer:media','stand'],visibility:'always-gm',organizer:true});
 add('edition',{parentIds:['Newspapers'],quote:'Secret shelf',visibility:'always-public'});
 assert.equal(latestNewspaper(db).id,'edition');
 assert.equal(latestNewspaper(db,true),null);
});
