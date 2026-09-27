import {buildIndex, matchTerms, searchIndex, sourceLabel, tablePath} from './hierarchy-core.js';

const PREFIX = '#hero-rulebook';
export function currentLocation() {
  if (!location.hash.startsWith(`${PREFIX}/rules/`)) return null;
  const [path, query = ''] = location.hash.slice(PREFIX.length).split('?');
  try {return {route: decodeURI(path), readThrough: new URLSearchParams(query).get('mode') === 'read'};}
  catch {return {route: path, readThrough: false};}
}
export const routeHash = (route, readThrough = false) => `${PREFIX}${encodeURI(route)}${readThrough ? '?mode=read' : ''}`;
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
function button(text, action) {
  const node = element('button', '', text); node.type = 'button'; node.addEventListener('click', action); return node;
}
function ruleLink(row, text = row.title) {
  const link = element('a', '', text);
  link.href = routeHash(row.route); link.dataset.ruleRoute = row.route;
  link.title = `${row.ancestry.join(' › ')}\n${sourceLabel(row.section)}\n${(row.section.text || '').slice(0, 200)}`;
  return link;
}

export function linkifyProse(container, index, current, onAmbiguous) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (!walker.currentNode.parentElement.closest('a,button,code,pre,script,style,[data-no-link]')) nodes.push(walker.currentNode);
  }
  for (const node of nodes) {
    const matches = matchTerms(index, node.nodeValue, current);
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment(); let offset = 0;
    for (const match of matches) {
      fragment.append(document.createTextNode(node.nodeValue.slice(offset, match.start)));
      const link = match.target ? ruleLink(match.target, match.text) : button(match.text, () => onAmbiguous(match));
      link.classList.add(match.target ? 'hr-crosslink' : 'hr-ambiguous');
      if (!match.target) {link.title = 'Multiple matching rules — choose a section'; link.setAttribute('aria-haspopup', 'dialog');}
      fragment.append(link); offset = match.end;
    }
    fragment.append(document.createTextNode(node.nodeValue.slice(offset))); node.replaceWith(fragment);
  }
}

let dataPromise;
export async function loadRules() {
  dataPromise ??= fetch(new URL('../data/hero-rulebook-rules.organized-v7.json', import.meta.url))
    .then(response => {if (!response.ok) throw new Error(`Rules data unavailable (${response.status}).`); return response.json();})
    .then(buildIndex).catch(error => {dataPromise = null; throw error;});
  return dataPromise;
}

