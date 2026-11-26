import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { VitePWA } from 'vite-plugin-pwa'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { defineConfig } from 'vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vitePluginBundleObfuscator from 'vite-plugin-bundle-obfuscator'

export default defineConfig({
  base: './',
  build: {
    minify: 'terser',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'vendor', test: /node_modules/ }]
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: assetInfo => {
          if (assetInfo.names.some(name => name.endsWith('.ico'))) return '[name].[ext]'
          return 'assets/[ext]/[name]-[hash].[ext]'
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  plugins: [
    vue(),
    Icons({
      autoInstall: false
    }),
    VitePWA({
      manifest: {
        name: '我的文字修仙全靠刷',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        short_name: '文字修仙',
        description: '文字游戏: 我的文字修仙全靠刷',
        theme_color: '#4d4d4d'
      },
      devOptions: {
        enabled: false
      },
      registerType: 'autoUpdate'
    }),
    AutoImport({
      dts: 'src/auto-imports.d.ts',
      resolvers: [
        IconsResolver({
          prefix: 'Icon'
        }),
        ElementPlusResolver()
      ]
    }),
    Components({
      dts: 'src/components.d.ts',
      resolvers: [
        IconsResolver({
          enabledCollections: ['ep']
        }),
        ElementPlusResolver()
      ]
    }),
    vitePluginBundleObfuscator({
      log: false,
      enable: true,
      options: {
        compact: true,
        stringArray: true,
        renameGlobals: false,
        selfDefending: false,
        debugProtection: false,
        stringArrayRotate: true,
        deadCodeInjection: false,
        stringArrayEncoding: ['none'],
        disableConsoleOutput: true,
        stringArrayThreshold: 0.75,
        controlFlowFlattening: false,
        unicodeEscapeSequence: true,
        identifierNamesGenerator: 'hexadecimal'
      },
      excludes: ['router.ts'],
      autoExcludeNodeModules: true
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  logLevel: 'error'
})
