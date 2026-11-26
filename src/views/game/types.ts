import type { Player } from '@/types/game'

export type { GameResult } from '@/types/game'

export interface CooldownUpdate {
  game: keyof Player['nextGameTimes']
  time: number
}