export async function mountReader(root, {route, onLegacy} = {}) {
  root.classList.add('hr-reader'); root.textContent = 'Loading Champions 4e rules…';
  let index;
  try {index = await loadRules();}
  catch (error) {
    root.replaceChildren(element('h2', '', 'Rules unavailable'), element('p', '', error.message),
      button('Retry', () => mountReader(root, {route, onLegacy})));
    return {destroy() {}};
  }
  if (!root.isConnected) return {destroy() {}};
  root.replaceChildren();
  const toolbar = element('header', 'hr-toolbar'), brand = element('div', 'hr-brand', 'CHAMPIONS');
  brand.append(element('small', '', 'FOURTH EDITION · RULES REFERENCE'));
  const search = element('form', 'hr-search'), input = element('input');
  input.type = 'search'; input.placeholder = 'Search rules, powers, skills…'; input.setAttribute('aria-label', 'Search rules');
  const submit = element('button', '', 'Search'); submit.type = 'submit'; search.append(input, submit);
  const navToggle = button('Contents', () => {
    const open = root.classList.toggle('hr-nav-open'); navToggle.setAttribute('aria-expanded', String(open));
  });
  navToggle.className = 'hr-nav-toggle'; navToggle.setAttribute('aria-expanded', 'false');
  toolbar.append(brand, navToggle, search);
  if (onLegacy) toolbar.append(button('Earlier reader', onLegacy));
  const layout = element('div', 'hr-layout'), nav = element('nav', 'hr-tree'), main = element('main', 'hr-main');
  nav.setAttribute('aria-label', 'Rules hierarchy'); main.tabIndex = -1;
  const treeLinks = new Map(), branches = new Map();
  nav.append(element('h2', '', 'Rules contents'), element('p', 'hr-meta', `${index.roots.length} divisions · ${index.rows.length} sections`));
  function tree(rows, container) {
    for (const row of rows) {
      const link = ruleLink(row); treeLinks.set(row.route, link);
      if (row.children.length) {
        const branch = element('details'), summary = element('summary'), children = element('div', 'hr-tree-children');
        summary.append(link); branch.append(summary, children); branches.set(row.route, branch);
        tree(row.children, children); container.append(branch);
      } else {const leaf = element('div', 'hr-tree-leaf'); leaf.append(link); container.append(leaf);}
    }
  }
  tree(index.roots, nav); layout.append(nav, main); root.append(toolbar, layout);
  let current, readThrough = false, disposed = false;
  const modal = (title, contents) => {
    const dialog = element('dialog', 'hr-dialog');
    dialog.append(element('h2', '', title), contents, button('Close', () => dialog.close()));
    dialog.addEventListener('close', () => dialog.remove()); root.append(dialog); dialog.showModal();
  };
  function disambiguate(match) {
    const list = element('ul');
    for (const candidate of match.candidates) {
      const item = element('li'); item.append(ruleLink(candidate), element('p', 'hr-meta', `${candidate.ancestry.join(' › ')} · ${sourceLabel(candidate.section)}`)); list.append(item);
    }
    modal(`Choose a rule: ${match.text}`, list);
  }
  function article(row, nested = false) {
    const section = element('article', 'hr-article'); section.id = `section-${encodeURIComponent(row.route)}`;
    section.dataset.route = row.route;
    const heading = element(nested ? 'h2' : 'h1', '', row.title);
    section.append(heading, element('p', 'hr-meta', sourceLabel(row.section)));
    if (row.children.length) {
      const contents = element('nav', 'hr-local-contents'); contents.setAttribute('aria-label', `Contents of ${row.title}`);
      contents.append(element('strong', '', 'In this section'));
      const list = element('ul');
      for (const child of row.children) {const item = element('li'); item.append(ruleLink(child)); list.append(item);}
      contents.append(list); section.append(contents);
    }
    if (row.section.text) {
      const prose = element('div', 'hr-prose', row.section.text);
      linkifyProse(prose, index, row, disambiguate); section.append(prose);
    }
    for (const [i, table] of (row.section.tables || []).entries()) {
      const figure = element('figure'), image = element('img'), caption = table.caption || `${row.title} — table ${i + 1}`;
      image.alt = caption; image.loading = 'lazy';
      const enlarge = button('', () => {
        const big = image.cloneNode(); big.removeAttribute('loading'); modal(caption, big);
      });
      enlarge.className = 'hr-table'; enlarge.setAttribute('aria-label', `Enlarge ${caption}`);
      const missing = () => figure.replaceChildren(element('p', 'hr-missing', `Table unavailable: ${table.path || '(missing path)'} — ${caption}`));
      image.addEventListener('error', missing, {once: true});
      try {image.src = new URL(`../${tablePath(table)}`, import.meta.url).href;} catch {missing(); section.append(figure); continue;}
      enlarge.append(image); figure.append(enlarge, element('figcaption', 'hr-meta', caption)); section.append(figure);
    }
    if (nested) {const permalink = ruleLink(row, 'Open this section'); permalink.className = 'hr-permalink'; section.append(permalink);}
    return section;
  }
  function renderRoute() {
    if (disposed) return;
    const state = currentLocation();
    const selectedRoute = state?.route || route || index.roots[0].route;
    current = index.byRoute.get(selectedRoute); readThrough = state?.readThrough || false;
    main.replaceChildren();
    for (const link of treeLinks.values()) link.removeAttribute('aria-current');
    if (!current) {main.append(element('h1', '', 'Section not found'), element('p', '', 'Choose a section from the contents or search the rules.')); return;}
    treeLinks.get(current.route).setAttribute('aria-current', 'page');
    for (const ancestor of current.ancestors) branches.get(ancestor.route).open = true;
    const crumbs = element('nav', 'hr-breadcrumbs'); crumbs.setAttribute('aria-label', 'Breadcrumbs');
    for (const ancestor of current.ancestors) crumbs.append(ruleLink(ancestor), document.createTextNode(' › '));
    crumbs.append(element('span', '', current.title));
    const tools = element('div', 'hr-reading-tools');
    const toggle = button(readThrough ? 'Article mode' : 'Read-through mode', () => navigate(current.route, !readThrough));
    toggle.setAttribute('aria-pressed', String(readThrough));
    tools.append(toggle, button('Copy section link', async () => {
      const url = new URL(location.href); url.hash = routeHash(current.route, readThrough);
      try {await navigator.clipboard.writeText(url.href); tools.querySelector('[role=status]').textContent = 'Link copied.';}
      catch {const field = element('input'); field.value = url.href; field.setAttribute('aria-label', 'Section link'); modal('Copy section link', field); field.select();}
    }), element('span', 'hr-meta'));
    tools.lastChild.setAttribute('role', 'status');
    main.append(crumbs, tools, article(current));
    if (readThrough) {
      const descend = rows => {for (const row of rows) {main.append(article(row, true)); descend(row.children);}};
      descend(current.children);
    }
    const backlinks = index.backlinks.get(current.route);
    if (backlinks?.size) {
      const details = element('details', 'hr-backlinks'), summary = element('summary', '', `Referenced by ${backlinks.size} sections`), list = element('ul');
      for (const ref of backlinks) {const row = index.byRoute.get(ref), item = element('li'); item.append(ruleLink(row, row.ancestry.join(' › '))); list.append(item);}
      details.append(summary, list); main.append(details);
    }
    const sequence = element('nav', 'hr-sequence'); sequence.setAttribute('aria-label', 'Book order');
    if (current.previous) sequence.append(ruleLink(current.previous, `← ${current.previous.title}`));
    if (current.next) sequence.append(ruleLink(current.next, `${current.next.title} →`));
    main.append(sequence); main.scrollTop = 0;
    treeLinks.get(current.route).scrollIntoView({block: 'nearest'});
  }
  function navigate(target, mode = false) {
    const hash = routeHash(target, mode);
    history.pushState(null, '', hash); renderRoute();
    root.classList.remove('hr-nav-open'); navToggle.setAttribute('aria-expanded', 'false'); main.focus({preventScroll: true});
  }
  const click = event => {
    const link = event.target.closest('a[data-rule-route]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); root.querySelectorAll('dialog').forEach(d => d.close()); navigate(link.dataset.ruleRoute);
  };
  root.addEventListener('click', click);
  search.addEventListener('submit', event => {
    event.preventDefault(); main.replaceChildren(element('h1', '', 'Search results'));
    const results = searchIndex(index, input.value);
    main.append(element('p', 'hr-meta', input.value.trim() ? `${results.length} matching sections` : 'Enter a search term.'));
    for (const {row, excerpt} of results) {
      const result = element('article', 'hr-result'), heading = element('h2'); heading.append(ruleLink(row));
      result.append(heading, element('p', 'hr-meta', row.ancestry.join(' › ')), element('p', '', excerpt || 'This section contains tables or child sections.'), element('p', 'hr-meta', sourceLabel(row.section))); main.append(result);
    }
    root.classList.remove('hr-nav-open'); navToggle.setAttribute('aria-expanded', 'false'); main.scrollTop = 0;
  });
  const keydown = event => {if ((event.ctrlKey || event.metaKey) && event.key === 'k') {event.preventDefault(); input.focus();}};
  root.addEventListener('keydown', keydown);
  window.addEventListener('popstate', renderRoute); window.addEventListener('hashchange', renderRoute);
  if (route) history.replaceState(null, '', routeHash(route));
  else if (!currentLocation()) history.replaceState(null, '', routeHash(index.roots[0].route));
  renderRoute();
  return {index, navigate, destroy() {
    disposed = true; window.removeEventListener('popstate', renderRoute); window.removeEventListener('hashchange', renderRoute);
    root.removeEventListener('click', click); root.removeEventListener('keydown', keydown);
  }};
}
