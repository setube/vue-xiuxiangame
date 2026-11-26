export const equipmentTypes = ['weapon', 'armor', 'accessory', 'sutra'] as const
export type EquipmentType = typeof equipmentTypes[number]
export const qualities = ['info', 'success', 'primary', 'purple', 'warning', 'danger', 'pink'] as const
export type Quality = typeof qualities[number]
export interface Attributes { dodge: number; attack: number; health: number; critical: number; defense: number }
export interface Combatant extends Attributes {}
export interface Monster extends Combatant { name: string; level?: number; maxHealth?: number }
export interface Equipment extends Attributes {
  id: number; name: string; type: EquipmentType; level: number; score: number; quality: Quality
  initial: Attributes; strengthen: number; lock: boolean
}
export type EquipmentSlot = Partial<Equipment>
export interface Pet extends Attributes {
  id: number; name: string; level: number; score: number; lock: boolean
  initial: Attributes & { rootBone: number }; rootBone: number; favorability: number; reincarnation: number
}
export type PetSlot = Partial<Pet>
export interface NPC { name: string; lv: number; position: number; favorability: number; reincarnation: number }
export type Npc = NPC
export type NPCSlot = Partial<NPC>
export interface Wife extends Attributes { name: string; level: number; reincarnation: number }
export type WifeSlot = Partial<Wife>
export type PropKey = 'money' | 'flying' | 'qingyuan' | 'rootBone' | 'currency' | 'cultivateDan' | 'strengtheningStone'
export type Props = Record<PropKey, number>
export type AchievementType = 'pet' | 'monster' | 'equipment'
export interface Achievement {
  id: number; name: string; award: number; desc?: string
  titleBonus: Partial<Attributes>; condition: Partial<Record<keyof Attributes | 'highestTowerFloor' | 'age' | 'gameWins' | 'level' | 'monstersDefeated' | 'money', number>>
}
export interface AchievementGroup { name: string; type: AchievementType; data: Achievement[] }
export interface ShopGroup { type: EquipmentType; name: string; data: Equipment[] }
export type CatalogueEquipment = Omit<Equipment, 'id' | 'initial' | 'strengthen' | 'lock'> & { prize: number }
export interface CatalogueGroup { type: EquipmentType; name: string; data: CatalogueEquipment[] }
export interface Player extends Combatant {
  zc: boolean; age: number; time: number; name: string; dark: boolean
  pet: PetSlot; pets: Pet[]; npcs: NPC[]; wife: WifeSlot; wifes: Wife[]; props: Props
  score: number; level: number; points: number; taskNum: number; version: number; currency: number; maxHealth: number
  inventory: Equipment[]; isNewbie: boolean; shopData: ShopGroup[]; equipment: Record<EquipmentType, EquipmentSlot>
  achievement: Record<AchievementType, { id: number }[]>; script: string; cultivation: number; currentTitle: string | null
  reincarnation: number; maxCultivation: number; backpackCapacity: number; sellingEquipmentData: Quality[]
  highestTowerFloor: number; rewardedTowerFloors: number[]; jishaNum: number
  nextGameTimes: { rps: number | null; dice: number | null; fortune: number | null; secretrealm: number; gamblingStone: number | null; ticTacToe: number | null }
  gameWins: number; gameLosses: number; checkinDays: number; checkinStreak: number
  lastCheckinDate: string | null; fortuneTellingDate: string | null; checkedInToday: boolean
}
export interface Boss extends Combatant {
  name: string; text: string; time: number; desc: string; level: number; conquer: boolean; maxhealth: number
}
export type GridCellType = 'empty' | 'player' | 'npc' | 'fishing' | 'obstacle'
export interface GridCell { his: string; type: GridCellType }
export type MapCell = GridCell
export interface MapData { y: number; x: number; map: GridCell[] }
export interface GameState { boss: Boss; player: Player; monster: Monster; mapData: MapData; mapScroll: number; fishingMap: number[] }
export interface GameResult { success: boolean; reward: number | Partial<Props> }
