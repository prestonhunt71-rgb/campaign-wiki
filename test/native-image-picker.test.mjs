import test from 'node:test';
import assert from 'node:assert/strict';
import {pickArticleImage} from '../modules/hero-rulebook/scripts/native-image-picker.js';
function setup(t){const previous={game:globalThis.game,FilePicker:globalThis.FilePicker,foundry:globalThis.foundry};t.after(()=>Object.assign(globalThis,previous));globalThis.game={user:{isGM:true}};}
test('native picker opens the current image and returns selected/uploaded paths unchanged',t=>{
 setup(t);let selected;globalThis.FilePicker=class{constructor(options){this.options=options;}render(force){this.open=force;}};
 const picker=pickArticleImage('https://assets.forge-vtt.com/example/old.webp',path=>selected=path);
 assert.equal(picker.open,true);assert.equal(picker.options.type,'image');assert.equal(picker.options.current,'https://assets.forge-vtt.com/example/old.webp');
 picker.options.callback('https://assets.forge-vtt.com/example/uploaded.webp');assert.equal(selected,'https://assets.forge-vtt.com/example/uploaded.webp');
 picker.options.callback('');assert.equal(selected,'https://assets.forge-vtt.com/example/uploaded.webp');
});
test('Foundry v13 implementation fallback uses the normal picker for blank image slots',t=>{
 setup(t);globalThis.FilePicker=undefined;globalThis.foundry={applications:{apps:{FilePicker:{implementation:class{constructor(options){this.options=options;}render(){}}}}}};
 assert.equal(pickArticleImage('',()=>{}).options.current,'');
});
test('players cannot open the article image picker and missing runtime is reported',t=>{
 setup(t);globalThis.game.user.isGM=false;assert.throws(()=>pickArticleImage('',()=>{}),/Only the GM/);
 globalThis.game.user.isGM=true;globalThis.FilePicker=undefined;globalThis.foundry={};assert.throws(()=>pickArticleImage('',()=>{}),/unavailable/);
});
