import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cross-origin isolation is required for the multi-threaded Stockfish WASM
// build (pthreads need SharedArrayBuffer). Both dev server and preview send
// the headers; a plain static file server will silently fall back to the
// single-threaded build (see src/core/engine.ts).
const crossOriginIsolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2021',
    chunkSizeWarningLimit: 1500,
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 5173,
    headers: crossOriginIsolation,
  },
  preview: {
    port: 4173,
    headers: crossOriginIsolation,
  },
});
