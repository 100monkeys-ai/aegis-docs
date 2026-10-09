import { expect, test, type Page, type Response } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The browser check. It loads the built site in Chromium and asserts what a
// reader sees: each page loads, has the title and heading its source gives it,
// shows the sidebar and highlighted code, and in-site navigation (sidebar,
// body links, search, back, anchors) lands on the right page without a full
// reload. Expected titles are read from the MDX sources, not typed here.

const contentRoot = join(process.cwd(), 'content', 'docs');
const shotsDir = process.env.BROWSER_CHECK_SHOTS ?? join('test-results', 'screenshots');
mkdirSync(shotsDir, { recursive: true });

// Two or three pages from every section of the navigation, plus the two top-level pages.
const docsPages = [
  '',
  'getting-started',
  'zaru/overview',
  'zaru/chat',
  'zaru/mcp-client-setup',
  'zaru/profiles',
  'zaru-cli/overview',
  'gateway/overview',
  'gateway/quickstart',
  'gateway/grpc-api',
  'agents/overview',
  'agents/writing-agents',
  'agents/tool-call-judging',
  'workflows/overview',
  'workflows/human-approvals',
  'workflows/schedules',
  'workflows/workflow-visualization',
  'concepts/agents',
  'concepts/security-model',
  'guides/authentication',
  'guides/edge-key-rotation',
  'architecture/overview',
  'architecture/event-bus',
  'deployment/docker',
  'deployment/caddy-edge-proxy',
  'deployment/firecracker',
  'reference/cli-capability-matrix',
  'reference/template-syntax',
  'reference/rest-api',
];

function sourceFile(slug: string): string {
  const candidates = slug === '' ? ['index.mdx'] : [`${slug}.mdx`, `${slug}/index.mdx`];
  for (const candidate of candidates) {
    const path = join(contentRoot, candidate);
    if (existsSync(path)) return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  }
  throw new Error(`no MDX source for docs slug "${slug}" under ${contentRoot}`);
}

function sourceTitle(slug: string): string {
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(sourceFile(slug));
  const line = frontmatter?.[1].split('\n').find((l) => l.startsWith('title:'));
  if (!line) throw new Error(`no title in the frontmatter of docs slug "${slug}"`);
  return line
    .slice('title:'.length)
    .trim()
    .replace(/^(["'])(.*)\1$/, '$2');
}

// The fenced code blocks of a page's source, in order: true where the fence
// names a language (and so must be highlighted), false where it is plain text.
function sourceCodeBlocks(slug: string): boolean[] {
  const blocks: boolean[] = [];
  let inside = false;
  for (const line of sourceFile(slug).split('\n')) {
    const fence = /^\s*```(\S*)/.exec(line);
    if (!fence) continue;
    if (!inside) {
      const lang = fence[1].split('{')[0];
      blocks.push(!['', 'text', 'txt', 'plaintext'].includes(lang));
    }
    inside = !inside;
  }
  return blocks;
}

function slugOf(pathname: string): string {
  return pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');
}

// Collects every console error, uncaught exception and failed same-origin
// request on a page, so each test can assert there were none.
function watch(page: Page, allowedStatus: (url: string, status: number) => boolean = () => false) {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console error: ${msg.text()} (${msg.location().url})`);
  });
  page.on('pageerror', (err) => problems.push(`uncaught exception: ${err.message}`));
  page.on('requestfailed', (req) => {
    if (!sameOrigin(page, req.url())) return;
    // Next's client fetches each linked page, reads the response headers and
    // cancels the body on purpose before it prefetches the page's segments;
    // Chromium reports that cancel as net::ERR_ABORTED on a fetch. It is not
    // a failed request. Any other failure, and any cancelled document, script,
    // stylesheet or font, is.
    if (req.resourceType() === 'fetch' && req.failure()?.errorText === 'net::ERR_ABORTED') return;
    problems.push(`request failed: ${req.url()} ${req.failure()?.errorText}`);
  });
  page.on('response', (res: Response) => {
    if (sameOrigin(page, res.url()) && res.status() >= 400 && !allowedStatus(res.url(), res.status())) {
      problems.push(`HTTP ${res.status()} for ${res.url()}`);
    }
  });
  return problems;
}

function sameOrigin(page: Page, url: string): boolean {
  const base = test.info().project.use.baseURL;
  return !!base && new URL(url).origin === new URL(base).origin;
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

async function shoot(page: Page, name: string) {
  await settle(page);
  await page.screenshot({
    path: join(shotsDir, `${name}.png`),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  });
}

// Asserts the page on screen is the docs page with this slug.
async function expectDocsPage(page: Page, slug: string) {
  const title = sourceTitle(slug);
  await expect(page).toHaveURL((url) => slugOf(url.pathname) === slug && url.pathname.startsWith('/docs'));
  await expect(page).toHaveTitle(title);
  await expect(page.locator('#nd-page h1').first()).toHaveText(title);
  await expect(page.locator('#nd-sidebar')).toBeVisible();
}

// A marker on window survives a client-side navigation and is lost on a full reload.
async function markDocument(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __browserCheck: string }).__browserCheck = 'same-document';
  });
}

async function expectSameDocument(page: Page, step: string) {
  const marker = await page.evaluate(() => (window as unknown as { __browserCheck?: string }).__browserCheck);
  expect(marker, `${step}: the page was fully reloaded instead of navigated in the client`).toBe('same-document');
}

