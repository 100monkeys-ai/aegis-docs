// A plain static file server for the built site in out/, used by the browser check.
// It resolves paths the way Cloudflare Pages does for this static export:
// "/docs/x" is served from "docs/x.html", "/" from "index.html", any other
// existing file as itself, and an unknown path answers 404 with "404.html".
// Usage: node tests/browser/serve.mjs [root] [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] ?? 'out');
const port = Number(process.argv[3] ?? 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mdx': 'text/markdown; charset=utf-8',
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function resolvePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const rel = normalize(decoded).replace(/^[/\\]+/, '');
  const base = join(root, rel);
  if (base !== root && !base.startsWith(root + sep)) return null;
  const candidates = decoded.endsWith('/')
    ? [join(base, 'index.html')]
    : [base + '.html', base, join(base, 'index.html')];
  for (const candidate of candidates) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  let file = null;
  try {
    file = await resolvePath(pathname);
  } catch {
    file = null;
  }
  const status = file ? 200 : 404;
  file ??= join(root, '404.html');
  try {
    const body = await readFile(file);
    res.writeHead(status, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} on http://127.0.0.1:${port}`);
});
