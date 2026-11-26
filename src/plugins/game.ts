import { ElNotification } from 'element-plus'
import type { NotificationOptions } from 'element-plus'
import { assertFiniteNumber, assertNonNegative, invariant } from '@/utils/assert'
import type { EquipmentType, PropKey, Quality } from '@/types/game'

export const maxLv = 144

export const gameNotifys = (data: NotificationOptions): void => {
  ElNotification.closeAll()
  ElNotification(data)
}

// prettier-ignore
export const levelNames = (level: number): string => {
  assertNonNegative(level, 'level')
  invariant(Number.isInteger(level), 'Level must be an integer')
  const levelsPerStage = 9
  const stageIndex = Math.floor((level - 1) / levelsPerStage)
  const stageLevel = ((level - 1) % levelsPerStage) + 1
  const numberName: Record<number, string> = {
    1: '一', 2: '二', 3: '三', 4: '四',
    5: '五', 6: '六', 7: '七', 8: '八', 9: '九'
  }
  const stageNames = [
    '筑基', '开光', '胎息', '辟谷',
    '金丹', '元婴', '出窍', '分神',
    '合体', '大乘', '渡劫', '地仙',
    '天仙', '金仙', '大罗金仙', '九天玄仙'
  ]
  if (level === 0) return '凡人'
  else if (level >= maxLv) return '九天玄仙九层'
  else return `${stageNames[stageIndex]}${numberName[stageLevel]}层`
}

export const dropdownTypeObject = {
  id: '时间',
  level: '境界',
  score: '评分',
  health: '气血',
  attack: '攻击',
  defense: '防御',
  critical: '暴击',
  dodge: '闪避'
}
export const dropdownType = Object.entries(dropdownTypeObject).map(([type, name]) => ({ type, name }))

export const genre: Record<EquipmentType, string> = {
  sutra: '法器',
  armor: '护甲',
  weapon: '神兵',
  accessory: '灵宝'
}

export const isAPP = location.host == 'appassets.androidplatform.net'

export const levels: Record<Quality, string> = {
  info: '黄阶',
  pink: '仙阶',
  danger: '神阶',
  purple: '天阶',
  primary: '地阶',
  success: '玄阶',
  warning: '帝阶'
}

export const propItemNames: Record<PropKey, { name: string; desc: string }> = {
  money: { name: '灵石', desc: '可以通过分解获得装备获得' },
  flying: { name: '传送符', desc: '可以通过赠送礼物给NPC获得' },
  rootBone: { name: '悟性丹', desc: '可以通过击败世界BOSS获得' },
  qingyuan: { name: '情缘', desc: '可以通过赠送礼物给NPC获得' },
  currency: { name: '鸿蒙石', desc: '可以通过击败世界BOSS获得' },
  cultivateDan: { name: '培养丹', desc: '可以通过探索获得' },
  strengtheningStone: { name: '炼器石', desc: '可以通过分解装备获得' }
}

export const formatNumberToChineseUnit = (number: number): string => {
  assertFiniteNumber(number, 'Formatted number')
  number = number > 0 ? Math.floor(number) : 0
  const units = ['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极']
  const bigTenThousand = BigInt(10000)
  let num = BigInt(number)
  let unitIndex = 0
  let additionalUnits = ''
  while (num >= bigTenThousand) {
    num /= bigTenThousand
    unitIndex++
    if (unitIndex >= units.length - 1) {
      additionalUnits += '极'
      unitIndex = 0
    }
  }
  return num.toString() + units[unitIndex] + additionalUnits
}

export const smoothScrollToBottom = (element: Pick<HTMLElement, 'scrollTop' | 'scrollHeight'>): void => {
  const start = element.scrollTop
  const end = element.scrollHeight
  const duration = 300
  const startTime = performance.now()
  const scroll = () => {
    const currentTime = performance.now()
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)
    element.scrollTop = start + (end - start) * easeInOutCubic(progress)
    if (progress < 1) window.requestAnimationFrame(scroll)
  }
  const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  window.requestAnimationFrame(scroll)
}
