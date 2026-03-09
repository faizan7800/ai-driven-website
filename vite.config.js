import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy your staging backend — fixes CORS for license plate lookups
      '/api/vehicle': {
        target: 'https://stagging-fori-hayk-backend.fori.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vehicle/, ''),
        secure: true,
      },
      // Proxy OpenAI — fixes CORS + keeps your API key off the browser
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        secure: true,
      },
    },
  },
})
