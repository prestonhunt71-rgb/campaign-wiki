import test from "node:test";
import assert from "node:assert/strict";
import {VISIBILITY,articlePaths,derivedDateRange,emptyUnifiedDatabase,isPublic,linkArticleText,migrateV2,needsActioning,preferredPathTo,putArticle,relationshipDiagnostics,validateUnified} from "../scripts/unified-core.js";

test("one Article can appear beneath multiple parents without duplication",()=>{
  const db=emptyUnifiedDatabase("test");
  const dragon=putArticle(db,{id:"dragon",title:"Green Dragon",parentIds:["root:people"]});
  const chinatown=putArticle(db,{id:"chinatown",title:"Chinatown",parentIds:["root:places"]});
  const palace=putArticle(db,{id:"palace",title:"The Emerald Palace",parentIds:[dragon.id,chinatown.id]});
  assert.deepEqual(articlePaths(db,palace),[["root:people","dragon","palace"],["root:places","chinatown","palace"]]);
  assert.deepEqual(validateUnified(db),[]);
});

test("relationship diagnostics separate one-step links from inherited graph paths",()=>{
  const db=emptyUnifiedDatabase("test"),arc=putArticle(db,{id:"arc",title:"Arc",parentIds:["root:arcs"]}),session=putArticle(db,{id:"session",title:"Session",parentIds:[arc.id]}),hero=putArticle(db,{id:"hero",title:"Hero",parentIds:[session.id]}),dnpc=putArticle(db,{id:"dnpc",title:"DNPC",parentIds:[hero.id]});
  const report=relationshipDiagnostics(db,session.id);
  assert.deepEqual(report.displayed.map(row=>[row.id,row.direction,row.storedOn]).sort(),[["arc","parent","session"],["hero","child","hero"]]);
  assert.ok(report.suppressed.some(row=>row.id==="dnpc"&&row.direction==="descendant"&&row.distance===2&&row.path.join(">")==="session>hero>dnpc"));
});

test("relationship diagnostics can display Metaplot descendants through their Arcs",()=>{
  const db=emptyUnifiedDatabase("test"),metaplot=putArticle(db,{id:"meta",title:"Metaplot",parentIds:["root:metaplots"]}),arc=putArticle(db,{id:"arc",title:"Arc",parentIds:[metaplot.id]}),person=putArticle(db,{id:"person",title:"Person",parentIds:[arc.id]}),dnpc=putArticle(db,{id:"dnpc",title:"DNPC",parentIds:[person.id]});
  const report=relationshipDiagnostics(db,metaplot.id,{descendantDisplayDepth:2});
  assert.ok(report.displayed.some(row=>row.id===arc.id&&row.distance===1));
  assert.ok(report.displayed.some(row=>row.id===person.id&&row.distance===2&&row.inherited));
  assert.ok(report.suppressed.some(row=>row.id===dnpc.id&&row.distance===3));
});

test("Article text links only the first title or alter-ego mention per related Article",()=>{
  const db=emptyUnifiedDatabase("test"),source=putArticle(db,{id:"source",title:"Session",parentIds:["root:arcs"],text:"The Raven met Richard. Raven departed."}),raven=putArticle(db,{id:"raven",title:"Richard",aliases:["The Raven","Raven"],parentIds:[source.id],visibility:VISIBILITY.PUBLIC});
  const linked=linkArticleText(db,source,[raven.id]);
  assert.equal(linked.linkedIds.length,1);assert.equal((linked.html.match(/data-id="raven"/g)??[]).length,1);assert.match(linked.html,/met Richard\. Raven departed\./);
});

test("player Article text never links a hidden related Article",()=>{
  const db=emptyUnifiedDatabase("test"),source=putArticle(db,{id:"source",title:"Session",parentIds:["root:arcs"],text:"The Raven arrived.",visibility:VISIBILITY.PUBLIC}),hidden=putArticle(db,{id:"hidden",title:"Richard",aliases:["The Raven"],parentIds:[source.id],visibility:VISIBILITY.GM});
  const linked=linkArticleText(db,source,[hidden.id],{player:true});
  assert.doesNotMatch(linked.html,/cw-inline-link|data-id=/);assert.match(linked.html,/The Raven arrived/);
});

test("parent picker path reconstruction prefers an Article's native sidebar tree",()=>{
  const db=emptyUnifiedDatabase("test"),npcs=putArticle(db,{id:"npcs",title:"NPCs",parentIds:["root:people"],organizer:true}),arc=putArticle(db,{id:"arc",title:"Arc",parentIds:["root:arcs"]}),person=putArticle(db,{id:"person",title:"Rosie",parentIds:[npcs.id,arc.id],source:{documentType:"Actor",id:"actor",uuid:"Actor.actor"}});
  assert.deepEqual(preferredPathTo(db,person.id,"root:people"),["root:people","npcs","person"]);
  assert.deepEqual(preferredPathTo(db,person.id,"root:arcs"),["root:arcs","arc","person"]);
});

