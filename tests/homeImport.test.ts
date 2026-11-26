import assert from 'node:assert/strict'
import { test } from 'bun:test'
import type { Ref } from 'vue'
import type { UploadRequestOptions } from 'element-plus'
import crypto from '../src/plugins/crypto'
import { createInitialState, decodeSavedState } from '../src/plugins/store'
import { loadView } from './helpers/load-view'

interface ImportBindings {
  importData(options: UploadRequestOptions): Promise<void>
  err: Ref<string>
  errBox: Ref<boolean>
}

// FileReader remains the browser boundary. The component still validates the
// real encrypted JSON with the production decoder before replacing a save.
class TextFileReader {
  result: string | null = null
  error: DOMException | null = null
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  async readAsText(file: File): Promise<void> {
    try {
      this.result = await file.text()
      this.onload?.()
    } catch {
      this.error = new DOMException('Unable to read file')
      this.onerror?.()
    }
  }
}

const uploadOptions = (contents: string): UploadRequestOptions => ({
  action: '#',
  method: 'post',
  filename: 'file',
  file: Object.assign(new File([contents], 'save.json', { type: 'application/json' }), { uid: 1 }),
  data: {},
  headers: {},
  withCredentials: false,
  onProgress() {},
  onError() {},
  onSuccess() {}
})

const createImport = async () => {
  const saved = new Map<string, string>([['vuex', 'previous-save']])
  const notifications: unknown[] = []
  let reloadCount = 0
  const component = await loadView<ImportBindings>('src/views/homePage.vue', {
    imports: {
      vue: { watch() {}, onMounted() {} },
      'vue-router': { useRouter: () => ({ push() {} }) },
      '@/plugins/store': { useMainStore: createInitialState, decodeSavedState },
      '@/plugins/game': { gameNotifys: (notification: unknown) => notifications.push(notification) }
    },
    globals: {
      FileReader: TextFileReader,
      localStorage: { setItem: (key: string, value: string) => saved.set(key, value) },
      location: { reload: () => reloadCount++ }
    }
  })
  return {
    home: component.setup({}, { expose() {} }),
    saved,
    notifications,
    reloadCount: () => reloadCount
  }
}

test('save import rejects malformed JSON without replacing the existing save', async () => {
  const { home, saved, notifications, reloadCount } = await createImport()

  await assert.rejects(home.importData(uploadOptions('{invalid JSON')))

  assert.equal(saved.get('vuex'), 'previous-save')
  assert.equal(reloadCount(), 0)
  assert.equal(home.errBox.value, true)
  assert.ok(home.err.value.length > 0)
  assert.equal(notifications.length, 1)
})

test('save import rejects encrypted invalid player data before writing storage', async () => {
  const { home, saved, reloadCount } = await createImport()
  const { boss, player } = createInitialState()
  const contents = JSON.stringify({
    boss: crypto.encryption(boss),
    player: crypto.encryption({ ...player, props: { ...player.props, money: -1 } })
  })

  await assert.rejects(home.importData(uploadOptions(contents)), /props.money/)

  assert.equal(saved.get('vuex'), 'previous-save')
  assert.equal(reloadCount(), 0)
})

test('save import accepts valid legacy encrypted saves and reloads after writing', async () => {
  const { home, saved, notifications, reloadCount } = await createImport()
  const { boss, player } = createInitialState()
  const legacyPlayer: Record<string, unknown> = { ...player, cultivation: 600, jishaNum: null }
  delete legacyPlayer.checkinDays
  const contents = JSON.stringify({ boss: crypto.encryption(boss), player: crypto.encryption(legacyPlayer) })

  await home.importData(uploadOptions(contents))

  assert.equal(saved.get('vuex'), contents)
  assert.equal(reloadCount(), 1)
  assert.equal(home.errBox.value, false)
  assert.equal(notifications.length, 0)
  const restored = decodeSavedState(contents)
  assert.equal(restored.player.cultivation, 600)
  assert.equal(restored.player.jishaNum, 0)
  assert.equal(restored.player.checkinDays, 0)
})
