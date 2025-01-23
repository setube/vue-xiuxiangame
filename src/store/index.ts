import { defineStore } from "pinia"
import { genre, qualityMultiplier } from "@/constant/base"

export interface EquipmentItem {
  /** 装备ID */
  id: number,
  /** 装备名称 */
  name: string
  /** 装备类型 */
  type: keyof typeof genre,
  lock: boolean,
  /** 装备等级 */
  level: number
  /** 装备评分 */
  score: number
  /** 闪避率  */
  dodge: number,
  /** 攻击力 */
  attack: number,
  /** 血量 */
  health: number,
  /** 防御 */
  defense: number,
  /** 暴击率 */
  critical: number,
  // 初始数据
  initial: {
    /** 闪避率 */
    dodge: number,
    /** 攻击力 */
    attack: number,
    /** 血量 */
    health: number,
    /** 防御 */
    defense: number,
    /** 暴击率 */
    critical: number
  },
  quality: keyof typeof qualityMultiplier,
  /** 炼器等级 */
  strengthen: number
}

export interface Equipment {
  sutra: EquipmentItem
  armor: EquipmentItem
  weapon: EquipmentItem
  accessory: EquipmentItem
}
export interface Pet {
  id: number
  /** 是否锁定 */
  lock: boolean
  name: string
  level: number
  /* 评分 */
  score: string
  /** 闪避率 */
  dodge: number
  /** 血量 */
  health: number
  /** 攻击力 */
  attack: number
  /** 防御 */
  defense: number
  /** 暴击率 */
  critical: number
  // 初始数据
  initial: {
    /** 闪避率 */
    dodge: number
    /** 血量 */
    health: number
    /** 攻击力 */
    attack: number
    /** 防御 */
    defense: number
    /** 暴击率 */
    critical: number
    /**  */
    rootBone: number
  }
  // 悟性
  rootBone: number
  // 好感度
  favorability: number
  // 转生
  reincarnation: number
}
export interface Monster {
  name: string
  health: number
  attack: number
  defense: number
  dodge: number
  critical: number
}
export interface Achievement {
  pet: Pet[]
  monster: Monster[]
  equipment: Equipment[]
}
export interface Npc {
  lv: 144
  name: string
  position: number
  favorability: number
  reincarnation: number
}
export interface Player {
  zc: boolean
  age: number
  pet: {}
  time: number
  name: string
  dark: boolean
  npcs: Npc[]
  wife: {}
  pets: Pet[]
  wifes: unknown[]
  props: {
    money: number
    flying: number
    qingyuan: number
    rootBone: number
    currency: number
    cultivateDan: number
    strengtheningStone: number
  }
  score: number
  level: number
  dodge: number
  points: number
  attack: number
  health: number
  critical: number
  defense: number
  taskNum: number
  version: number
  currency: number
  maxHealth: number
  inventory: EquipmentItem[]
  isNewbie: boolean
  shopData: unknown[]
  equipment: Equipment
  achievement: Achievement
  script: string
  cultivation: number
  currentTitle: null
  reincarnation: number
  maxCultivation: number
  backpackCapacity: number
  sellingEquipmentData: unknown[]
  highestTowerFloor: number
  rewardedTowerFloors: unknown[]
  nextGameTimes: {
    rps: null
    dice: null
    fortune: null
    secretrealm: number
    gamblingStone: null
  }
  gameWins: number
  gameLosses: number
  checkinDays: number
  checkinStreak: number
  lastCheckinDate: null
  fortuneTellingDate: null
}
export interface Boss {
  name: string
  text: string
  time: number
  desc: string
  level: number
  dodge: number
  attack: number
  health: number
  conquer: boolean
  defense: number
  critical: number
  maxhealth: number
}

export interface MapData {
  y: number
  x: number
  map: []
}

export const useMainStore = defineStore("main", {
  state: () => ({
    // boss属性
    boss: {
      name: "",
      text: "",
      time: 0,
      desc: "",
      level: 0,
      dodge: 0,
      attack: 0,
      health: 0,
      conquer: false,
      defense: 0,
      critical: 0,
      maxhealth: 0,
    } as Boss,
    // 玩家属性
    player: {
      zc: false,
      age: 1,
      pet: {},
      time: 0,
      name: "玩家",
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
        strengtheningStone: 0,
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
      version: 0.8,
      currency: 0,
      maxHealth: 100,
      inventory: [],
      isNewbie: false,
      shopData: [],
      equipment: {
        sutra: {} as EquipmentItem,
        armor: {} as EquipmentItem,
        weapon: {} as EquipmentItem,
        accessory: {} as EquipmentItem,
      },
      achievement: {
        pet: [],
        monster: [],
        equipment: [],
      },
      script: "",
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
        dice: null,
        fortune: null,
        secretrealm: 0,
        gamblingStone: null,
      },
      gameWins: 0,
      gameLosses: 0,
      checkinDays: 0,
      checkinStreak: 0,
      lastCheckinDate: null,
      fortuneTellingDate: null,
    } as Player,
    // 怪物信息
    monster: {
      name: "",
      // 气血
      health: 0,
      // 攻击
      attack: 0,
      // 防御
      defense: 0,
      // 闪避率
      dodge: 0,
      // 暴击
      critical: 0,
    } as Monster,
    mapData: {
      y: 0,
      x: 0,
      map: [],
    } as MapData,
    mapScroll: 0,
    fishingMap: [],
  }),
  persist: {
    key: "vuex",
    pick: ["boss", "player"],
  }
})

export type Store = ReturnType<typeof useMainStore>