test("normalization preserves valid editor path hints for multi-parent relationships",()=>{
  const db=emptyUnifiedDatabase("test");putArticle(db,{id:"rosie",title:"Rosie",parentIds:["root:people"]});
  const article=putArticle(db,{id:"room",title:"Room",parentIds:["rosie"],parentPathHints:{rosie:["root:people","npcs","rosie"],stale:["root:arcs","stale"]}});
  assert.deepEqual(article.parentPathHints,{rosie:["root:people","npcs","rosie"]});
});

test("an optional Article quote is normalized and preserved",()=>{
  const db=emptyUnifiedDatabase("test");
  const article=putArticle(db,{id:"quoted",title:"Quoted",parentIds:["root:people"],quote:"  Words worth remembering.  "});
  assert.equal(article.quote,"Words worth remembering.");
  assert.equal(putArticle(db,{...article,text:"Updated"}).quote,"Words worth remembering.");
});

test("cycles and parentless Articles are rejected",()=>{
  const db=emptyUnifiedDatabase();
  putArticle(db,{id:"a",title:"A",parentIds:["root:places"]});
  putArticle(db,{id:"b",title:"B",parentIds:["a"]});
  assert.throws(()=>putArticle(db,{id:"a",title:"A",parentIds:["b"]}),/ancestor/);
  assert.throws(()=>putArticle(db,{title:"Lost",parentIds:[]}),/at least one parent/);
});

test("placeholder and missing source records enter Needs Actioning",()=>{
  const db=emptyUnifiedDatabase();
  putArticle(db,{id:"stub",title:"Stub",parentIds:["root:people"],placeholder:true,source:{documentType:"Actor",id:"x",uuid:"Actor.x",missing:true}});
  assert.deepEqual(needsActioning(db).map(item=>item.kind),["Incomplete Article","Missing Foundry Source"]);
});

test("an unresolved artwork move enters Needs Actioning",()=>{
  const db=emptyUnifiedDatabase();
  putArticle(db,{id:"image",title:"Lost Image",parentIds:["root:images"],image:"old/image.webp",artworkIssue:{path:"old/image.webp",expectedPath:"new/image.webp",reason:"Not found"}});
  assert.deepEqual(needsActioning(db).map(item=>item.kind),["Missing Artwork"]);
});

test("dates derive through descendants",()=>{
  const db=emptyUnifiedDatabase();
  putArticle(db,{id:"arc",title:"Arc",parentIds:["root:arcs"]});
  putArticle(db,{id:"one",title:"One",parentIds:["arc"],date:"1937-01-02"});
  putArticle(db,{id:"two",title:"Two",parentIds:["arc"],date:"1937-03-04"});
  assert.deepEqual(derivedDateRange(db,"arc"),{start:"1937-01-02",end:"1937-03-04"});
});

test("visibility inherits top down but never propagates upward",()=>{
  const db=emptyUnifiedDatabase();
  const parent=putArticle(db,{id:"parent",title:"Parent",parentIds:["root:places"],visibility:VISIBILITY.PUBLIC});
  const child=putArticle(db,{id:"child",title:"Child",parentIds:[parent.id]});
  const grandchild=putArticle(db,{id:"grandchild",title:"Grandchild",parentIds:[child.id],visibility:VISIBILITY.GM});
  assert.equal(isPublic(db,child),true);
  assert.equal(isPublic(db,grandchild),false);
  assert.equal(isPublic(db,parent),true);
  child.visibility=VISIBILITY.GM;
  assert.equal(isPublic(db,parent),true);
});

test("nearest explicit visibility wins and GM wins equal-depth conflicts",()=>{
  const db=emptyUnifiedDatabase();
  putArticle(db,{id:"public-parent",title:"Public Parent",parentIds:["root:people"],visibility:VISIBILITY.PUBLIC});
  putArticle(db,{id:"gm-parent",title:"GM Parent",parentIds:["root:places"],visibility:VISIBILITY.GM});
  const child=putArticle(db,{id:"child",title:"Child",parentIds:["public-parent","gm-parent"]});
  assert.equal(isPublic(db,child),false);
  child.visibility=VISIBILITY.PUBLIC;
  assert.equal(isPublic(db,child),true);
});

test("v2 migration preserves content and exact multi-parent links",()=>{
  const v2={schemaVersion:2,worldId:"old",entities:{area:{id:"area",type:"area",name:"Chinatown",description:"Place text"},affiliation:{id:"aff",type:"affiliation",name:"Green Dragon"},actor:{id:"actor",type:"actor",name:"Li",classification:"npc",description:"Person text",affiliationIds:["aff"]},scene:{id:"scene",type:"scene",name:"Emerald Palace",description:"Scene text",areaId:"area",affiliationIds:["aff"]}}};
  const {database}=migrateV2(v2);
  assert.equal(database.articles.scene.text,"Scene text");
  assert.deepEqual(new Set(database.articles.scene.parentIds),new Set(["area","aff"]));
  assert.equal(database.articles.actor.text,"Person text");
  assert.ok(database.articles["organizer:session-art"]);
  assert.deepEqual(validateUnified(database),[]);
});
