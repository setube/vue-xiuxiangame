import type { Attributes, Boss, Combatant, Equipment, EquipmentType, NPC, Pet, Player, Quality, Wife } from '../types/game'
import { equipmentTypes, qualities } from '../types/game'

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
export { invariant as assert }
export const isEquipmentType = (value: unknown): value is EquipmentType => equipmentTypes.some(type => type === value)
export const isQuality = (value: unknown): value is Quality => qualities.some(quality => quality === value)
export function assertRecord(value: unknown, name = 'value'): asserts value is Record<string, unknown> {
  invariant(typeof value === 'object' && value !== null && !Array.isArray(value), `${name} must be an object`)
}
export function assertFiniteNumber(value: unknown, name = 'value'): asserts value is number {
  invariant(typeof value === 'number' && Number.isFinite(value), `${name} must be a finite number`)
}
export function assertNonNegative(value: unknown, name = 'value'): asserts value is number {
  assertFiniteNumber(value, name)
  invariant(value >= 0, `${name} must not be negative`)
}
export function assertString(value: unknown, name = 'value'): asserts value is string {
  invariant(typeof value === 'string', `${name} must be a string`)
}
export function assertBoolean(value: unknown, name = 'value'): asserts value is boolean {
  invariant(typeof value === 'boolean', `${name} must be a boolean`)
}
export function assertAttributes(value: unknown, name = 'attributes'): asserts value is Attributes {
  assertRecord(value, name)
  for (const key of ['dodge', 'attack', 'health', 'critical', 'defense']) assertNonNegative(value[key], `${name}.${key}`)
}
export function assertCombatant(value: unknown, name = 'combatant'): asserts value is Combatant {
  assertAttributes(value, name)
}
export function assertEquipment(value: unknown): asserts value is Equipment {
  assertAttributes(value, 'equipment')
  assertRecord(value)
  assertString(value.name, 'equipment.name')
  invariant(isEquipmentType(value.type), 'Invalid equipment type')
  invariant(isQuality(value.quality), 'Invalid equipment quality')
  for (const key of ['id', 'level', 'score', 'strengthen']) assertNonNegative(value[key], `equipment.${key}`)
  assertBoolean(value.lock, 'equipment.lock')
  assertAttributes(value.initial, 'equipment.initial')
}
export function isEquipment(value: unknown): value is Equipment {
  try { assertEquipment(value); return true } catch { return false }
}
export function assertPet(value: unknown): asserts value is Pet {
  assertAttributes(value, 'pet')
  assertRecord(value)
  assertString(value.name, 'pet.name')
  for (const key of ['id', 'level', 'score', 'rootBone', 'favorability', 'reincarnation']) assertNonNegative(value[key], `pet.${key}`)
  assertBoolean(value.lock, 'pet.lock')
  assertAttributes(value.initial, 'pet.initial')
  assertRecord(value.initial)
  assertNonNegative(value.initial.rootBone, 'pet.initial.rootBone')
}
export function isPet(value: unknown): value is Pet {
  try { assertPet(value); return true } catch { return false }
}
export function assertNPC(value: unknown): asserts value is NPC {
  assertRecord(value, 'NPC')
  assertString(value.name, 'NPC.name')
  for (const key of ['lv', 'position', 'favorability', 'reincarnation']) assertNonNegative(value[key], `NPC.${key}`)
}
export function isNPC(value: unknown): value is NPC {
  try { assertNPC(value); return true } catch { return false }
}
export function assertWife(value: unknown): asserts value is Wife {
  assertAttributes(value, 'wife')
  assertRecord(value)
  assertString(value.name, 'wife.name')
  assertNonNegative(value.level, 'wife.level')
  assertNonNegative(value.reincarnation, 'wife.reincarnation')
}
export function isWife(value: unknown): value is Wife {
  try { assertWife(value); return true } catch { return false }
}
export function assertBoss(value: unknown): asserts value is Boss {
  assertAttributes(value, 'boss')
  assertRecord(value)
  for (const key of ['name', 'text', 'desc']) assertString(value[key], `boss.${key}`)
  for (const key of ['level', 'time', 'maxhealth']) assertNonNegative(value[key], `boss.${key}`)
  assertBoolean(value.conquer, 'boss.conquer')
}
export function assertPlayer(value: unknown): asserts value is Player {
  assertAttributes(value, 'player')
  assertRecord(value)
  for (const key of ['age', 'time', 'score', 'level', 'points', 'taskNum', 'version', 'currency', 'maxHealth', 'cultivation', 'reincarnation', 'maxCultivation', 'backpackCapacity', 'highestTowerFloor', 'jishaNum', 'gameWins', 'gameLosses', 'checkinDays', 'checkinStreak']) assertNonNegative(value[key], `player.${key}`)
  for (const key of ['zc', 'dark', 'isNewbie', 'checkedInToday']) assertBoolean(value[key], `player.${key}`)
  for (const key of ['name', 'script']) assertString(value[key], `player.${key}`)
  for (const key of ['currentTitle', 'lastCheckinDate', 'fortuneTellingDate']) invariant(value[key] === null || typeof value[key] === 'string', `Invalid player.${key}`)
  assertRecord(value.props, 'player.props')
  for (const key of ['money', 'flying', 'qingyuan', 'rootBone', 'currency', 'cultivateDan', 'strengtheningStone']) assertNonNegative(value.props[key], `props.${key}`)
  for (const key of ['inventory', 'pets', 'npcs', 'wifes', 'shopData', 'sellingEquipmentData', 'rewardedTowerFloors']) invariant(Array.isArray(value[key]), `player.${key} must be an array`)
  invariant(Array.isArray(value.inventory), 'Invalid inventory'); value.inventory.forEach(assertEquipment)
  invariant(Array.isArray(value.pets), 'Invalid pets'); value.pets.forEach(assertPet)
  invariant(Array.isArray(value.npcs), 'Invalid npcs'); value.npcs.forEach(assertNPC)
  invariant(Array.isArray(value.wifes), 'Invalid wifes'); value.wifes.forEach(assertWife)
  assertRecord(value.equipment, 'player.equipment')
  for (const type of equipmentTypes) { assertRecord(value.equipment[type]); if (Object.keys(value.equipment[type]).length) assertEquipment(value.equipment[type]) }
  for (const [key, validate] of [['pet', assertPet], ['wife', assertWife]] as const) { assertRecord(value[key]); if (Object.keys(value[key]).length) validate(value[key]) }
  assertRecord(value.achievement)
  for (const type of ['pet', 'monster', 'equipment']) {
    const entries = value.achievement[type]
    invariant(Array.isArray(entries), `Invalid achievements ${type}`)
    for (const entry of entries) { assertRecord(entry); assertNonNegative(entry.id, 'achievement.id') }
  }
  invariant(Array.isArray(value.shopData), 'Invalid shop data')
  for (const group of value.shopData) { assertRecord(group); assertString(group.name); invariant(equipmentTypes.some(type => type === group.type), 'Invalid shop type'); invariant(Array.isArray(group.data), 'Invalid shop equipment'); group.data.forEach(assertEquipment) }
  invariant(Array.isArray(value.sellingEquipmentData) && value.sellingEquipmentData.every(quality => qualities.some(item => item === quality)), 'Invalid selling qualities')
  invariant(Array.isArray(value.rewardedTowerFloors), 'Invalid tower rewards'); value.rewardedTowerFloors.forEach(item => assertNonNegative(item, 'tower floor'))
  assertRecord(value.nextGameTimes)
  for (const key of ['rps', 'dice', 'fortune', 'secretrealm', 'gamblingStone', 'ticTacToe']) if (value.nextGameTimes[key] !== null) assertNonNegative(value.nextGameTimes[key], `nextGameTimes.${key}`)
}

export function assertRandomRange(min: number, max: number): void {
  assertFiniteNumber(min, 'min'); assertFiniteNumber(max, 'max')
  invariant(min <= max, 'Random range minimum must not exceed maximum')
}
