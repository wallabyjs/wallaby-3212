import react from '@vitejs/plugin-react'
import { config } from 'dotenv'
import * as path from 'path'
import { defineConfig } from 'vite'
import { comlink } from 'vite-plugin-comlink'
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'
import glsl from 'vite-plugin-glsl'

config()

const env = process.env.NODE_ENV || 'production'
const devPort = (process.env.DEV_PORT || 3009) as number
const apiPort = (process.env.API_PORT || 9009) as number
const apiServer = process.env[`${env.toUpperCase()}_API_SERVER`] || process.env.API_SERVER || ''
const testEnv = process.env.TEST_ENV || ''

// https://vitejs.dev/config/
/** @ts-ignore */
export default defineConfig(({ command, mode }) => {
  console.info(command, mode)
  const config = {
    clearScreen: false,
    plugins:     [
      react({
        jsxRuntime: 'classic',
      }),
      comlink(),
      glsl(),
      crossOriginIsolation(),
    ],
    server: {
      host:       '0.0.0.0', // listen on all addresses (needed for iPad testing)
      port:       devPort,
      strictPort: true,
    },
    css: {
      devSourcemap: true,
    },
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
    build: {
      sourcemap: true,
    },
    resolve: {
      alias: {
        src:          path.resolve(__dirname, './src'),
        'src-server': path.resolve(__dirname, './../d2p-server/src'),
      },
    },
    define: {
      'process.env': {
        API_SERVER:   apiServer,
        SCENE_HOST:   process.env.SCENE_HOST,
        SCENE_PATH:   process.env.SCENE_PATH,
        MONITOR_PORT: process.env.MONITOR_PORT || 3012,
        SOCKET_PORT:  process.env.SOCKET_PORT || 3011,
      },
      VERSION:  JSON.stringify(process.env.npm_package_version),
      API_PORT: apiPort,
    },
    worker: {
      plugins: [
        comlink(),
      ],
    },
    test: {
      coverage: {
        provider: 'istanbul', // or 'c8'
      },
      environment: 'happy-dom',
      exclude:     ['**/manual_tests/**', '**/node_modules/**'],
      globals:     true,
      setupFiles:  ['./src/__tests__/setup-vitest.ts'],
      ...configureReporter(),
    },
  }

  if (command !== 'build' && mode !== 'test' && testEnv === 'wallaby') {
    config.define['global'] = globalThis
  }

  return config

  function configureReporter() {
    const outputDir = process.env.JEST_JUNIT_OUTPUT_DIR ?? './'
    return process.env.TEST_MODE === 'ci'
      ? {
        reporter:   'junit',
        outputFile: `${outputDir}/client-test-results.xml`,
      }
      : {}
  }
})
