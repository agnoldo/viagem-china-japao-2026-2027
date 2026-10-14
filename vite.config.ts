import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { postsPlugin } from './scripts/posts-plugin';
export default defineConfig({
  base: process.env.BASE_PATH || './',
  plugins: [
    react(),
    postsPlugin(process.env.POSTS_DIR ?? 'data/posts'),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        id: './',
        name: 'China e Japão 2027',
        short_name: 'China e Japão 2027',
        description: 'Roteiro, endereços e logística da família, disponíveis offline.',
        lang: 'pt-BR',
        theme_color: '#193e38',
        background_color: '#f7f7f2',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,webp,webmanifest}'],
        maximumFileSizeToCacheInBytes: 2_000_000,
      },
    }),
  ],
});
