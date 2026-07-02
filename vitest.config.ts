import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

// vite.config is a callback config (it needs `command` to pick the base), so
// resolve it with the same env before merging the test config in.
export default defineConfig((configEnv) =>
  mergeConfig(typeof viteConfig === 'function' ? viteConfig(configEnv) : viteConfig, {
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      passWithNoTests: true
    }
  })
)
