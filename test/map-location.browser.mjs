import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.CW_PLAYWRIGHT_MODULE?pathToFileURL(process.env.CW_PLAYWRIGHT_MODULE).href:'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<html><head><link rel="stylesheet" href="/styles/campaign-wiki.css"></head><body><div id="fixture"></div></body></html>');return;}
  const relative=decodeURIComponent(url.pathname).replace(/^\/modules\/campaign-wiki\//,'').replace(/^\//,'');
  const target=path.resolve(root,relative);if(!target.startsWith(root+path.sep))throw Error('Outside root');
  let content=await fs.readFile(target);
  if(relative==='scripts/campaign-wiki.js')content=Buffer.concat([content,Buffer.from('\nexport {articleHtml,articleForm,setupParentPicker};')]);
  res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':target.endsWith('.png')?'image/png':'text/plain');res.end(content);
 }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({channel:process.env.CW_BROWSER_CHANNEL||'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1100,height:1000},hasTouch:true});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.evaluate(async()=>{
  window.core=await import('/scripts/unified-core.js');window.maps=await import('/scripts/district-location-map.js');window.editor=await import('/scripts/map-location-editor.js');
  const ids=await import('/data/delta-city-article-ids.js');
  window.db=core.emptyUnifiedDatabase('browser');
  window.city=core.putArticle(db,{id:ids.deltaCityArticleId,title:'Delta City',parentIds:['root:places'],visibility:'always-public'});
  window.parent=core.putArticle(db,{id:ids.districtArticleIds['district-01-downtown'],title:'Downtown',parentIds:[city.id]});
  window.other=core.putArticle(db,{id:ids.districtArticleIds['district-03-racine'],title:'Racine',parentIds:[city.id]});
  window.child=core.putArticle(db,{id:'museum',title:'Museum',text:'Keep this prose exactly.',parentIds:[parent.id],mapLocation:{x:520,y:800,parentId:parent.id}});
  window.secret=core.putArticle(db,{id:'secret',title:'Secret Base',parentIds:[parent.id],visibility:'always-gm',mapLocation:{x:525,y:810,parentId:parent.id}});
  window.Application=class {};window.FormApplication=class {};window.Hooks={once(){},on(){}};
  window.foundry={utils:{deepClone:value=>structuredClone(value)}};window.game={user:{isGM:true},world:{id:'browser'},settings:{get(_m,key){return key==='databaseV3'?db:undefined;}}};
  window.integration=await import('/scripts/campaign-wiki.js');
  window.renderMap=()=>{
   fixture.innerHTML=`<div class="campaign-wiki"><div style="width:300px">${maps.districtLocationMapHtml(parent,core.visibleArticles(db,true))}</div></div>`;
   window.opened=null;maps.activateDistrictPins(fixture,id=>window.opened=id);
  };
  window.renderPicker=()=>{
   fixture.innerHTML=`<form class="cw-coordinate-picker" style="width:min(650px,95%)">${maps.districtMapSvg(parent,{picker:true})}<input name="selectedLocation"><p data-point-status></p></form>`;
   editor.activateLocationPicker(fixture,parent,child.mapLocation);
  };
 });
 for(const width of [1100,768,390])for(const zoom of [1,1.25,1.75]){
  await page.setViewportSize({width,height:1100});
  await page.evaluate(zoom=>{document.body.style.zoom=zoom;renderPicker();},zoom);
  const point=await page.evaluate(()=>{
   const svg=document.querySelector('[data-location-picker]'),p=svg.createSVGPoint();p.x=530;p.y=810;
   const q=p.matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y};
  });
  await page.mouse.click(point.x,point.y);
  const actual=await page.locator('[name=selectedLocation]').inputValue();
  const selected=JSON.parse(actual);assert.ok(Math.abs(selected.x-530)<1.5&&Math.abs(selected.y-810)<1.5,`coordinate conversion ${width}/${zoom}: ${JSON.stringify(selected)} at ${JSON.stringify(point)}`);
 }
 await page.evaluate(()=>{document.body.style.zoom=1;renderMap();});
 assert.equal(await page.locator('.cw-map-pin').count(),1);
 await page.locator('.cw-map-pin').focus();assert.equal(await page.locator('.cw-map-pin-label').innerText(),'Museum');
 await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.opened),'museum');
 await page.evaluate(()=>{window.opened=null;});await page.locator('.cw-map-pin').click();assert.equal(await page.evaluate(()=>window.opened),'museum');
 await page.evaluate(()=>{window.opened=null;});await page.locator('.cw-map-pin').tap();assert.equal(await page.evaluate(()=>window.opened),'museum');
 // Exercise the actual article renderer: text, relationship tiles, privacy and city pin exclusion.
 const rendered=await page.evaluate(()=>{
  const before=JSON.stringify(db);
  const childHtml=integration.articleHtml(db,child,null,new Set(),false);
  const districtHtml=integration.articleHtml(db,parent,null,new Set(),true);
  const cityHtml=integration.articleHtml(db,city,null,new Set(),false);
  return {childHtml,districtHtml,cityHtml,unchanged:before===JSON.stringify(db)};
 });
 assert.ok(rendered.unchanged);assert.match(rendered.childHtml,/Keep this prose exactly\./);assert.match(rendered.childHtml,/cw-map-thumbnail/);
 assert.doesNotMatch(rendered.districtHtml,/Secret Base/);assert.doesNotMatch(rendered.cityHtml,/cw-map-pin/);
 // Editor draft isolation, explicit confirmation, clear and parent-change notification.
 await page.evaluate(()=>{
  document.body.style.zoom=1;
  fixture.innerHTML=`<form><input name="parentIds" value="${parent.id}">${editor.mapLocationFields()}</form><div id="picker-dialog"></div>`;
  window.notices=[];window.pendingResolve=null;
  window.dialogStub=async(_title,content,options)=>new Promise(resolve=>{const host=document.getElementById('picker-dialog');host.innerHTML=content;options.onRender([host]);window.pendingResolve=resolve;});
  editor.setupMapLocationEditor(fixture,db,child,{isPlace:()=>true,dialogForm:dialogStub,notify:message=>notices.push(message)});
 });
 const initial=await page.locator('[name=mapLocation]').inputValue();
 await page.locator('[data-set-location]').click();
 await page.locator('[data-location-picker]').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('[name=mapLocation]').inputValue(),initial);
 await page.evaluate(()=>pendingResolve(null));
 assert.equal(await page.locator('[name=mapLocation]').inputValue(),initial);
 await page.locator('[data-set-location]').click();await page.locator('[data-location-picker]').focus();await page.keyboard.press('ArrowRight');
 await page.evaluate(()=>{const form=new FormData();form.set('selectedLocation',document.querySelector('[name=selectedLocation]').value);pendingResolve(form);});
 assert.equal(JSON.parse(await page.locator('[name=mapLocation]').inputValue()).x,521);
 assert.equal(await page.evaluate(()=>db.articles.museum.mapLocation.x),520);
 await page.locator('[data-clear-location]').click();assert.equal(await page.locator('[name=mapLocation]').inputValue(),'');
 await page.evaluate(()=>{fixture.innerHTML=`<form><input name="parentIds" value="${parent.id}">${editor.mapLocationFields()}</form>`;editor.setupMapLocationEditor(fixture,db,child,{isPlace:()=>true,dialogForm:dialogStub,notify:message=>notices.push(message)});fixture.querySelector('[name=parentIds]').value=other.id;fixture.dispatchEvent(new Event('cw-parents-changed'));});
 assert.equal(await page.locator('[name=mapLocation]').inputValue(),'');assert.ok((await page.evaluate(()=>notices)).some(message=>message.includes('parent district changed')));
 // Newly created Scene: actual parent selectors reveal the picker without saving first.
 await page.evaluate(()=>{
  const scene=core.normalizeArticle({id:'new-scene',title:'New Scene',parentIds:['root:places'],source:{documentType:'Scene'}});
  fixture.innerHTML='<form>'+integration.articleForm(db,scene)+'</form>';
  const html={0:fixture,find:selector=>[...fixture.querySelectorAll(selector)]};
  integration.setupParentPicker(html,db,scene);
  editor.setupMapLocationEditor(fixture,db,scene,{isPlace:()=>true,dialogForm:dialogStub,notify:message=>notices.push(message)});
 });
 assert.equal(await page.locator('[data-location-editor]').isVisible(),false);
 await page.locator('[data-parent-picker] select').nth(1).selectOption(await page.evaluate(()=>city.id));
 await page.locator('[data-parent-picker] select').nth(2).selectOption(await page.evaluate(()=>parent.id));
 assert.equal(await page.locator('[data-location-editor]').isVisible(),true);
 assert.equal(await page.locator('[data-location-parent]').inputValue(),await page.evaluate(()=>parent.id));
 assert.deepEqual(errors,[]);
 await page.setViewportSize({width:1000,height:1000});
 await page.evaluate(()=>{document.body.style.zoom=1;fixture.innerHTML=`<div class="campaign-wiki" style="padding:20px;width:900px">${integration.articleHtml(db,parent,null,new Set(),true)}</div>`;maps.activateDistrictPins(fixture,()=>{});});
 if(process.env.CW_SCREENSHOT)await page.screenshot({path:process.env.CW_SCREENSHOT,fullPage:true});
 console.log('Browser checks passed: nine viewport/zoom combinations, pins, keyboard, editor confirmation/cancel/clear, parent changes, privacy, actual article rendering and thumbnails.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
