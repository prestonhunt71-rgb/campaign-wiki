import test from "node:test";
import assert from "node:assert/strict";
import { emptyDatabase, entitiesOf } from "../scripts/core.js";
import { recoverLegacy } from "../scripts/legacy-recovery.js";

const overlay={
  taxonomyTags:[{id:"actors-heroes",name:"Heroes",parentId:"actors"},{id:"tag-golden",name:"Golden Agents",parentId:"actors-heroes",taxonomyRole:"team"}],
  articles:{
    "Actor.AAA":{aliases:"The Raven, Untitled",backgroundHistory:"Detective history",personalityMotivation:"Driven",quote:"Nevermore",tagIds:"actors-heroes tag-golden",visibility:"public",relationships:[{type:"featured-as-actor-in",target:"session-one"}]},
    "Actor.BBB":{tagIds:"",relationships:[{type:"dnpc-of",target:"actor-raven"}]},
    "Scene.SSS":{description:"A dark rooftop",relationships:[{type:"featured-as-location-in",target:"session-one"}]},
    "arc-one":{name:"The Arc",categoryId:"arcs",visibility:"public",image:"arc.webp"},
    "session-one":{name:"First Night",arcId:"arc-one",sessionDate:"20260830",manualHtml:"<p>Raven reached the rooftop.</p>"},
    "manual-letter":{name:"The Letter",categoryId:"handouts",image:"letter.webp",relationships:[{type:"linked-from",target:"session-one"}]}
  }
};
const documents={"Actor.AAA":{name:"Raven",img:"raven.webp",tokenArt:"token.webp"},"Actor.BBB":{name:"Gerda",img:"gerda.webp"},"Scene.SSS":{name:"Rooftop",img:"roof.webp"}};

test("legacy recovery enriches records and reconstructs campaign structure",()=>{
  const {database,stats}=recoverLegacy(emptyDatabase("world"),overlay,{sourceDocument:uuid=>documents[uuid]??null});
  const raven=entitiesOf(database,"actor").find(item=>item.name==="Raven"),gerda=entitiesOf(database,"actor").find(item=>item.name==="Gerda"),scene=entitiesOf(database,"scene")[0],session=entitiesOf(database,"session")[0],arc=entitiesOf(database,"arc")[0],image=entitiesOf(database,"image")[0],affiliation=entitiesOf(database,"affiliation")[0];
  assert.equal(raven.classification,"hero");assert.match(raven.description,/Detective history/);assert.match(raven.description,/Driven/);assert.equal(raven.quote,"Nevermore");assert.deepEqual(raven.aliases,["The Raven"]);assert.ok(raven.affiliationIds.includes(affiliation.id));
  assert.equal(gerda.dnpcOwnerId,raven.id);assert.equal(session.arcId,arc.id);assert.equal(session.playDate,"2026-08-30");assert.match(session.synopsis,/Raven reached/);assert.ok(session.memberIds.includes(raven.id));assert.ok(session.memberIds.includes(scene.id));assert.ok(session.memberIds.includes(image.id));assert.equal(image.classification,"media");assert.equal(database.migration.repairVersion,1);assert.ok(stats.sessionsLinked>=3);
});
