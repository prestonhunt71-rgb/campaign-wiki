// Derived indexes only: the authoritative recursive source is never mutated.
export const normalizeTitle = value => String(value ?? '').normalize('NFKC')
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();
export const slug = value => normalizeTitle(value).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
export const sourceLabel = section => {
  const {pageStart, pageEnd} = section.source || {};
  return pageStart == null ? 'Source: Champions 4e (page not supplied)' :
    `Source: Champions 4e, ${pageEnd && pageEnd !== pageStart ? `pp. ${pageStart}–${pageEnd}` : `p. ${pageStart}`}`;
};

export function buildIndex(data) {
  if (!Array.isArray(data?.sections) || !data.sections.length) throw new Error('Expected recursive rules sections.');
  const rows = [], byRoute = new Map(), byHeading = new Map();
  function visit(sections, parent = null) {
    const counts = new Map();
    for (const s of sections) counts.set(slug(s.heading), (counts.get(slug(s.heading)) || 0) + 1);
    const used = new Set(sections.filter(s => counts.get(slug(s.heading)) === 1).map(s => slug(s.heading)));
    return sections.map(section => {
      if (!section.heading || (!section.text?.trim() && !section.tables?.length && !section.sections?.length))
        throw new Error(`Empty or untitled section: ${section.heading || '(untitled)'}`);
      let name = slug(section.heading);
      if (counts.get(name) > 1) {
        const base = `${name}-p-${slug(section.source?.pageStart || 'unknown')}`;
        name = base;
        let suffix = 2;
        while (used.has(name)) name = `${base}-${suffix++}`;
        used.add(name);
      }
      const route = `${parent?.route || '/rules'}/${name}`;
      if (byRoute.has(route)) throw new Error(`Duplicate route: ${route}`);
      const row = {section, title: section.heading, normalizedTitle: normalizeTitle(section.heading), route,
        parent, ancestry: [...(parent?.ancestry || []), section.heading],
        ancestors: [...(parent?.ancestors || []), ...(parent ? [parent] : [])],
        pageStart: section.source?.pageStart, position: rows.length, children: []};
      rows.push(row); byRoute.set(route, row);
      if (!byHeading.has(row.normalizedTitle)) byHeading.set(row.normalizedTitle, []);
      byHeading.get(row.normalizedTitle).push(row);
      row.children = visit(section.sections || [], row);
      return row;
    });
  }
  const roots = visit(data.sections);
  return linkIndex(rows, roots);
}

export function linkIndex(rows, roots) {
  const byRoute = new Map(rows.map(row => [row.route, row])), byHeading = new Map();
  for (const row of rows) {
    if (!byHeading.has(row.normalizedTitle)) byHeading.set(row.normalizedTitle, []);
    byHeading.get(row.normalizedTitle).push(row);
  }
  for (const [i, row] of rows.entries()) {row.previous = rows[i - 1]; row.next = rows[i + 1];}
  const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = [...byHeading.keys()].sort((a, b) => b.length - a.length).map(escapeRegex).join('|');
  const index = {rows, roots, byRoute, byHeading,
    matcher: new RegExp(`(?<![\\p{L}\\p{N}_])(?:${pattern})(?![\\p{L}\\p{N}_])`, 'gu'), backlinks: new Map()};
  for (const row of rows) for (const match of matchTerms(index, row.section.text || '', row)) {
    if (!match.target) continue;
    if (!index.backlinks.has(match.target.route)) index.backlinks.set(match.target.route, new Set());
    index.backlinks.get(match.target.route).add(row.route);
  }
  return index;
}

export function resolveTerm(index, term, current) {
  if (normalizeTitle(term) === current?.normalizedTitle) return {candidates: []};
  const candidates = index.byHeading.get(normalizeTitle(term)) || [];
  if (candidates.length < 2) return {target: candidates[0], candidates};
  const path = current ? [...current.ancestors, current].map(r => r.route) : [];
  const scores = candidates.map(candidate => {
    const targetPath = [...candidate.ancestors, candidate].map(r => r.route);
    let score = 0;
    while (score < path.length && path[score] === targetPath[score]) score++;
    return score;
  });
  const best = Math.max(...scores), nearest = candidates.filter((_, i) => scores[i] === best);
  return {target: nearest.length === 1 ? nearest[0] : undefined, candidates: nearest};
}

function comparisonText(text) {
  let value = ''; const starts = [], ends = [];
  for (let i = 0; i < text.length;) {
    const char = String.fromCodePoint(text.codePointAt(i)), start = i;
    i += char.length;
    const normalized = char.normalize('NFKC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').toLowerCase();
    for (const c of normalized) {
      if (/\s/u.test(c) && value.endsWith(' ')) {ends[ends.length - 1] = i; continue;}
      const piece = /\s/u.test(c) ? ' ' : c;
      value += piece;
      for (let j = 0; j < piece.length; j++) {starts.push(start); ends.push(i);}
    }
  }
  return {value, starts, ends};
}

export function matchTerms(index, text, current) {
  text = String(text);
  const protectedRanges = [...text.matchAll(/<a\b[^>]*>[\s\S]*?<\/a\s*>|<(?:pre|code)\b[^>]*>[\s\S]*?<\/(?:pre|code)\s*>|<[^>]*>|```[\s\S]*?(?:```|$)|`[^`\n]*`|!?\[[^\]\n]*\]\([^\n)]*\)|(?:https?:\/\/|www\.)[^\s<>]+|[\w./-]+\.(?:webp|png|jpe?g|gif|svg|json)\b/giu)]
    .map(m => [m.index, m.index + m[0].length]);
  const {value, starts, ends} = comparisonText(text), result = [];
  index.matcher.lastIndex = 0;
  for (const match of value.matchAll(index.matcher)) {
    const start = starts[match.index], end = ends[match.index + match[0].length - 1];
    if (protectedRanges.some(([a, b]) => start < b && end > a)) continue;
    const resolution = resolveTerm(index, match[0], current);
    if (resolution.target || resolution.candidates.length > 1)
      result.push({start, end, text: text.slice(start, end), ...resolution});
  }
  return result;
}

export function searchIndex(index, query) {
  const terms = normalizeTitle(query).split(' ').filter(Boolean);
  if (!terms.length) return [];
  return index.rows.flatMap(row => {
    const body = row.section.text || '', heading = row.normalizedTitle;
    const haystack = normalizeTitle(`${row.ancestry.join(' ')} ${body}`);
    if (!terms.every(term => haystack.includes(term))) return [];
    const position = normalizeTitle(body).indexOf(terms[0]);
    return [{row, score: (heading === normalizeTitle(query) ? 100 : 0) + terms.filter(t => heading.includes(t)).length * 10,
      excerpt: body.slice(Math.max(0, position - 65), Math.max(0, position - 65) + 240)}];
  }).sort((a, b) => b.score - a.score || a.row.position - b.row.position);
}

export function tablePath(table) {
  const path = String(table.path || '');
  if (!/^images\/[a-z\d_-]+\.(?:webp|png|jpe?g)$/i.test(path)) throw new Error(`Invalid table path: ${path}`);
  return path;
}
