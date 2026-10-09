import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const applicationBasePath = '/mental-unloader/'

export default defineConfig({
  base: applicationBasePath,
  plugins: [react()],
})
