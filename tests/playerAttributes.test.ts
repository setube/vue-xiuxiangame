import assert from 'node:assert/strict'
import { test } from 'bun:test'
import type { Ref } from 'vue'
import type { Equipment, EquipmentType, Player } from '../src/types/game'
import crypto from '../src/plugins/crypto'
import { createInitialState, decodeSavedState } from '../src/plugins/store'
import { assertPlayer } from '../src/utils/assert'
import { loadView } from './helpers/load-view'

interface EquipmentBindings {
  player: Ref<Player>
  equipItem(id: number, type: EquipmentType): void
  equipmentClose(type: EquipmentType): void
}

const equipment = (id: number, type: EquipmentType, rate: number): Equipment => ({
  id, type, name: `equipment-${id}`, level: 1, score: 0, strengthen: 0, lock: false, quality: 'info',
  dodge: rate, critical: rate, attack: 0, health: 0, defense: 0,
  initial: { dodge: rate, critical: rate, attack: 0, health: 0, defense: 0 }
})

const createHome = async (baseRate = 0) => {
  const state = createInitialState()
  Object.assign(state.player, {
    level: 1, dodge: baseRate, critical: baseRate,
    inventory: [equipment(1, 'weapon', 0.01), equipment(2, 'armor', 0.02)]
  })
  const component = await loadView<EquipmentBindings>('src/views/homePage.vue', {
    imports: {
      vue: { watch() {}, onMounted() {} },
      'vue-router': { useRouter: () => ({ push() {} }) },
      '@/plugins/store': { useMainStore: () => state, decodeSavedState },
      '@/plugins/game': { gameNotifys() {} }
    },
    globals: { console: { log() {} } }
  })
  return { state, home: component.setup({}, { expose() {} }) }
}

test('equipping and removing fractional bonuses clears only near-zero rate residue', async () => {
  const { home, state } = await createHome()

  home.equipItem(1, 'weapon')
  home.equipItem(2, 'armor')
  home.equipmentClose('weapon')
  home.equipmentClose('armor')

  assert.equal(home.player.value.dodge, 0)
  assert.equal(home.player.value.critical, 0)
  assertPlayer(home.player.value)
  const restored = decodeSavedState(JSON.stringify({
    boss: crypto.encryption(state.boss), player: crypto.encryption(home.player.value)
  }))
  assert.equal(restored.player.dodge, 0)
  assert.equal(restored.player.critical, 0)
})

test('equipment changes retain small rate values outside the near-zero tolerance', async () => {
  const baseRate = 5e-12
  const { home } = await createHome(baseRate)

  home.equipItem(1, 'weapon')
  home.equipmentClose('weapon')

  const expected = baseRate + 0.01 - 0.01
  assert.equal(home.player.value.dodge, expected)
  assert.equal(home.player.value.critical, expected)
  assert.ok(home.player.value.dodge > 1e-12)
  assertPlayer(home.player.value)
})
