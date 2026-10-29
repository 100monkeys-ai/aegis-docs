import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = false;

// Every docs page the content source serves, at its absolute address. No page
// carries a date in its frontmatter, so lastmod is the build time.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${siteUrl}/`, lastModified },
    ...source.getPages().map((page) => ({
      url: `${siteUrl}${page.url}`,
      lastModified,
    })),
  ];
}
