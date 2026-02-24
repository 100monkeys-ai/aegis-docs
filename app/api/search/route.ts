import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const { staticGET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
});

export const GET = staticGET;
