// No published page names a decision record (AEGIS ADR-134 D1 and D3,
// Zaru ADR-0056): records are internal, so a reference to one in the
// public docs is noise to a reader and leaks the catalogue's shape.
//
// Reads the body of every content/docs/**/*.mdx page, with the frontmatter
// and MDX comments ({/* ... */}) masked out, line numbers kept, and prints
// every line matching the record pattern as file:line. Exits 1 on any hit,
// and on finding no page at all (a check that read nothing cannot fail).
// The word boundary before the letter patterns keeps sample codes such as
// ABCD-1234 from matching.
//
// Usage: node scripts/facing-text-check.mjs   (npm run facing-text:check)
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'content', 'docs');

const RECORD =
  /\bADR-[0-9]|\bCD-[0-9]|\bADR [0-9]|[Dd]ecision record|security audit 0|audit 0[0-9][0-9]|§[0-9]/;

const pages = readdirSync(docs, { recursive: true })
  .filter((name) => name.endsWith('.mdx'))
  .map((name) => path.join(docs, name))
  .sort();

// Replace every character but newlines with a space, so line numbers hold.
const blank = (text) => text.replace(/[^\n]/g, ' ');

const body = (source) => {
  let text = source;
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---(?=\r?\n|$)/.exec(text);
  if (frontmatter) text = blank(frontmatter[0]) + text.slice(frontmatter[0].length);
  return text.replace(/\{\/\*[\s\S]*?\*\/\}/g, blank);
};

const hits = [];
for (const page of pages) {
  const lines = body(readFileSync(page, 'utf8')).split('\n');
  lines.forEach((line, index) => {
    if (RECORD.test(line)) hits.push(`${path.relative(root, page)}:${index + 1}: ${line.trim()}`);
  });
}

if (pages.length === 0) {
  console.error(`facing-text check: no .mdx page found under ${path.relative(root, docs)}; nothing was checked`);
  process.exit(1);
}
if (hits.length > 0) {
  console.error(`facing-text check: ${hits.length} line(s) in ${pages.length} pages name a decision record:`);
  for (const hit of hits) console.error(hit);
  process.exit(1);
}
console.log(`facing-text check: ${pages.length} pages, no decision-record reference`);
