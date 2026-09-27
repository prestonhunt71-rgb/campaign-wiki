import {installRulebook,openRulebook as openLegacyRulebook} from './rulebook.js';
import {openHierarchyRulebook,restoreHierarchyRoute} from './hierarchy-foundry.js';
import {escapeHtml as esc} from './rulebook-core.js';
const M='hero-rulebook';
const openRulebook=(ref={})=>ref.pageId||ref.refs||ref.bookId?openLegacyRulebook(ref):openHierarchyRulebook(ref);
const keys=['rulebookBase','rulebookPreviousBase','rulebookUploadFolder','rulebookEdits','rulebookReviews','rulebookGlossary','rulebookRemovedPages'];
function legacy(key){const row=game.settings.storage.get('world').get(`campaign-wiki.${key}`);if(!row)return undefined;if(typeof row.value!=='string')return structuredClone(row.value);try{return JSON.parse(row.value);}catch{return row.value;}}
async function migrate(){
 if(game.user.isGM&&!game.settings.get(M,'migrated')){
  for(const key of keys){const value=legacy(key);if(value!==undefined)await game.settings.set(M,key,value);}
  const old=legacy('databaseV3'),collections={};
  for(const article of Object.values(old?.articles||{}))if(article.rulebookCollection)collections[article.id]={id:article.id,title:article.title,text:article.text,...article.rulebookCollection};
  await game.settings.set(M,'collections',collections);
  await game.settings.set(M,'migrated',true);
 }
 if(!game.user.getFlag(M,'favoritesMigrated')){const old=game.user.getFlag('campaign-wiki','rulebookFavorites');if(old)await game.user.setFlag(M,'rulebookFavorites',structuredClone(old));await game.user.setFlag(M,'favoritesMigrated',true);}
}
function openCollections(){const entries=Object.values(game.settings.get(M,'collections')).filter(c=>game.user.isGM||c.shared===true);new Dialog({title:'Rulebook collections',content:entries.length?entries.map(c=>`<p><button type="button" data-collection="${esc(c.id)}">${esc(c.title)}</button></p>`).join(''):'<p>No saved collections. Use Collect on rulebook sections, then Save collection. Migrated collections are GM-only.</p>',buttons:{close:{label:'Close'}},render:html=>html.on('click','[data-collection]',event=>{const c=entries.find(c=>c.id===event.currentTarget.dataset.collection);if(c)openRulebook({...c,article:c});})}).render(true);}
function position(){const button=document.querySelector('#hero-rulebook-launcher');if(!button)return;const wiki=document.querySelector('#campaign-wiki-launcher'),rect=wiki?.getBoundingClientRect();if(rect){button.style.left=`${rect.left}px`;button.style.top=`${rect.bottom+4}px`;button.style.bottom='auto';}else{button.style.left='12px';button.style.top='auto';const players=document.querySelector('#players')?.getBoundingClientRect();button.style.bottom=`${players?.height?Math.max(12,window.innerHeight-players.top+8):12}px`;}}
function launcher(){let button=document.querySelector('#hero-rulebook-launcher');if(!button){button=document.createElement('button');button.id='hero-rulebook-launcher';button.type='button';button.innerHTML='<i class="fas fa-book"></i><span>Rulebook</span>';button.onclick=()=>openRulebook();document.body.append(button);Hooks.callAll('renderSidebar');}position();}
Hooks.once('init',()=>{
 for(const [key,type,value] of [['migrated',Boolean,false],['collections',Object,{}]])game.settings.register(M,key,{scope:'world',config:false,type,default:value});
 installRulebook({linkText:text=>esc(text).replace(/\n/g,'<br>'),openCollections,saveCollection:async({id,title,text,bookId,refs})=>{const all=structuredClone(game.settings.get(M,'collections'));id||=foundry.utils.randomID();const entry={id,title,text,bookId,refs,shared:all[id]?.shared===true};all[id]=entry;await game.settings.set(M,'collections',all);return entry;}});
 class OpenRulebook extends FormApplication{render(){openRulebook();return this;}}
 game.settings.registerMenu(M,'open',{name:'Open Rulebook',label:'Open',icon:'fas fa-book',type:OpenRulebook,restricted:false});
 game.modules.get(M).api={open:openRulebook,openLegacy:openLegacyRulebook};
});
Hooks.once('ready',async()=>{try{await migrate();}catch(error){ui.notifications.error(`Rulebook migration failed: ${error.message}. Original data is untouched.`);}launcher();restoreHierarchyRoute();window.addEventListener('hashchange',restoreHierarchyRoute);const observer=new MutationObserver(position);observer.observe(document.body,{childList:true});const wiki=document.querySelector('#campaign-wiki-launcher');if(wiki)observer.observe(wiki,{attributes:true,attributeFilter:['style']});window.addEventListener('resize',position);});
Hooks.on('renderSidebar',launcher);Hooks.on('collapseSidebar',()=>setTimeout(position,120));
