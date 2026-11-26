import assert from 'node:assert/strict'
import { test } from 'bun:test'
import type { Ref } from 'vue'
import type { Pet, PetSlot, Player } from '../src/types/game'
import crypto from '../src/plugins/crypto'
import { createInitialState, decodeSavedState } from '../src/plugins/store'
import { assertPet, assertPlayer } from '../src/utils/assert'
import { loadView } from './helpers/load-view'

interface PetBindings {
  player: Ref<Player>
  petRootBone: Ref<boolean>
  petUpgrade(item: PetSlot): void
}

const createPetHome = async (rootBone: number, cultivateDan: number, confirm = () => Promise.resolve()) => {
  const state = createInitialState()
  const pet: Pet = {
    id: 1, name: 'test pet', level: 1, score: 300, lock: false,
    dodge: 0, attack: 100, health: 100, critical: 0, defense: 100,
    initial: { dodge: 0, attack: 100, health: 100, critical: 0, defense: 100, rootBone: 1 },
    rootBone: 1, favorability: 0, reincarnation: 0
  }
  Object.assign(state.player, { pet, attack: 110, health: 200, maxHealth: 200, defense: 110 })
  Object.assign(state.player.props, { rootBone, cultivateDan })
  const notifications: unknown[] = []
  const component = await loadView<PetBindings>('src/views/homePage.vue', {
    imports: {
      vue: { watch() {}, onMounted() {} },
      'vue-router': { useRouter: () => ({ push() {} }) },
      'element-plus': { ElMessageBox: { confirm } },
      '@/plugins/store': { useMainStore: () => state, decodeSavedState },
      '@/plugins/game': { maxLv: 144, gameNotifys: (value: unknown) => notifications.push(value) }
    }
  })
  const home = component.setup({}, { expose() {} })
  home.petRootBone.value = true
  return { home, state, notifications }
}

const confirmUpgrade = async (home: PetBindings) => {
  home.petUpgrade(home.player.value.pet)
  await Promise.resolve()
  await Promise.resolve()
}

test('pet cultivation spends the pre-upgrade root-bone cost with exact resources', async () => {
  const { home, state } = await createPetHome(1, 201)

  await confirmUpgrade(home)

  assert.equal(home.player.value.props.rootBone, 0)
  assert.equal(home.player.value.props.cultivateDan, 0)
  assert.equal(home.player.value.pet.rootBone, 2)
  assert.equal(home.player.value.pet.attack, 200)
  assert.equal(home.player.value.attack, 210)
  assertPet(home.player.value.pet)
  assertPlayer(home.player.value)
  const restored = decodeSavedState(JSON.stringify({
    boss: crypto.encryption(state.boss), player: crypto.encryption(home.player.value)
  }))
  assert.equal(restored.player.pet.rootBone, 2)
  assert.equal(restored.player.props.rootBone, 0)
})

test('consecutive root-bone upgrades keep pet and player gains nonnegative and saves readable', async () => {
  const { home, state } = await createPetHome(6, 1203)

  for (let count = 0; count < 3; count++) await confirmUpgrade(home)

  assert.equal(home.player.value.props.rootBone, 0)
  assert.equal(home.player.value.props.cultivateDan, 0)
  assert.equal(home.player.value.pet.rootBone, 4)
  assert.equal(home.player.value.pet.level, 4)
  assert.equal(home.player.value.pet.attack, 400)
  assert.equal(home.player.value.pet.health, 400)
  assert.equal(home.player.value.pet.defense, 400)
  assert.equal(home.player.value.attack, 410)
  assert.equal(home.player.value.health, 500)
  assert.equal(home.player.value.maxHealth, 500)
  assert.equal(home.player.value.defense, 410)
  assertPet(home.player.value.pet)
  assertPlayer(home.player.value)
  const restored = decodeSavedState(JSON.stringify({
    boss: crypto.encryption(state.boss), player: crypto.encryption(home.player.value)
  }))
  assert.equal(restored.player.pet.attack, 400)
  assert.equal(restored.player.attack, 410)
})

test('pet cultivation rechecks material availability when confirmation completes', async () => {
  let resolveConfirmation = () => {}
  const pending = new Promise<void>(resolve => { resolveConfirmation = resolve })
  const { home, notifications } = await createPetHome(1, 201, () => pending)

  home.petUpgrade(home.player.value.pet)
  home.player.value.props.rootBone = 0
  resolveConfirmation()
  await Promise.resolve()
  await Promise.resolve()

  assert.equal(home.player.value.pet.level, 1)
  assert.equal(home.player.value.pet.rootBone, 1)
  assert.equal(home.player.value.props.rootBone, 0)
  assert.equal(home.player.value.props.cultivateDan, 201)
  assert.equal(notifications.length, 1)
  assertPlayer(home.player.value)
})
