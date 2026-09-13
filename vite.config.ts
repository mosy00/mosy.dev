import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
  },
  build: {
    target: 'es2022',
    // three.js core alone is ~520 kB minified — that's expected, not a smell.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Keep the 3D/animation libs in their own cacheable chunks.
        manualChunks: {
          three: ['three'],
          vendor: ['gsap', 'gsap/ScrollTrigger', 'lenis'],
        },
      },
    },
  },
});

