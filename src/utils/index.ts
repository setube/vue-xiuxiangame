import { maxLv } from "@/constant/base"

import { ElNotification, NotificationParams } from "element-plus"

export function notify(params: NotificationParams){
  ElNotification.closeAll()
  ElNotification(params)
}

export function formatNumberToChineseUnit(number: number) {
  number = number > 0 ? Math.floor(number) : 0
  const units = [
    "",
    "万",
    "亿",
    "兆",
    "京",
    "垓",
    "秭",
    "穰",
    "沟",
    "涧",
    "正",
    "载",
    "极",
  ]
  const bigTenThousand = window.BigInt(10000)
  let num = window.BigInt(number)
  let unitIndex = 0
  let additionalUnits = ""
  while (num >= bigTenThousand) {
    num /= bigTenThousand
    unitIndex++
    if (unitIndex >= units.length - 1) {
      additionalUnits += "极"
      unitIndex = 0
    }
  }
  return num.toString() + units[unitIndex] + additionalUnits
}
export function smoothScrollToBottom(element: HTMLElement) {
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
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  window.requestAnimationFrame(scroll)
}
export function getLevelNames(level: number) {
  const levelsPerStage = 9;
  const stageIndex = Math.floor((level - 1) / levelsPerStage);
  const stageLevel = (level - 1) % levelsPerStage + 1;
  const numberName = {
    1: '一', 2: '二', 3: '三', 4: '四',
    5: '五', 6: '六', 7: '七', 8: '八', 9: '九'
  };
  const stageNames = [
    '筑基', '开光', '胎息', '辟谷',
    '金丹', '元婴', '出窍', '分神',
    '合体', '大乘', '渡劫', '地仙',
    '天仙', '金仙', '大罗金仙', '九天玄仙'
  ];
  if (level === 0) return '凡人';
  else if (level >= maxLv) return '九天玄仙九层';
  else return `${stageNames[stageIndex]}${numberName[stageLevel as keyof typeof numberName]}层`;
}
