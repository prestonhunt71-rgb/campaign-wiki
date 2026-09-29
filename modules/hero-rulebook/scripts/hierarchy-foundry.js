import {pickArticleImage} from './native-image-picker.js';
import {mountReader, currentLocation, loadRules} from './hierarchy-reader.js';
import {changeOrganization, emptyOrganization, organizedIndex} from './hierarchy-organization.js';
const M='hero-rulebook'; let reader, saveQueue=Promise.resolve();
const organization=()=>game.settings.get(M,'organizationV7') || emptyOrganization();
export function saveOrganization(command) {
  if (!game.user.isGM) return Promise.reject(Error('Only the GM may change rulebook sections.'));
  const pending=saveQueue.catch(()=>{}).then(async()=>{
    const source=await loadRules(), next=changeOrganization(source,organization(),command);
    await game.settings.set(M,'organizationV7',next);
  });
  saveQueue=pending; return pending;
}
export async function showSection(route) {
  if (!game.user.isGM) throw Error('Only the GM may show sections to players.');
  const index=organizedIndex(await loadRules(),organization());
  if (!index.byRoute.has(route)) throw Error('This section is excluded or unavailable.');
  await game.user.setFlag(M,'hierarchyShow',{route,nonce:foundry.utils.randomID()});
  ui.notifications.info('Section shown to connected players.');
}
export function installHierarchy() {
  game.settings.register(M,'organizationV7',{scope:'world',config:false,type:Object,default:emptyOrganization(),
    onChange:state=>reader?.controller?.refresh(state)});
  Hooks.on('updateUser',async(user,changes,_options,initiatorId)=>{
    const ref=changes.flags?.[M]?.hierarchyShow;
    if (!ref || game.user.isGM || user.id!==initiatorId || !game.users.get(initiatorId)?.isGM) return;
    try {
      const index=organizedIndex(await loadRules(),organization());
      if (index.byRoute.has(ref.route)) openHierarchyRulebook({route:ref.route,readThrough:false});
    } catch(error) {ui.notifications.warn(error.message);}
  });
}
class HierarchyReader extends Application {
  static get defaultOptions() {
    return {...super.defaultOptions,id:'hero-hierarchy-reader',title:'Champions 4e Rules',width:1150,height:820,resizable:true,classes:['hero-hierarchy-reader']};
  }
  async _renderInner() {this.controller?.destroy(); return $('<div class="hr-reader"></div>');}
  async activateListeners(html) {
    super.activateListeners(html);
    this.controller=await mountReader(html[0],{route:this.initialRoute,readThrough:this.initialReadThrough,
      adapter:{isGM:game.user.isGM,getState:organization,save:saveOrganization,show:showSection,pickImage:pickArticleImage}});
    this.initialRoute=undefined; this.initialReadThrough=undefined;
  }
  async close(options) {this.controller?.destroy(); return super.close(options);}
}
export function openHierarchyRulebook(ref={}) {
  reader??=new HierarchyReader();
  if (reader.rendered && reader.controller) {
    if (ref.route) reader.controller.navigate(ref.route,ref.readThrough!==false);
    reader.bringToTop();
  } else {reader.initialRoute=ref.route; reader.initialReadThrough=ref.readThrough; reader.render(true);}
  return reader;
}
export function restoreHierarchyRoute() {if (currentLocation()) openHierarchyRulebook();}
