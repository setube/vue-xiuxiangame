import achievement from '@/plugins/achievement'
import type { Achievement, AchievementType, Equipment, Pet, Player } from '@/types/game'

type AchievementSubject = Player | Pet | Equipment

export const checkAchievements = (player: Player, type: AchievementType, data?: AchievementSubject): Achievement[] => {
  const unlocked: Achievement[] = []
  const subject = type === 'monster' ? player : data
  if (!subject) return unlocked
  for (const item of achievement[type]()) {
    if (player.achievement[type].some(earned => earned.id === item.id)) continue
    if (!checkCondition(item.condition, subject)) continue
    player.achievement[type].push({ id: item.id })
    player.props.cultivateDan += item.award
    // Preserve the existing monster-achievement notification behavior.
    if (type !== 'monster') unlocked.push(item)
  }
  return unlocked
}

const checkCondition = (condition: Achievement['condition'], data: AchievementSubject): boolean => {
  for (const [key, threshold] of Object.entries(condition)) {
    const actual: unknown = Reflect.get(data, key)
    if (typeof actual !== 'number' || actual < threshold) return false
  }
  return true
}
