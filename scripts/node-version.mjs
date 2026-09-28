// One Node line, declared once, in .nvmrc.
//
// Runs before every build (npm's prebuild), in CI and on Cloudflare Pages,
// and fails the build if anything disagrees with .nvmrc:
//
// - the Node running the build (Cloudflare Pages picks its Node from
//   .nvmrc, so a build on any other Node means the host did not read it);
// - every actions/setup-node step, which must read .nvmrc;
// - engines.node and @types/node in package.json and the lockfile.
//
// Before this check the site said Node 22 in .node-version and in CI, and
// its types described Node 25.
//
// Usage: node scripts/node-version.mjs
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const problems = [];
const expect = (ok, message) => {
  if (!ok) problems.push(message);
};

const nvmrc = read('.nvmrc');
expect(/^\d+\n$/.test(nvmrc), `.nvmrc must hold a bare major version, found ${JSON.stringify(nvmrc)}`);
const major = nvmrc.trim();

const running = process.versions.node.split('.')[0];
expect(running === major, `this build runs on Node ${process.versions.node}, but .nvmrc says ${major}`);

expect(!existsSync(path.join(root, '.node-version')), '.node-version must not exist: .nvmrc is the one place the version is written');

const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const exact = new RegExp(`^\\^${major}\\.\\d+\\.\\d+$`);
expect(exact.test(pkg.engines?.node ?? ''), `engines.node must be ^${major}.x.y, found ${pkg.engines?.node}`);
expect(lock.packages[''].engines?.node === pkg.engines?.node, 'the lockfile root engines.node must match package.json');
const types = pkg.devDependencies?.['@types/node'] ?? '';
expect(exact.test(types), `@types/node must be ^${major}.x.y, found ${types}`);
expect(lock.packages[''].devDependencies?.['@types/node'] === types, 'the lockfile root @types/node must match package.json');
const resolved = lock.packages['node_modules/@types/node']?.version ?? '';
expect(resolved.split('.')[0] === major, `the lockfile resolved @types/node ${resolved}, not ${major}.x`);

const dir = path.join(root, '.github/workflows');
let steps = 0;
for (const file of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
  const lines = readFileSync(path.join(dir, file), 'utf8').split('\n');
  const uses = lines.filter((l) => /uses:\s*actions\/setup-node@/.test(l)).length;
  const reads = lines.filter((l) => /^\s*node-version-file:\s*["']?\.nvmrc["']?\s*$/.test(l)).length;
  steps += uses;
  expect(uses === reads, `${file}: ${uses} setup-node steps, ${reads} of them read .nvmrc`);
  for (const line of lines.filter((l) => /^\s*node-version:/.test(l))) {
    problems.push(`${file}: names its own Node version: ${line.trim()}`);
  }
}
// browser-check.yml and security.yml each set up Node once.
expect(steps === 2, `expected 2 setup-node steps in the workflows, found ${steps}`);

if (problems.length > 0) {
  console.error(`Node version check failed (.nvmrc says ${major}):`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`Node version check: Node ${process.versions.node}, .nvmrc ${major}, all places agree.`);