test('home page', async ({ page }) => {
  const problems = watch(page);
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  const source = readFileSync(join(process.cwd(), 'app', '(home)', 'page.tsx'), 'utf8');
  const heading = /<h1[^>]*>\s*([^<]+?)\s*<\/h1>/.exec(source)?.[1];
  expect(heading, 'no <h1> found in app/(home)/page.tsx').toBeTruthy();
  await expect(page.locator('h1').first()).toHaveText(heading!);
  await expect(page.locator('a[href="/docs/getting-started"]').first()).toBeVisible();
  await shoot(page, 'home');

  await markDocument(page);
  await page.locator('a[href="/docs/getting-started"]').first().click();
  await expectDocsPage(page, 'getting-started');
  await expectSameDocument(page, 'home -> Get Started');
  expect(problems).toEqual([]);
});

for (const slug of docsPages) {
  const name = slug === '' ? 'docs' : `docs-${slug.replaceAll('/', '-')}`;
  test(`docs page /docs/${slug}`, async ({ page }) => {
    const problems = watch(page);
    const response = await page.goto(slug === '' ? '/docs' : `/docs/${slug}`);
    expect(response?.status()).toBe(200);
    await expectDocsPage(page, slug);

    // Code blocks: the page shows one block per fenced block in the source,
    // every block whose fence names a language is coloured token by token,
    // and a page with highlighted code shows more than one token colour.
    const code = await page.evaluate(() => {
      const colours = new Set<string>();
      const tokenised = [...document.querySelectorAll('#nd-page figure.shiki')].map((block) => {
        const spans = [...block.querySelectorAll('pre code span[style*="--shiki-light"]')];
        for (const span of spans) colours.add(getComputedStyle(span).color);
        return spans.length > 0;
      });
      return { tokenised, colours: colours.size };
    });
    const expected = sourceCodeBlocks(slug);
    expect(code.tokenised.length, 'code blocks on the page against fenced blocks in the source').toBe(expected.length);
    expect(code.tokenised, 'highlighted blocks (true) against fences that name a language').toEqual(expected);
    if (expected.includes(true)) expect(code.colours, 'highlighted code shows one colour only').toBeGreaterThan(1);

    await shoot(page, name);
    expect(problems).toEqual([]);
  });
}

test('in-site navigation', async ({ page }) => {
  const problems = watch(page);
  expect((await page.goto('/docs/agents/overview'))?.status()).toBe(200);
  await expectDocsPage(page, 'agents/overview');
  await settle(page);
  await markDocument(page);

  // 1. A sidebar link.
  await page.locator('#nd-sidebar a[href="/docs/agents/execution"]').click();
  await expectDocsPage(page, 'agents/execution');
  await expectSameDocument(page, 'sidebar link');
  await shoot(page, 'nav-1-sidebar-agents-execution');

  // 2. A link in the body of the page.
  const bodyLink = page.locator('#nd-page .prose a[href^="/docs/"]:not([href*="#"])').first();
  const target = slugOf((await bodyLink.getAttribute('href'))!);
  await bodyLink.click();
  await expectDocsPage(page, target);
  await expectSameDocument(page, 'body link');
  await shoot(page, `nav-2-body-link-${target.replaceAll('/', '-')}`);

  // 3. The browser's back button.
  await page.goBack();
  await expectDocsPage(page, 'agents/execution');
  await expectSameDocument(page, 'back button');

  // 4. A link to an anchor within the page, from the table of contents.
  const tocLink = page.locator('#nd-toc a[href^="#"]').nth(1);
  const hash = (await tocLink.getAttribute('href'))!;
  await tocLink.click();
  await expect(page).toHaveURL((url) => url.pathname === '/docs/agents/execution' && url.hash === hash);
  await expectDocsPage(page, 'agents/execution');
  await expect(page.locator(`[id="${decodeURIComponent(hash.slice(1))}"]`)).toBeInViewport();
  await expectSameDocument(page, 'anchor link');

  // 5. The search dialog.
  // At desktop width the wide search field in the sidebar is the one a reader sees.
  await page.locator('#nd-sidebar button[data-search-full]').click();
  const input = page.getByRole('dialog').getByRole('textbox').or(page.getByRole('dialog').getByRole('combobox'));
  const wanted = sourceTitle('deployment/firecracker');
  await input.first().fill(wanted);
  // Results are options in a listbox; the page's own result is named by its breadcrumb and title.
  const result = page.getByRole('dialog').getByRole('option', { name: new RegExp(`${wanted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expectDocsPage(page, 'deployment/firecracker');
  await expectSameDocument(page, 'search result');
  await shoot(page, 'nav-5-search-deployment-firecracker');

  expect(problems).toEqual([]);
});

test('a page that does not exist', async ({ page }) => {
  const missing = '/docs/browser-check-no-such-page';
  // The 404 of the document itself is the expected answer here, and Chromium
  // reports it as a console error; everything else must still load cleanly.
  const problems = watch(page, (url) => new URL(url).pathname === missing);
  const response = await page.goto(missing);
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1').first()).toHaveText('404');
  await expect(page.getByText('This page could not be found.')).toBeVisible();
  await shoot(page, 'not-found');
  expect(problems.filter((p) => !p.includes('status of 404'))).toEqual([]);
});
