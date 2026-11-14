import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// Relative base keeps the static build portable, including GitHub Pages
// project sites such as /web-dev-explorer/.
export default defineConfig({
  base: './',
  plugins: [svelte()],
})
