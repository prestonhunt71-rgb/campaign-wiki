import {districtForArticle,getDistrictBounds} from './district-map-geometry.js';
import {districtMapSvg} from './district-location-map.js';
import {normalizeMapLocation,canonicalPointer,locationFitsDistrict} from './map-location.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mapLocationFields(){return '<fieldset class="cw-location-editor" data-location-editor hidden><legend>Map Location</legend><label>District map<select data-location-parent></select></label><p data-location-status role="status"></p><div class="cw-location-buttons"><button type="button" data-set-location>Set Location</button><button type="button" data-clear-location>Clear Location</button></div></fieldset><input type="hidden" name="mapLocation" value="">';}
export function activateLocationPicker(root,parent,existing){
 const svg=root.querySelector('[data-location-picker]'),marker=svg.querySelector('.cw-picker-point'),input=root.querySelector('[name=selectedLocation]'),status=root.querySelector('[data-point-status]');
 const bounds=getDistrictBounds(districtForArticle(parent).points);
 let selected=null;
 const set=point=>{
  const candidate=normalizeMapLocation({...point,parentId:parent.id},[parent.id]);
  if(!candidate||!locationFitsDistrict(candidate,parent))return;
  selected=candidate;input.value=JSON.stringify(candidate);
  marker.setAttribute('cx',candidate.x);marker.setAttribute('cy',candidate.y);marker.removeAttribute('hidden');
  status.textContent=`Selected: ${candidate.x.toFixed(1)}, ${candidate.y.toFixed(1)}`;
 };
 if(existing&&locationFitsDistrict(existing,parent))set(existing);
 svg.addEventListener('click',event=>{const point=canonicalPointer(svg,event.clientX,event.clientY);if(point)set(point);});
 svg.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key))return;
  event.preventDefault();event.stopPropagation();
  const current=selected??{x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2},step=event.shiftKey?10:1;
  let {x,y}=current;
  if(event.key==='ArrowLeft')x-=step;if(event.key==='ArrowRight')x+=step;
  if(event.key==='ArrowUp')y-=step;if(event.key==='ArrowDown')y+=step;
  set({x:Math.max(bounds.x,Math.min(bounds.x+bounds.width,x)),y:Math.max(bounds.y,Math.min(bounds.y+bounds.height,y))});
 });
}
export function setupMapLocationEditor(root,data,article,{isPlace,dialogForm,notify}){
 const panel=root.querySelector('[data-location-editor]'),input=root.querySelector('[name=mapLocation]'),select=panel.querySelector('[data-location-parent]'),status=panel.querySelector('[data-location-status]'),setButton=panel.querySelector('[data-set-location]'),clearButton=panel.querySelector('[data-clear-location]');
 let location=normalizeMapLocation(article.mapLocation,article.parentIds),warning='',parents=[];
 const write=()=>{
  input.value=location?JSON.stringify(location):'';
  status.textContent=warning||(location?`Location set: ${location.x.toFixed(1)}, ${location.y.toFixed(1)}. Save the Article to keep changes.`:'No exact location set.');
  setButton.textContent=location?'Change Location':'Set Location';clearButton.disabled=!location;
 };
 const refresh=()=>{
  const parentIds=[...root.querySelectorAll('[name=parentIds]')].map(el=>el.value),draft={...article,parentIds};
  parents=isPlace(draft)?parentIds.map(id=>data.articles[id]).filter(parent=>districtForArticle(parent)):[];
  const previous=select.value;
  if(location&&!parents.some(parent=>parent.id===location.parentId)){
   location=null;warning='Location cleared because its parent district changed.';notify?.(warning);
  }
  panel.hidden=parents.length===0;
  select.innerHTML=parents.map(parent=>`<option value="${escape(parent.id)}">${escape(parent.title)}</option>`).join('');
  select.value=location?.parentId||(parents.some(p=>p.id===previous)?previous:parents[0]?.id)||'';
  write();
 };
 select.addEventListener('change',()=>{if(location&&location.parentId!==select.value){location=null;warning='Location cleared. Pick a new point on the selected district map.';}write();});
 clearButton.addEventListener('click',()=>{location=null;warning='Location cleared. Save the Article to keep this change.';write();});
 setButton.addEventListener('click',async()=>{
  const parent=parents.find(p=>p.id===select.value);if(!parent)return;
  const picked=await dialogForm(`Set Location — ${parent.title}`,`<div class="cw-coordinate-picker"><p>Click or tap to place the marker. Click again to move it. Keyboard: focus the map and use arrow keys; Shift moves farther.</p>${districtMapSvg(parent,{picker:true})}<p data-point-status role="status">Choose a point, then Save Location.</p><input type="hidden" name="selectedLocation" value=""></div>`,{width:720,height:Math.min(820,window.innerHeight-80),saveLabel:'Save Location',saveIcon:'fa-map-marker-alt',onRender:html=>activateLocationPicker(html[0],parent,location)});
  if(!picked)return;
  const value=picked.get('selectedLocation');if(!value){notify?.('No location selected. Choose a point on the map first.');return;}
  refresh();if(!parents.some(p=>p.id===parent.id)||select.value!==parent.id)return;
  location=JSON.parse(value);warning='';write();
 });
 root.addEventListener('cw-parents-changed',refresh);refresh();
}
