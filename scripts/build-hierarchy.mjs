import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {buildIndex, tablePath} from '../modules/hero-rulebook/scripts/hierarchy-core.js';
const root = fileURLToPath(new URL('../modules/hero-rulebook/', import.meta.url));
const source = path.join(root, 'data/hero-rulebook-rules.organized-v7.json');
const bytes = fs.readFileSync(source), data = JSON.parse(bytes), index = buildIndex(data);
const original = process.argv[2] ? fs.readFileSync(process.argv[2]) : null;
if (original && !bytes.equals(original)) throw Error('Packaged v7 differs from the supplied source.');
let tableCount = 0; const paths = new Set();
for (const row of index.rows) for (const table of row.section.tables || []) {
  const relative = tablePath(table), destination = path.join(root, relative);
  const image = Buffer.from(table.data || '', 'base64');
  if (image.subarray(0, 4).toString() !== 'RIFF' || image.subarray(8, 12).toString() !== 'WEBP') throw Error(`Invalid embedded WebP: ${relative}`);
  if (paths.has(relative) && !fs.readFileSync(destination).equals(image)) throw Error(`Conflicting image content: ${relative}`);
  fs.mkdirSync(path.dirname(destination), {recursive: true}); fs.writeFileSync(destination, image);
  paths.add(relative); tableCount++;
}
if (index.rows.length !== 630 || index.roots.length !== 24 || tableCount !== 169) throw Error('Unexpected v7 source counts.');
const report = {sections: index.rows.length, topLevelSections: index.roots.length, routes: index.byRoute.size,
  retainedTableReferences: tableCount, uniqueTableAssets: paths.size,
  duplicateHeadingNames: [...index.byHeading.values()].filter(rows => rows.length > 1).length,
  resolvedBacklinks: [...index.backlinks.values()].reduce((n, refs) => n + refs.size, 0),
  sourceSHA256: createHash('sha256').update(bytes).digest('hex'),
  sourcePreservedByteForByte: original ? bytes.equals(original) : null};
fs.writeFileSync(path.join(root, 'data/validation-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
