import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as core from '../scripts/unified-core.js';
import * as telegrams from '../scripts/telegrams.js';
import * as newspapers from '../scripts/latest-newspaper.js';
const {isTelegram,isActiveTelegram,telegramRecipient,telegramView,telegramWarning,telegramOldestFirst,telegramNoticeHtml,waitingTelegram,markTelegramOpened}=telegrams;
function fixture(){
 const data=core.emptyUnifiedDatabase('test');
 const add=(id,fields={})=>core.putArticle(data,{id,title:id,parentIds:['root:people'],visibility:'always-public',...fields});
 add('media',{title:'Media',organizer:true,parentIds:['root:images']});
 add('telegrams',{title:'Telegrams',organizer:true,parentIds:['media']});
 add('raven',{source:{documentType:'Actor',id:'actor-raven'}});
 add('doc',{source:{documentType:'Actor',id:'actor-doc'}});
 add('brannigan',{source:{documentType:'Actor',id:'actor-brannigan'}});
 const paul={id:'paul',name:'Paul',character:{id:'actor-raven'}},murray={id:'murray',name:'Murray',character:{id:'actor-doc'}},table={id:'table',name:'Gametable',character:{id:'actor-raven'}},gm={id:'gm',name:'GM',isGM:true};
 const users=[paul,murray,table,gm];
 const telegram=(id,props={})=>add(id,{parentIds:['telegrams','raven','brannigan'],aliases:['Kelly Walter'],text:'raven says hello',date:'1937-01-01',...props});
 return {data,add,telegram,users,paul,murray,table,gm};
}
test('Media subtype and exact PC assignment exclude NPC ownership and table account',()=>{
 const f=fixture(),a=f.telegram('letter');
 assert.ok(isTelegram(f.data,a));assert.equal(isTelegram(f.data,f.data.articles.telegrams),false);
 assert.equal(telegramRecipient(f.data,a,f.users).recipient.users[0],f.paul);
 assert.match(telegramNoticeHtml(f.data,f.paul,f.users),/TELEGRAM FOR KELLY WALTER!/);
 for(const user of [f.murray,f.table,f.gm])assert.equal(telegramNoticeHtml(f.data,user,f.users),'');
});
test('zero, multiple PCs, and shared account assignments fail closed with warnings',()=>{
 const f=fixture(),none=f.telegram('none',{parentIds:['telegrams','brannigan']}),both=f.telegram('both',{parentIds:['telegrams','raven','doc']});
 assert.match(telegramWarning(f.data,none,f.users),/no parent Actor/);
 assert.match(telegramWarning(f.data,both,f.users),/ambiguous/);
 assert.equal(waitingTelegram(f.data,f.paul,f.users),null);
 const one=f.telegram('one');f.users.push({id:'duplicate',name:'Other',character:{id:'actor-raven'}});
 assert.equal(telegramRecipient(f.data,one,f.users).recipient,null);
});
test('unauthorized projected graph omits private articles, links, search, counts and date influence',()=>{
 const f=fixture();f.telegram('secret',{date:'2099-01-01'});
 f.add('child',{parentIds:['raven','secret'],parentPathHints:{secret:['root:images','media','telegrams','secret']}});
 for(const user of [f.murray,f.table,null]){
  const view=telegramView(f.data,user,f.users);
  assert.equal(view.articles.secret,undefined);
  assert.equal(core.isPublic(view,view.articles.secret),false);
  assert.equal(core.searchArticles(view,'secret',{player:true}).length,0);
  assert.equal(core.childrenOf(view,'raven').some(a=>a.id==='secret'),false);
  assert.equal(core.derivedDateRange(view,'raven'),null);
  assert.equal(JSON.stringify(view.articles).includes('secret'),false);
 }
 assert.equal(core.isPublic(f.data,f.data.articles.secret),false);
 assert.equal(core.isPublic(telegramView(f.data,f.paul,f.users),f.data.articles.secret),true);
 assert.equal(telegramView(f.data,f.gm,f.users),f.data);
});
test('opening is recipient-only and delivers successive telegrams oldest to newest',()=>{
 const f=fixture();f.telegram('third',{date:'1937-03-01'});f.telegram('first');f.telegram('second',{date:'1937-02-01'});
 for(const user of [f.gm,f.murray,f.table])assert.equal(markTelegramOpened(f.data,'first',user,f.users),false);
 for(const id of ['first','second','third']){
  assert.equal(waitingTelegram(f.data,f.paul,f.users).id,id);
  assert.ok(markTelegramOpened(f.data,id,f.paul,f.users));
  assert.equal(f.data.articles[id].currentStatus,'inactive');
  assert.equal(markTelegramOpened(f.data,id,f.paul,f.users),false);
  assert.ok(core.isPublic(telegramView(f.data,f.table,f.users),f.data.articles[id]));
 }
 assert.equal(telegramNoticeHtml(f.data,f.paul,f.users),'');
});
test('date fallback and ties are deterministic and assignment changes apply immediately',()=>{
 const f=fixture();f.telegram('b',{date:'',createdAt:'1937-01-01'});f.telegram('a',{date:'',createdAt:'1937-01-01'});
 assert.equal(waitingTelegram(f.data,f.paul,f.users).id,'a');
 f.paul.character=null;assert.equal(waitingTelegram(f.data,f.paul,f.users),null);
 f.murray.character={id:'actor-raven'};assert.equal(waitingTelegram(f.data,f.murray,f.users).id,'a');
});
test('automatic linking excludes Telegrams both ways, even after reading',()=>{
 const f=fixture(),a=f.telegram('letter',{currentStatus:'inactive'});f.data.articles.raven.text='letter';
 assert.deepEqual(core.linkArticleText(f.data,a,['raven']).linkedIds,[]);
 assert.deepEqual(core.linkArticleText(f.data,f.data.articles.raven,['letter']).linkedIds,[]);
});
function renderer(f,user){
 const source=fs.readFileSync(new URL('../scripts/campaign-wiki.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'');
 const ctx={...core,...telegrams,...newspapers,console,structuredClone,Application:class{},FormApplication:class{},Hooks:{once(){},on(){}},
 game:{user,users:f.users,world:{id:'test'},settings:{get:(_module,key)=>key==='databaseV3'?f.data:key==='automaticArticleLinking'?true:undefined}},
 foundry:{utils:{deepClone:structuredClone}},fromUuidSync:()=>null,
 mapThumbnailHtml:()=>'',districtLocationMapHtml:()=>'',isDeltaCityArticle:()=>false,
 requestTelegramOpen:async id=>{markTelegramOpened(f.data,id,user,f.users);},$:html=>html,
 ui:{notifications:{warn(){}}}};
 vm.createContext(ctx);
 vm.runInContext(source+'\nglobalThis.renderers={database,homeHtml,articleHtml,relationshipSections,navigation,CampaignWikiApp};',ctx);
 return ctx.renderers;
}
test('real parent rendering hides active telegrams for every viewer and shows newest five read cards',()=>{
 const f=fixture();f.telegram('waiting-secret');
 for(let i=1;i<=6;i++)f.telegram('read-'+i,{currentStatus:'inactive',date:'1937-01-0'+i});
 for(const user of f.users){
  const r=renderer(f,user),view=r.database();
  for(const parent of ['raven','brannigan']){
   const html=r.relationshipSections(view,view.articles[parent],new Set(),!user.isGM);
   assert.doesNotMatch(html,/waiting-secret/);assert.match(html,/>Telegrams</);
   assert.match(html,/… and 1 more/);assert.doesNotMatch(html,/data-id="read-1"/);
   assert.ok(html.indexOf('data-id="read-6"')<html.indexOf('data-id="read-2"'));
   assert.match(r.relationshipSections(view,view.articles[parent],new Set([parent+':Telegrams']),!user.isGM),/data-id="read-1"/);
  }
 }
});
test('actual Home, navigation, and direct article rendering reject other players and preview',async()=>{
 const f=fixture();f.telegram('private-letter');
 for(const user of [f.murray,f.table]){
  const r=renderer(f,user),view=r.database();
  assert.doesNotMatch(r.homeHtml(view,true),/private-letter|KELLY WALTER/);
  assert.doesNotMatch(r.navigation(view,new Set(),true),/private-letter/);
  assert.match(r.articleHtml(view,f.data.articles['private-letter'],null,new Set(),true),/Article unavailable/);
  const app=new r.CampaignWikiApp();app.currentId='private-letter';assert.match(await app._renderInner(),/Article unavailable/);
 }
 const r=renderer(f,f.gm),app=new r.CampaignWikiApp();app.currentId='private-letter';app.playerPreview=true;
 assert.match(await app._renderInner(),/Article unavailable/);assert.ok(isActiveTelegram(f.data,f.data.articles['private-letter']));
 const player=renderer(f,f.paul),opening=new player.CampaignWikiApp();opening.currentId='private-letter';
 assert.match(await opening._renderInner(),/private-letter/);assert.equal(f.data.articles['private-letter'].currentStatus,'inactive');
});
test('notification escapes aliases and reduced motion has static styling',()=>{
 const f=fixture();f.telegram('safe',{aliases:['<img onerror=bad>']});
 assert.doesNotMatch(telegramNoticeHtml(f.data,f.paul,f.users),/<img/i);
 const css=fs.readFileSync(new URL('../styles/campaign-wiki.css',import.meta.url),'utf8');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.cw-telegram-notice\{animation:none\}\}/);
});
test('opening displays an otherwise GM-only Telegram before applying ordinary archive permissions',async()=>{
 const f=fixture();f.telegram('private-letter',{visibility:'always-gm'});
 const r=renderer(f,f.paul),opening=new r.CampaignWikiApp();opening.currentId='private-letter';
 assert.match(await opening._renderInner(),/<h1>private-letter<\/h1>/);
 assert.equal(f.data.articles['private-letter'].currentStatus,'inactive');
 assert.equal(core.isPublic(f.data,f.data.articles['private-letter']),false);
});
function deliveryHarness(f){
 let stored=structuredClone(f.data),writes=0,requests=0;
 const clients=[];
 const build=user=>{
  const handlers=[];
  const localUsers=f.users.map(u=>({...u,active:true,setFlag:async(scope,key,value)=>{
   if(key==='telegramOpenRequest')requests++;
   queueMicrotask(()=>{for(const client of clients){
    const updated=client.ctx.game.users.get(u.id);
    for(const handle of client.handlers)handle(updated,{flags:{[scope]:{[key]:value}}},{},user.id);
   }});
  }}));
  localUsers.get=id=>localUsers.find(u=>u.id===id);
  const ctx={...telegrams,console,Promise,Map,setTimeout,clearTimeout,
   foundry:{utils:{randomID:()=>Math.random().toString(36)}},
   game:{user:localUsers.get(user.id),users:localUsers},
   Hooks:{on:(_name,handle)=>handlers.push(handle)}};
  vm.createContext(ctx);
  const source=fs.readFileSync(new URL('../scripts/telegram-delivery.js',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'').replaceAll('export function','function');
  vm.runInContext(source+'\nglobalThis.api={installTelegramDelivery,requestTelegramOpen};',ctx);
  ctx.api.installTelegramDelivery({getDatabase:()=>structuredClone(stored),persist:async data=>{stored=structuredClone(data);writes++;},refresh(){}});
  const client={ctx,handlers};clients.push(client);return client;
 };
 return {build,get stored(){return stored;},get writes(){return writes;},get requests(){return requests;}};
}
test('authenticated GM delivery persists once even when player render requests overlap',async()=>{
 const f=fixture();f.telegram('letter');const h=deliveryHarness(f),gm=h.build(f.gm),paul=h.build(f.paul);
 const a=paul.ctx.api.requestTelegramOpen('letter'),b=paul.ctx.api.requestTelegramOpen('letter');
 assert.equal(a,b);await Promise.all([a,b]);assert.equal(h.writes,1);assert.equal(h.requests,1);
 assert.equal(h.stored.articles.letter.currentStatus,'inactive');
});
test('GM write handler rejects spoofed and unauthorized open requests',async()=>{
 const f=fixture();f.telegram('letter');const h=deliveryHarness(f),gm=h.build(f.gm),murray=h.build(f.murray);
 const request={flags:{'campaign-wiki':{telegramOpenRequest:{articleId:'letter',nonce:'fake'}}}};
 gm.handlers[0](gm.ctx.game.users.get(f.paul.id),request,{},f.murray.id);
 gm.handlers[0](gm.ctx.game.users.get(f.murray.id),request,{},f.murray.id);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(h.writes,0);
 await assert.rejects(murray.ctx.api.requestTelegramOpen('letter'),/unavailable/);
 assert.equal(h.stored.articles.letter.currentStatus,'active');
});
test('offline GM leaves Telegram active and returns an actionable error',async()=>{
 const f=fixture();f.telegram('letter');const h=deliveryHarness(f),paul=h.build(f.paul);
 paul.ctx.game.users.get(f.gm.id).active=false;
 await assert.rejects(paul.ctx.api.requestTelegramOpen('letter'),/Game Master must be connected/);
 assert.equal(h.stored.articles.letter.currentStatus,'active');
});
test('inactive telegrams do not show delivery warnings or require a current assignment',()=>{
 const f=fixture(),a=f.telegram('archived',{currentStatus:'inactive',parentIds:['telegrams']});
 assert.equal(telegramWarning(f.data,a,f.users),'');
 a.currentStatus='active';assert.match(telegramWarning(f.data,a,f.users),/assigned character/);
});
test('editor warnings refresh from unsaved parent and status selections',()=>{
 const f=fixture(),article=f.telegram('draft',{parentIds:['telegrams']});
 const listeners={},statusListeners={},warning={textContent:'',hidden:true};
 let parents=['telegrams'];
 const status={value:'active',addEventListener:(name,fn)=>statusListeners[name]=fn};
 const element={
  querySelector:selector=>selector==='[data-telegram-warning]'?warning:status,
  querySelectorAll:()=>parents.map(value=>({value})),
  addEventListener:(name,fn)=>listeners[name]=fn
 };
 telegrams.setupTelegramEditor(element,f.data,article,()=>f.users);
 assert.equal(warning.hidden,false);assert.match(warning.textContent,/no parent Actor/);
 parents=['telegrams','raven'];listeners['cw-parents-changed']();
 assert.equal(warning.hidden,true);assert.equal(warning.textContent,'');
 parents.push('doc');listeners['cw-parents-changed']();
 assert.equal(warning.hidden,false);assert.match(warning.textContent,/ambiguous/);
 status.value='inactive';statusListeners.change();assert.equal(warning.hidden,true);
 status.value='active';statusListeners.change();assert.equal(warning.hidden,false);
 assert.deepEqual(article.parentIds,['telegrams']);
});
