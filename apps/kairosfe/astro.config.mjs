import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // We'll add our own base styles
    }),
  ],
  output: 'hybrid',
  adapter: vercel(),
  vite: {
    ssr: {
      noExternal: ['@kairos/ui', '@kairos/shared'],
    },
  },
});
