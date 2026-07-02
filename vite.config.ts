import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Short commit hash of the build, injected as __COMMIT_HASH__ and shown in the
// footer. Falls back to the CI-provided SHA, then 'unknown' outside a checkout.
function commitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return process.env.GITHUB_SHA?.slice(0, 7) ?? 'unknown'
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Deployed to the GitHub Pages project subpath https://usb-descryptor.github.io/usb-descryptor/.
  // Only the production build needs the prefix; the dev server stays at '/'.
  base: command === 'build' ? '/usb-descryptor/' : '/',
  plugins: [
    vue(),
  ],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash())
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
}))
