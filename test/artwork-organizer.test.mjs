import test from "node:test";
import assert from "node:assert/strict";
import {emptyUnifiedDatabase,putArticle} from "../scripts/unified-core.js";
import {artworkDestinations,artworkFolders,buildArtworkPlan,pathWithinRoot,safeFolderName} from "../scripts/artwork-organizer.js";

test("Image sidebar ancestry becomes an artwork destination folder",()=>{
  const db=emptyUnifiedDatabase();
  putArticle(db,{id:"media",title:"Media",parentIds:["root:images"],organizer:true});
  putArticle(db,{id:"papers",title:"Newspapers",parentIds:["media"]});
  putArticle(db,{id:"scoop",title:"Gazette Scoop",parentIds:["papers"],image:"https://assets.example/u/worlds/golden-age-agents/campaign-wiki/Handouts/scoop.webp"});
  const plan=buildArtworkPlan(db,"worlds/golden-age-agents/campaign-wiki");
  assert.equal(plan.length,1);
  assert.equal(plan[0].destination,"worlds/golden-age-agents/campaign-wiki/Media/Newspapers");
  assert.equal(plan[0].filename,"scoop.webp");
  assert.deepEqual(artworkFolders(plan,"worlds/golden-age-agents/campaign-wiki"),["worlds/golden-age-agents/campaign-wiki/Media","worlds/golden-age-agents/campaign-wiki/Media/Newspapers"]);
});

test("multiple Images paths are reported rather than guessed",()=>{
  const db=emptyUnifiedDatabase();
  putArticle(db,{id:"media",title:"Media",parentIds:["root:images"],organizer:true});
  putArticle(db,{id:"other",title:"Other",parentIds:["root:images"],organizer:true});
  putArticle(db,{id:"photo",title:"Photo",parentIds:["media","other"],image:"worlds/golden-age-agents/campaign-wiki/Handouts/photo.png"});
  const [row]=buildArtworkPlan(db,"worlds/golden-age-agents/campaign-wiki");
  assert.equal(row.status,"ambiguous-path");
  assert.equal(row.destination,null);
});

test("a new Image Article gets its upload folder before artwork is selected",()=>{
  const db=emptyUnifiedDatabase();
  putArticle(db,{id:"session-art",title:"Session Art",parentIds:["root:images"],organizer:true});
  putArticle(db,{id:"crow",title:"The Crow of Ypres",parentIds:["session-art"]});
  const draft={id:"new",title:"New Image",parentIds:["crow"]};
  assert.deepEqual(artworkDestinations(db,draft,"worlds/golden-age-agents/campaign-wiki"),["worlds/golden-age-agents/campaign-wiki/Session Art/The Crow of Ypres"]);
});

test("asset paths and folder names are normalized safely",()=>{
  assert.equal(pathWithinRoot("https://assets.example/123/worlds/golden-age-agents/campaign-wiki/Session%20Art/a.webp","worlds/golden-age-agents/campaign-wiki"),"worlds/golden-age-agents/campaign-wiki/Session Art/a.webp");
  assert.equal(safeFolderName('Press: 1937/38'),"Press- 1937-38");
});
