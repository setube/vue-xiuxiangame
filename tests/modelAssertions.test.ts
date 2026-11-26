import { afterEach, expect, spyOn, test } from 'bun:test'
import { createInitialState, decodeSavedState, normalizePlayer } from '../src/plugins/store'
import crypto from '../src/plugins/crypto'
import legacySave from './fixtures/legacy-save.json'
import combat from '../src/plugins/combat'
import equip from '../src/plugins/equip'
import monsters from '../src/plugins/monster'
import boss from '../src/plugins/boss'
import shop from '../src/plugins/shop'
import MinHeap from '../src/plugins/minheap'
import {
  assertBoss, assertCombatant, assertEquipment, assertFiniteNumber, assertPlayer,
  isEquipment, isEquipmentType, isQuality
} from '../src/utils/assert'

afterEach(() => {
  // Every deterministic random override is scoped to the test that needs it.
  const random = Math.random
  if ('mockRestore' in random && typeof random.mockRestore === 'function') random.mockRestore()
})

test('the initial state satisfies the persisted player and boss contracts', () => {
  const state = createInitialState()
  expect(() => assertPlayer(state.player)).not.toThrow()
  expect(() => assertBoss(state.boss)).not.toThrow()
  expect(state.player.version).toBe(0.8)
  expect(state.player.jishaNum).toBe(0)
  expect(state.player.nextGameTimes.ticTacToe).toBeNull()
  const another = createInitialState()
  state.player.props.money = 100
  expect(another.player.props.money).toBe(0)
})

test('finite number and combat assertions reject malformed runtime inputs', () => {
  for (const value of [NaN, Infinity, -Infinity, '10', null, undefined]) {
    expect(() => assertFiniteNumber(value, 'amount')).toThrow('amount must be a finite number')
  }
  expect(() => assertFiniteNumber(0)).not.toThrow()
  expect(() => assertFiniteNumber(1e20)).not.toThrow()
  expect(() => assertCombatant({ attack: 1 })).toThrow()
  const player = createInitialState().player
  expect(() => combat.calculateDamage({ ...player, attack: NaN }, player)).toThrow('attacker.attack')
  expect(() => combat.executeCombatRound(player, { ...player, health: -1 })).toThrow('defender.health')
})

test('equipment guards validate generated items and reject invalid types and stats', () => {
  const item = equip.equip_Weapons(1)
  expect(() => assertEquipment(item)).not.toThrow()
  expect(isEquipment(item)).toBe(true)
  expect(isEquipment({})).toBe(false)
  expect(isEquipment({ ...item, type: 'unknown' })).toBe(false)
  expect(isEquipment({ ...item, quality: 'unknown' })).toBe(false)
  expect(isEquipment({ ...item, attack: Infinity })).toBe(false)
  expect(isEquipmentType('armor')).toBe(true)
  expect(isEquipmentType('constructor')).toBe(false)
  expect(isQuality('pink')).toBe(true)
  expect(isQuality('unknown')).toBe(false)
  expect(() => assertEquipment(boss.boss_Equip(1))).not.toThrow()
  for (const group of shop.drawPrize(1)) {
    for (const equipment of group.data) expect(() => assertEquipment(equipment)).not.toThrow()
  }
})

test('legacy normalization fills known omissions while preserving equipment and currency', () => {
  const state = createInitialState()
  const item = equip.equip_Weapons(1)
  item.strengthen = 7
  const { strengthen: _strengthen, lock: _lock, ...legacyItem } = item
  const { ticTacToe: _ticTacToe, ...legacyTimes } = state.player.nextGameTimes
  const legacy = {
    ...state.player,
    props: { ...state.player.props, money: 456 },
    jishaNum: null,
    nextGameTimes: legacyTimes,
    inventory: [legacyItem],
    equipment: { ...state.player.equipment, weapon: { ...legacyItem, strengthen: 7 } },
    shopData: [{ type: 'weapon', name: '神兵', data: [legacyItem] }]
  }
  const normalized = normalizePlayer(legacy)
  expect(normalized.version).toBe(0.8)
  expect(normalized.jishaNum).toBe(0)
  expect(normalized.nextGameTimes.ticTacToe).toBeNull()
  expect(normalized.props.money).toBe(456)
  expect(normalized.inventory[0]?.strengthen).toBe(0)
  expect(normalized.inventory[0]?.lock).toBe(false)
  expect(normalized.equipment.weapon.strengthen).toBe(7)
  expect(normalized.shopData[0]?.data[0]?.strengthen).toBe(0)
  expect('strengthen' in legacyItem).toBe(false)
})

test('normalization rejects corrupt saves rather than hiding invalid amounts', () => {
  const player = createInitialState().player
  expect(() => normalizePlayer({ ...player, cultivation: Infinity })).toThrow('player.cultivation')
  expect(() => normalizePlayer({ ...player, props: { ...player.props, money: '100' } })).toThrow('props.money')
  expect(() => normalizePlayer({ ...player, equipment: { ...player.equipment, weapon: { type: 'weapon' } } })).toThrow()
  expect(() => normalizePlayer({ ...player, inventory: {} })).toThrow('inventory must be an array')
})

