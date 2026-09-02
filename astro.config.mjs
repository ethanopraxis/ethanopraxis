import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://ethanopraxis.github.io/ethanopraxis',
  base: process.env.BASE_PATH ?? '/',
  output: 'static',
  integrations: [sitemap()],
});
