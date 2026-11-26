import { defineStore } from 'pinia'
import type { StorageLike } from 'pinia-plugin-persistedstate'
import crypto from '@/plugins/crypto'
import type { Equipment, GameState, Player } from '@/types/game'
import { assertBoss, assertEquipment, assertPlayer, assertRecord, assertString } from '@/utils/assert'

export const createInitialState = (): GameState => ({
    // boss属性
    boss: {
      name: '',
      text: '',
      time: 0,
      desc: '',
      level: 0,
      dodge: 0,
      attack: 0,
      health: 0,
      conquer: false,
      defense: 0,
      critical: 0,
      maxhealth: 0
    },
    // 玩家属性
    player: {
      zc: false,
      age: 1,
      pet: {},
      time: 0,
      name: '玩家',
      dark: false,
      npcs: [],
      wife: {},
      pets: [],
      wifes: [],
      props: {
        money: 0,
        flying: 0,
        qingyuan: 0,
        rootBone: 0,
        currency: 0,
        cultivateDan: 0,
        strengtheningStone: 0
      },
      score: 0,
      level: 0,
      dodge: 0,
      points: 0,
      attack: 10,
      health: 100,
      critical: 0,
      defense: 10,
      taskNum: 0,
      jishaNum: 0,
      version: 0.8,
      currency: 0,
      maxHealth: 100,
      inventory: [],
      isNewbie: false,
      shopData: [],
      equipment: {
        sutra: {},
        armor: {},
        weapon: {},
        accessory: {}
      },
      achievement: {
        pet: [],
        monster: [],
        equipment: []
      },
      script: '',
      cultivation: 0,
      currentTitle: null,
      reincarnation: 0,
      maxCultivation: 100,
      backpackCapacity: 50,
      sellingEquipmentData: [],
      highestTowerFloor: 1,
      rewardedTowerFloors: [],
      nextGameTimes: {
        rps: null,
        ticTacToe: null,
        dice: null,
        fortune: null,
        secretrealm: 0,
        gamblingStone: null
      },
      gameWins: 0,
      gameLosses: 0,
      checkinDays: 0,
      checkinStreak: 0,
      lastCheckinDate: null,
      fortuneTellingDate: null,
      checkedInToday: false
    },
    // 怪物信息
    monster: {
      name: '',
      // 气血
      health: 0,
      // 攻击
      attack: 0,
      // 防御
      defense: 0,
      // 闪避率
      dodge: 0,
      // 暴击
      critical: 0
    },
    mapData: {
      y: 0,
      x: 0,
      map: []
    },
    mapScroll: 0,
    fishingMap: []
})

// Optional fields were omitted by old equipment generators. Normalize those
// specific legacy omissions, then validate the complete model before hydration.
const decodeEquipment = (value: unknown): Equipment => {
  assertRecord(value, 'Saved equipment')
  const equipment = { strengthen: 0, lock: false, ...value }
  assertEquipment(equipment)
  return equipment
}

export const normalizePlayer = (value: unknown): Player => {
  assertRecord(value, 'Saved player')
  const defaults = createInitialState().player
  assertRecord(value.props, 'Saved player.props')
  assertRecord(value.equipment, 'Saved player.equipment')
  const equipment = { ...defaults.equipment }
  for (const type of ['weapon', 'armor', 'accessory', 'sutra'] as const) {
    const item = value.equipment[type]
    assertRecord(item, `Saved equipment.${type}`)
    equipment[type] = Object.keys(item).length ? decodeEquipment(item) : {}
  }
  const inventory = value.inventory
  if (!Array.isArray(inventory)) throw new Error('Saved inventory must be an array')
  const shopData = value.shopData === undefined ? [] : value.shopData
  if (!Array.isArray(shopData)) throw new Error('Saved shop must be an array')
  const normalizedShop = shopData.map(group => {
    assertRecord(group, 'Saved shop group')
    if (!Array.isArray(group.data)) throw new Error('Saved shop equipment must be an array')
    return { ...group, data: group.data.map(decodeEquipment) }
  })
  const nextGameTimes = value.nextGameTimes === undefined ? {} : value.nextGameTimes
  assertRecord(nextGameTimes, 'Saved next game times')
  const props = { ...defaults.props, ...value.props }
  // Version 0.8 checked the pre-upgrade root-bone cost but deducted it after
  // incrementing the pet's root bone. A valid exact-balance purchase left -1.
  if (value.version === 0.8 && props.rootBone === -1) props.rootBone = 0
  const player = {
    ...defaults, ...value,
    props,
    nextGameTimes: { ...defaults.nextGameTimes, ...nextGameTimes },
    // Older sweeps incremented an absent counter; JSON encoded its NaN as null.
    jishaNum: value.jishaNum ?? defaults.jishaNum,
    equipment, inventory: inventory.map(decodeEquipment), shopData: normalizedShop
  }
  // Adding and removing decimal equipment bonuses can leave tiny negative
  // floating-point residues. Larger negatives remain invalid save data.
  for (const key of ['dodge', 'critical'] as const) {
    const rate = player[key]
    if (typeof rate === 'number' && rate < 0 && rate >= -1e-12) player[key] = 0
  }
  assertPlayer(player)
  return player
}

export const decodeSavedState = (value: string): Pick<GameState, 'boss' | 'player'> => {
  const saved: unknown = JSON.parse(value)
  assertRecord(saved, 'Saved state')
  assertString(saved.boss, 'Encrypted boss')
  assertString(saved.player, 'Encrypted player')
  const boss = crypto.decryption(saved.boss)
  assertBoss(boss)
  return { boss, player: normalizePlayer(crypto.decryption(saved.player)) }
}

let saveLoadError: Error | null = null

export const getSaveLoadError = (): Error | null => saveLoadError

const retainSaveLoadError = (error: unknown): Error => {
  saveLoadError = error instanceof Error ? error : new Error('Unable to load local save', { cause: error })
  return saveLoadError
}

// The persistence plugin subscribes even when hydration fails. Keep its writes
// behind this boundary so the first timer tick cannot replace an unreadable
// save with initial state. Manual imports validate and replace localStorage
// directly, then reload the app to hydrate and resume automatic saving.
const protectedSaveStorage: StorageLike = {
  getItem(key) {
    try {
      const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(key)
      saveLoadError = null
      if (saved === '') throw new Error('Local save must not be empty')
      return saved
    } catch (error) {
      throw retainSaveLoadError(error)
    }
  },
  setItem(key, value) {
    if (!saveLoadError && typeof localStorage !== 'undefined') localStorage.setItem(key, value)
  }
}

export const useMainStore = defineStore('main', {
  state: createInitialState,
  persist: {
    key: 'vuex',
    pick: ['boss', 'player'],
    storage: protectedSaveStorage,
    serializer: {
      serialize: state => JSON.stringify({ boss: crypto.encryption(state.boss), player: crypto.encryption(state.player) }),
      deserialize: value => {
        try {
          return decodeSavedState(value)
        } catch (error) {
          throw retainSaveLoadError(error)
        }
      }
    }
  }
})
