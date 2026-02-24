# AEGIS Docs

Public documentation site for the AEGIS Orchestrator, built with [Fumadocs](https://fumadocs.dev) on Next.js and deployed to Cloudflare Pages as a static export.

---

## Local Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site. Content lives in `content/docs/` as `.mdx` files.

---

## Building

The site is exported as a fully static site (`output: 'export'` in `next.config.ts`). The build writes to the `out/` directory:

```bash
npm run build
```

To validate TypeScript and MDX types before building:

```bash
npm run types:check
```

---

## Deploying to Cloudflare Pages

### Option 1: Wrangler CLI (recommended for CI / manual deploys)

Requires [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) v3+ and a Cloudflare account with Pages access.

```bash
# Install Wrangler globally if not already installed
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Build then deploy
npm run build
wrangler pages deploy
```

`wrangler.toml` is already configured:

```toml
name = "aegis-docs"
compatibility_date = "2025-01-01"
pages_build_output_dir = "out"
```

Wrangler reads these values automatically — no extra flags needed.

### Option 2: Cloudflare Pages Dashboard (Git integration)

1. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Select the `aegis-docs` repository.
3. Set the following build settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Next.js (Static HTML Export) |
   | Build command | `npm run build` |
   | Build output directory | `out` |
   | Node.js version | `20` (set in Environment Variables as `NODE_VERSION=20`) |

4. Click **Save and Deploy**.

Subsequent pushes to `main` trigger automatic deployments.

### Option 3: GitHub Actions

Example workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy out --project-name=aegis-docs
```

Add `CLOUDFLARE_API_TOKEN` (with **Cloudflare Pages: Edit** permission) to the repository secrets.

---

## Project Structure

| Path | Description |
| --- | --- |
| `content/docs/` | All MDX documentation content |
| `content/docs/meta.json` | Top-level navigation order |
| `app/docs/` | Next.js documentation layout and page routes |
| `app/(home)/` | Landing page route group |
| `lib/source.ts` | Fumadocs content source adapter |
| `source.config.ts` | Fumadocs MDX configuration and frontmatter schema |
| `wrangler.toml` | Cloudflare Pages deployment configuration |

---

## Learn More

- [Fumadocs Documentation](https://fumadocs.dev/docs/mdx)
- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
