import { afterEach, expect, test } from 'bun:test'
import { createApp, nextTick } from 'vue'
import { createPinia, disposePinia } from 'pinia'
import type { Pinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import crypto from '../src/plugins/crypto'
import { createInitialState, decodeSavedState, getSaveLoadError, useMainStore } from '../src/plugins/store'
import legacySave from './fixtures/legacy-save.json'

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>()
  readonly writes: Array<{ key: string; value: string }> = []

  get length(): number { return this.values.size }
  clear(): void { this.values.clear() }
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null }
  removeItem(key: string): void { this.values.delete(key) }
  setItem(key: string, value: string): void {
    this.values.set(key, value)
    this.writes.push({ key, value })
  }
}

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
const installed: Pinia[] = []

afterEach(() => {
  for (const pinia of installed.splice(0)) disposePinia(pinia)
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

const hydrate = (storage: MemoryStorage) => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  const pinia = createPinia().use(piniaPluginPersistedstate)
  installed.push(pinia)
  // Installing into a real app activates Pinia's real persistence plugin; no
  // browser mount is needed to exercise hydration and mutation subscriptions.
  createApp({}).use(pinia)
  return { pinia, store: useMainStore(pinia) }
}

test('failed hydration preserves the original save through automatic and explicit persistence', async () => {
  const { boss, player } = createInitialState()
  const invalidPlayer = JSON.stringify({
    boss: crypto.encryption(boss),
    player: crypto.encryption({ ...player, attack: -100 })
  })
  for (const original of ['{invalid JSON', invalidPlayer, '']) {
    const storage = new MemoryStorage()
    storage.values.set('vuex', original)
    const { pinia, store } = hydrate(storage)
    expect(getSaveLoadError()).toBeInstanceOf(Error)
    expect(store.player.attack).toBe(10)

    store.player.age++
    await nextTick()
    store.$persist()

    expect(storage.getItem('vuex')).toBe(original)
    expect(storage.writes).toEqual([])
    disposePinia(pinia)
  }
})

test('valid legacy hydration keeps automatic encrypted saving active', async () => {
  const storage = new MemoryStorage()
  storage.values.set('vuex', JSON.stringify(legacySave))
  const { store } = hydrate(storage)
  const originalAge = store.player.age

  expect(getSaveLoadError()).toBeNull()
  expect(store.player.props.money).toBe(117)
  store.player.age++
  await nextTick()

  expect(storage.writes).toHaveLength(1)
  const saved = storage.getItem('vuex')
  expect(saved).not.toBeNull()
  const restored = decodeSavedState(saved ?? '')
  expect(restored.player.age).toBe(originalAge + 1)
  expect(restored.player.props.money).toBe(117)
  expect(restored.player.inventory[0]?.strengthen).toBe(0)
})

test('a valid direct import survives until reload and resumes automatic saving after hydration', async () => {
  const storage = new MemoryStorage()
  storage.values.set('vuex', '{invalid JSON')
  const failed = hydrate(storage)
  expect(getSaveLoadError()).toBeInstanceOf(Error)

  // This is the same direct write followed by reload used by manual import.
  const imported = JSON.stringify(legacySave)
  decodeSavedState(imported)
  storage.setItem('vuex', imported)
  failed.store.player.age++
  await nextTick()
  expect(storage.getItem('vuex')).toBe(imported)
  expect(storage.writes).toHaveLength(1)
  disposePinia(failed.pinia)

  const reloaded = hydrate(storage)
  expect(getSaveLoadError()).toBeNull()
  expect(reloaded.store.player.props.money).toBe(117)
  reloaded.store.player.age++
  await nextTick()

  expect(storage.writes).toHaveLength(2)
  const restored = decodeSavedState(storage.getItem('vuex') ?? '')
  expect(restored.player.age).toBe(reloaded.store.player.age)
  expect(restored.player.props.money).toBe(117)
})

test('a new game without a stored save can still save normally', async () => {
  const storage = new MemoryStorage()
  const { store } = hydrate(storage)
  expect(getSaveLoadError()).toBeNull()
  store.player.age++
  await nextTick()

  expect(storage.writes).toHaveLength(1)
  expect(decodeSavedState(storage.getItem('vuex') ?? '').player.age).toBe(2)
})
