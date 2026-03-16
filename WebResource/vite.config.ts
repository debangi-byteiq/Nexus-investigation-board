import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    // Prevent code splitting to ensure everything fits in one .html file
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
});