test('only the known version 0.8 root-bone overspend is recovered', () => {
  const player = createInitialState().player
  const legacy = { ...player, props: { ...player.props, rootBone: -1 } }
  expect(normalizePlayer(legacy).props.rootBone).toBe(0)
  expect(legacy.props.rootBone).toBe(-1)
  expect(() => normalizePlayer({ ...legacy, version: 0.9 })).toThrow('props.rootBone')
  for (const rootBone of [-2, -0.5, NaN, Infinity, '1']) {
    expect(() => normalizePlayer({ ...player, props: { ...player.props, rootBone } })).toThrow('props.rootBone')
  }
  expect(() => normalizePlayer({ ...player, props: { ...player.props, money: -1 } })).toThrow('props.money')
  expect(normalizePlayer({ ...player, props: { ...player.props, rootBone: 12 } }).props.rootBone).toBe(12)
})

test('only tiny negative floating-point rate residues are normalized', () => {
  const player = createInitialState().player
  for (const key of ['dodge', 'critical'] as const) {
    for (const rate of [-1e-12, -3.469446951953614e-18, -Number.EPSILON]) {
      const legacy = { ...player, [key]: rate }
      expect(normalizePlayer(legacy)[key]).toBe(0)
      expect(legacy[key]).toBe(rate)
    }
    for (const rate of [-1.0001e-12, -0.01, -1, NaN, Infinity, '0.01', null]) {
      expect(() => normalizePlayer({ ...player, [key]: rate })).toThrow(`player.${key}`)
    }
    for (const rate of [0, 0.01, 1e-15, 2]) {
      expect(normalizePlayer({ ...player, [key]: rate })[key]).toBe(rate)
    }
  }
  for (const key of ['attack', 'health', 'maxHealth', 'defense'] as const) {
    expect(() => normalizePlayer({ ...player, [key]: -Number.EPSILON })).toThrow(`player.${key}`)
  }
})

test('an encrypted version 0.8 save from the old implementation remains readable', () => {
  // This static fixture was encrypted by the unmodified crypto/store modules
  // from commit e6d4ee7, rather than by the implementation under test.
  const decoded = decodeSavedState(JSON.stringify(legacySave))
  expect(decoded.player.version).toBe(0.8)
  expect(decoded.player.cultivation).toBe(125)
  expect(decoded.player.props.money).toBe(117)
  expect(decoded.player.jishaNum).toBe(0)
  expect(decoded.player.nextGameTimes.ticTacToe).toBeNull()
  expect(decoded.player.equipment.weapon.id).toBe(91)
  expect(decoded.player.equipment.weapon.strengthen).toBe(5)
  expect(decoded.player.equipment.weapon.lock).toBe(true)
  expect(decoded.player.inventory[0]?.id).toBe(92)
  expect(decoded.player.inventory[0]?.strengthen).toBe(0)
  expect(decoded.player.inventory[0]?.lock).toBe(false)
  expect(decoded.player.shopData[0]?.data[0]?.id).toBe(93)
  expect(decoded.player.shopData[0]?.data[0]?.strengthen).toBe(0)
  expect(decoded.player.shopData[0]?.data[0]?.lock).toBe(false)
  const encrypted = JSON.stringify({
    boss: crypto.encryption(decoded.boss),
    player: crypto.encryption(decoded.player)
  })
  expect(decodeSavedState(encrypted)).toEqual(decoded)
})

test('combat clamps lethal damage at zero and leaves health unchanged on a dodge', () => {
  spyOn(Math, 'random').mockReturnValue(0.5)
  const initial = createInitialState().player
  const attacker = { ...initial, attack: 100, critical: 0 }
  const defender = { ...initial, health: 5, defense: 0, dodge: 0 }
  const lethal = combat.executeCombatRound(attacker, defender)
  expect(lethal).toEqual({ damage: 100, isCritical: false, isHit: true, remainingHealth: 0 })
  expect(defender.health).toBe(0)
  defender.health = 5
  defender.dodge = 1
  const missed = combat.executeCombatRound(attacker, defender)
  expect(missed).toEqual({ damage: 0, isCritical: false, isHit: false, remainingHealth: 5 })
  expect(defender.health).toBe(5)
  defender.dodge = 0
  attacker.critical = 1
  expect(combat.executeCombatRound(attacker, defender).damage).toBe(150)
})

test('all random generators reject impossible ranges and preserve valid endpoints', () => {
  spyOn(Math, 'random').mockReturnValue(0)
  for (const generator of [equip, monsters, boss, shop]) {
    expect(() => generator.getRandomInt(2, 1)).toThrow('minimum must not exceed maximum')
    expect(() => generator.getRandomInt(NaN, 1)).toThrow('min must be a finite number')
    expect(() => generator.getRandomInt(0.1, 0.9)).toThrow('contains no integers')
    expect(() => generator.getRandomFloatInRange(2, 1)).toThrow('minimum must not exceed maximum')
    expect(() => generator.getRandomFloatInRange(0, Infinity)).toThrow('max must be a finite number')
    expect(generator.getRandomInt(2, 2)).toBe(2)
    expect(generator.getRandomFloatInRange(0.2, 0.5)).toBe(0.2)
  }
})

test('the pathfinding heap preserves priority order and rejects invalid operations', () => {
  const heap = new MinHeap<string>()
  expect(() => heap.poll()).toThrow('empty heap')
  expect(() => heap.add('invalid', NaN)).toThrow('Heap priority')
  expect(heap.isEmpty()).toBe(true)
  heap.add('far', 10)
  heap.add('nearest', 1)
  heap.add('middle', 5)
  heap.add('near', 2)
  expect([heap.poll(), heap.poll(), heap.poll(), heap.poll()]).toEqual(['nearest', 'near', 'middle', 'far'])
  expect(heap.isEmpty()).toBe(true)
})
