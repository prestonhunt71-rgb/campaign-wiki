import {linkIndex, normalizeTitle} from './hierarchy-core.js';
export const emptyOrganization = () => ({parents: {}, excluded: [], houseRules: {}, custom: {}});
const owns = (object, key) => Object.hasOwn(object || {}, key);
export function organizedIndex(source, state = {}) {
  const all = source.rows.map(row => ({...row, children: [], ancestors: [], ancestry: [], parent: null}));
  for (const [id, value] of Object.entries(state.custom || {})) {
    if (!/^[a-z\d-]+$/i.test(id) || !value.heading?.trim()) continue;
    all.push({route: `/rules/custom/${id}`, title: value.heading, normalizedTitle: normalizeTitle(value.heading),
      section: {heading: value.heading, text: value.text || ''}, customId: id, children: [], ancestors: [], ancestry: [], parent: null});
  }
  const full = new Map(all.map(row => [row.route, row]));
  const parentRoutes = new Map(all.map(row => [row.route, owns(state.parents, row.route) ? state.parents[row.route] : source.byRoute.get(row.route)?.parent?.route || null]));
  for (const row of all) {
    const seen = new Set([row.route]); let parent = parentRoutes.get(row.route);
    while (parent) {
      if (!full.has(parent)) throw Error('An assigned parent section is unavailable.');
      if (seen.has(parent)) throw Error('A section cannot be its own ancestor.');
      seen.add(parent); parent = parentRoutes.get(parent);
    }
  }
  const excluded = new Set(state.excluded || []), roots = [], active = all.filter(row => !excluded.has(row.route));
  for (const row of active) {
    let parent = parentRoutes.get(row.route);
    while (parent && excluded.has(parent)) parent = parentRoutes.get(parent);
    row.parent = full.get(parent) || null;
    (row.parent ? row.parent.children : roots).push(row);
    row.houseRule = state.houseRules?.[row.route] || '';
  }
  const compare = (a,b) => a.title.localeCompare(b.title, 'en', {sensitivity:'base', numeric:true}) || a.route.localeCompare(b.route);
  const rows = [];
  function walk(children, ancestors = []) {
    children.sort(compare);
    for (const row of children) {
      row.ancestors = ancestors; row.ancestry = [...ancestors.map(a=>a.title), row.title]; row.position = rows.length;
      rows.push(row); walk(row.children, [...ancestors, row]);
    }
  }
  walk(roots);
  const index = linkIndex(rows, roots);
  return {...index, all, parentRoutes, excluded};
}
export function changeOrganization(source, original, command) {
  const state = {...emptyOrganization(), ...structuredClone(original || {})};
  const before = organizedIndex(source, state), known = new Set(before.all.map(row => row.route));
  if (command.type === 'create') {
    if (!/^[a-z\d-]+$/i.test(command.id || '') || owns(state.custom, command.id)) throw Error('Invalid article ID.');
    if (!command.heading?.trim()) throw Error('Enter an article title.');
    const route = `/rules/custom/${command.id}`;
    state.custom[command.id] = {heading: command.heading.trim(), text: String(command.text || '')};
    if (command.parent && !known.has(command.parent)) throw Error('Choose an existing parent.');
    state.parents[route] = command.parent || null;
  } else {
    if (!known.has(command.route)) throw Error('Section not found.');
    if (command.type === 'organize') {
      if (command.parent && !known.has(command.parent)) throw Error('Choose an existing parent.');
      state.parents[command.route] = command.parent || null;
      if (command.children) {
        const selected = new Set(command.children);
        for (const [child, parent] of before.parentRoutes) if (parent === command.route && !selected.has(child)) state.parents[child] = null;
        for (const child of selected) {
          if (!known.has(child)) throw Error('Child section not found.');
          state.parents[child] = command.route;
        }
      }
    } else if (command.type === 'exclude') state.excluded = [...new Set([...state.excluded, command.route])];
    else if (command.type === 'restore') state.excluded = state.excluded.filter(route => route !== command.route);
    else if (command.type === 'house') state.houseRules[command.route] = String(command.text || '');
    else if (command.type === 'edit') {
      const row = before.all.find(row => row.route === command.route);
      if (!row.customId || !command.heading?.trim()) throw Error('Only custom articles can be edited here.');
      state.custom[row.customId] = {heading: command.heading.trim(), text: String(command.text || '')};
    } else throw Error('Unknown organization action.');
  }
  organizedIndex(source, state); // Reject cycles before storing any changes.
  return state;
}
