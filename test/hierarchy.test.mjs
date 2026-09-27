import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildIndex, matchTerms, normalizeTitle, resolveTerm, searchIndex, sourceLabel, tablePath} from '../modules/hero-rulebook/scripts/hierarchy-core.js';
const base = new URL('../modules/hero-rulebook/', import.meta.url);
const source = readFileSync(new URL('data/hero-rulebook-rules.organized-v7.json', base), 'utf8');
const data = JSON.parse(source), index = buildIndex(data);
const section = (heading, text = 'Reference prose.', children = [], page = '1') => ({heading, text, sections: children, source: {pageStart: page, pageEnd: page}});

test('v7 is preserved with all routes, table references, order, and image bytes', () => {
  assert.equal(JSON.stringify(data), JSON.stringify(JSON.parse(source)));
  assert.equal(index.rows.length, 630); assert.equal(index.roots.length, 24); assert.equal(index.byRoute.size, 630);
  assert.equal([...index.byHeading.values()].filter(rows => rows.length > 1).length, 63);
  const ordered = []; const walk = rows => rows.forEach(row => {ordered.push(row); walk(row.sections || []);}); walk(data.sections);
  assert.deepEqual(index.rows.map(row => row.section), ordered);
  const tables = ordered.flatMap(row => row.tables || []); assert.equal(tables.length, 169);
  for (const table of tables) assert.deepEqual(readFileSync(new URL(tablePath(table), base)), Buffer.from(table.data, 'base64'));
  for (const row of index.rows) for (const match of matchTerms(index, row.section.text || '', row)) {
    if (match.target) assert.ok(index.byRoute.has(match.target.route));
    else assert.ok(match.candidates.length > 1);
  }
});
test('arbitrary depth, table-only leaves, and book order', () => {
  let nested = {heading: 'Table only', tables: [{path: 'images/example.webp'}]};
  for (let i = 0; i < 12; i++) nested = {heading: `Level ${i}`, sections: [nested]};
  const i = buildIndex({sections: [nested]}); assert.equal(i.rows.length, 13);
  assert.equal(i.rows.at(-1).ancestors.length, 12); assert.equal(i.rows[1].previous, i.rows[0]);
  assert.equal(i.rows[0].next, i.rows[1]); assert.throws(() => buildIndex({sections: [{heading: 'Empty'}]}));
});
test('colliding ancestry routes use source pages and deterministic tie breaks', () => {
  const fixture = {sections: [section('Same', 'a', [], 'S 44'), section('Same', 'b', [], 'S 44'), section('Same', 'c', [], '9'), section('Same p S 44')]};
  const routes = buildIndex(fixture).rows.map(row => row.route);
  assert.equal(new Set(routes).size, 4); assert.deepEqual(routes, buildIndex(fixture).rows.map(row => row.route));
  assert.ok(routes[0].includes('p-s-44')); assert.ok(routes[2].endsWith('p-9'));
});
test('longest whole heading, case, exact wording, punctuation, and no invented plurals', () => {
  const i = buildIndex({sections: [section('Attack'), section('Hand-to-Hand Killing Attack'), section("Hero’s Luck (2)"), section('Energy Blast'), section('Entangle'), section('Other')]});
  const text = 'HAND-TO-HAND KILLING ATTACK; Hero\'s Luck (2); Energy\n Blast; Entangles disentangle Entangle.';
  const matches = matchTerms(i, text, i.rows.at(-1));
  assert.deepEqual(matches.map(m => m.target.title), ['Hand-to-Hand Killing Attack', 'Hero’s Luck (2)', 'Energy Blast', 'Entangle']);
  for (const match of matches) assert.equal(text.slice(match.start, match.end), match.text);
  assert.equal(normalizeTitle('  HERO’S   LUCK '), "hero's luck");
});
test('self references and protected prose locations are not linked', () => {
  const i = buildIndex({sections: [section('Entangle'), section('Other')]});
  assert.equal(matchTerms(i, 'Entangle', i.rows[0]).length, 0);
  const text = 'https://example.org/Entangle www.example.org/Entangle images/Entangle.webp `Entangle` ```Entangle``` [Entangle](https://example.org) <a href="x">Entangle</a> <code>Entangle</code> <pre>Entangle</pre> <span title="Entangle">safe</span> Entangle';
  const matches = matchTerms(i, text, i.rows[1]); assert.equal(matches.length, 1); assert.equal(matches[0].start, text.lastIndexOf('Entangle'));
});
test('duplicate headings prefer nearest ancestry and otherwise expose all tied candidates', () => {
  const i = buildIndex({sections: [section('A', '', [section('Duplicate'), section('Near', 'Duplicate')]), section('B', '', [section('Duplicate')]), section('Outside')]});
  const near = i.rows.find(row => row.title === 'Near'), outside = i.rows.at(-1);
  assert.equal(resolveTerm(i, 'Duplicate', near).target.route, '/rules/a/duplicate');
  const ambiguous = resolveTerm(i, 'Duplicate', outside); assert.equal(ambiguous.target, undefined); assert.equal(ambiguous.candidates.length, 2);
  assert.ok(!i.backlinks.get('/rules/a/duplicate')?.has(outside.route));
});
test('duplicate headings within the same division remain ambiguous when equally near', () => {
  const i = buildIndex({sections: [section('Root', 'Duplicate', [section('One', '', [section('Duplicate')]), section('Two', '', [section('Duplicate')])])]});
  assert.equal(resolveTerm(i, 'Duplicate', i.rows[0]).target, undefined);
});
test('search covers headings, direct text, and ancestry with headings ranked first', () => {
  const matches = searchIndex(index, 'Entangle'); assert.ok(matches.length > 2);
  assert.equal(matches[0].row.normalizedTitle, 'entangle');
  const i = buildIndex({sections: [section('Division', 'Unique body text', [section('Child')]), section('Unique')]});
  assert.equal(searchIndex(i, 'unique')[0].row.title, 'Unique');
  assert.ok(searchIndex(i, 'division').some(result => result.row.title === 'Child'));
});
test('source labels retain supplements and ranges; paths reject traversal', () => {
  assert.equal(sourceLabel({source: {pageStart: 'S 44', pageEnd: 'S 46'}}), 'Source: Champions 4e, pp. S 44–S 46');
  assert.throws(() => tablePath({path: 'images/../../bad.webp'}));
});
