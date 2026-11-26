import assert from 'node:assert/strict'
import { test } from 'bun:test'
import { nextTick, type Ref } from 'vue'
import type { Player } from '../src/types/game'
import { createInitialState } from '../src/plugins/store'
import { loadView } from './helpers/load-view'

test('saved dark mode is applied immediately and toggling preserves other document classes', async () => {
  const store = createInitialState()
  store.player.dark = true
  const classes = new Set(['external-class'])
  const component = await loadView<{ player: Ref<Player> }>('src/App.vue', {
    imports: {
      vue: { onMounted() {} },
      'vue-router': { useRoute: () => ({ path: '/home' }) },
      './plugins/store': { useMainStore: () => store }
    },
    globals: {
      document: {
        documentElement: {
          classList: {
            toggle(name: string, enabled: boolean) {
              if (enabled) classes.add(name)
              else classes.delete(name)
            }
          }
        }
      }
    }
  })
  const app = component.setup({}, { expose() {} })
  assert.equal(classes.has('dark'), true)
  assert.equal(classes.has('external-class'), true)

  app.player.value.dark = false
  await nextTick()

  assert.equal(classes.has('dark'), false)
  assert.equal(classes.has('external-class'), true)
})
