import {mountReader, currentLocation} from './hierarchy-reader.js';
import {openRulebook as openLegacyRulebook} from './rulebook.js';
let reader;
class HierarchyReader extends Application {
  static get defaultOptions() {
    return {...super.defaultOptions, id: 'hero-hierarchy-reader', title: 'Champions 4e Rules',
      width: 1150, height: 820, resizable: true, classes: ['hero-hierarchy-reader']};
  }
  async _renderInner() {
    this.controller?.destroy();
    return $('<div class="hr-reader"></div>');
  }
  async activateListeners(html) {
    super.activateListeners(html);
    this.controller = await mountReader(html[0], {route: this.initialRoute, onLegacy: () => openLegacyRulebook()});
    this.initialRoute = undefined;
  }
  async close(options) {this.controller?.destroy(); return super.close(options);}
}
export function openHierarchyRulebook(ref = {}) {
  reader ??= new HierarchyReader();
  if (reader.rendered && reader.controller) {
    if (ref.route) reader.controller.navigate(ref.route, Boolean(ref.readThrough));
    reader.bringToTop();
  } else {reader.initialRoute = ref.route; reader.render(true);}
  return reader;
}
export function restoreHierarchyRoute() {if (currentLocation()) openHierarchyRulebook();}
