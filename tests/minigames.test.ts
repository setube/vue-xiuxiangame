import { expect, test } from 'bun:test'
import { reactive, type Ref } from 'vue'
import { loadView } from './helpers/load-view'
import type { MapCell } from '../src/types/game'
import { invariant } from '../src/utils/assert'

const createPlayer = () => reactive({
  name: '测试玩家',
  props: { money: 1000 },
  health: 100,
  cultivation: 0,
  gameWins: 0,
  gameLosses: 0,
  nextGameTimes: { dice: 0, rps: 0, secretrealm: 0, ticTacToe: 0 }
})

interface GameBindings {
  processGameResult(result: unknown): void
}

interface CheckinBindings {
  getReward(day: number): number
  checkIn(): void
}

test('check-in calendar and awards stay finite after four weeks and later bonus cycles', async () => {
  const player = reactive({
    ...createPlayer(),
    props: { money: 1000, cultivateDan: 0 },
    checkinDays: 0,
    checkinStreak: 0,
    lastCheckinDate: null
  })
  const rewards: unknown[] = []
  const component = await loadView<CheckinBindings>('src/views/game/checkin.vue', {
    imports: {
      '@/plugins/store': { useMainStore: () => ({ player }) },
      '@/plugins/game': { gameNotifys() {} }
    }
  })
  const checkin = component.setup({}, {
    expose() {},
    emit(event: string, ...args: unknown[]) {
      if (event === 'game-result') rewards.push(args[0])
    }
  })
  for (const completedDays of [21, 27, 28, 34, 55, 365]) {
    player.checkinStreak = completedDays
    player.lastCheckinDate = null
    expect(checkin.getReward(7)).toBe(7000)
    const dayInStreak = (completedDays % 7) + 1
    const expectedReward = checkin.getReward(dayInStreak)
    const previousCultivateDan = player.props.cultivateDan
    checkin.checkIn()
    expect(Number.isFinite(expectedReward)).toBe(true)
    expect(player.props.cultivateDan - previousCultivateDan).toBe(expectedReward)
    expect(Number.isFinite(player.props.cultivateDan)).toBe(true)
    expect(rewards.at(-1)).toEqual({ success: true, reward: expectedReward })
  }
})

test('game results are validated completely before changing rewards or counters', async () => {
  const player = createPlayer()
  const component = await loadView<GameBindings>('src/views/game/game.vue', {
    imports: {
      vue: { onMounted() {}, watch() {} },
      'vue-router': { useRouter: () => ({ push() {} }) },
      '@/plugins/store': { useMainStore: () => ({ player }) },
      '@/plugins/game': { formatNumberToChineseUnit: String }
    }
  })
  const game = component.setup({}, { expose() {} })
  const invalidResults: unknown[] = [
    null,
    { success: 'yes', reward: 10 },
    { success: true, reward: '10' },
    { success: true, reward: Infinity },
    { success: true, reward: { money: 10, invalid: 1 } },
    { success: true, reward: { money: NaN } },
    { success: false, reward: { money: 10 } }
  ]
  for (const result of invalidResults) {
    expect(() => game.processGameResult(result)).toThrow()
    expect(player.props.money).toBe(1000)
    expect(player.gameWins).toBe(0)
    expect(player.gameLosses).toBe(0)
  }
  game.processGameResult({ success: true, reward: { money: 25 } })
  game.processGameResult({ success: true, reward: 50 })
  game.processGameResult({ success: false, reward: 10 })
  expect(player.props.money).toBe(1000)
  expect(player.gameWins).toBe(2)
  expect(player.gameLosses).toBe(1)
})

interface DiceBindings {
  betAmount: Ref<number>
  isRolling: Ref<boolean>
  placeBet(): void
  updateCanBet(): void
}

test('dice rejects invalid wagers before scheduling or changing currency', async () => {
  const player = createPlayer()
  let intervalCallback: (() => void) | undefined
  const events: { event: string; payload: unknown }[] = []
  const component = await loadView<DiceBindings>('src/views/game/Dicegame.vue', {
    imports: {
      vue: { onMounted() {}, onUnmounted() {}, watch() {} },
      '@/plugins/store': { useMainStore: () => ({ player }) },
      '@/plugins/game': { gameNotifys() {} }
    },
    globals: {
      Math: Object.assign(Object.create(Math), { random: () => 0.9 }),
      setInterval(callback: () => void) { intervalCallback = callback; return 1 },
      clearInterval() {}
    }
  })
  const dice = component.setup({}, {
    expose() {},
    emit(event: string, ...args: unknown[]) { events.push({ event, payload: args[0] }) }
  })
  for (const invalid of [NaN, Infinity, -100, 0]) {
    dice.betAmount.value = invalid
    expect(() => dice.placeBet()).toThrow('下注金额')
    expect(player.props.money).toBe(1000)
    expect(intervalCallback).toBeUndefined()
  }

  dice.betAmount.value = 100
  dice.updateCanBet()
  dice.placeBet()
  expect(dice.isRolling.value).toBe(true)
  dice.betAmount.value = 200
  expect(intervalCallback).toBeDefined()
  invariant(intervalCallback, 'A valid wager must start the dice animation')
  const roll = intervalCallback
  for (let count = 0; count < 20; count++) roll()
  expect(dice.isRolling.value).toBe(false)
  expect(player.props.money).toBe(1100)
  expect(events[0]).toEqual({ event: 'game-result', payload: { success: true, reward: 200 } })
  expect(player.nextGameTimes.dice).toBeGreaterThan(Date.now())
})

interface SecretBindings {
  board: Ref<{ type: string; revealed: boolean }[][]>
  movesLeft: Ref<number>
  startNewGame(): void
  revealCell(row: number, column: number): void
}

test('secret realm validates coordinates while a valid cell consumes one move', async () => {
  const player = createPlayer()
  const component = await loadView<SecretBindings>('src/views/game/SecretRealm.vue', {
    imports: {
      vue: { onMounted() {}, onUnmounted() {} },
      '@/plugins/store': { useMainStore: () => ({ player }) },
      '@/plugins/game': { gameNotifys() {} }
    }
  })
  const secret = component.setup({}, { expose() {} })
  secret.startNewGame()
  for (const coordinate of [-1, 8, 0.5, NaN]) {
    expect(() => secret.revealCell(coordinate, 0)).toThrow('秘境坐标越界')
    expect(secret.movesLeft.value).toBe(20)
  }
  secret.board.value[0][0] = { type: 'empty', revealed: false }
  secret.revealCell(0, 0)
  expect(secret.board.value[0][0].revealed).toBe(true)
  expect(secret.movesLeft.value).toBe(19)
  secret.revealCell(0, 0)
  expect(secret.movesLeft.value).toBe(19)
})

interface RockBindings {
  betAmount: Ref<number>
  updateCanPlay(): void
  play(choice: '石头' | '剪刀' | '布'): void
}

interface FortuneBindings {
  tellFortune(): void
}

test('game parent and children settle dice, rock, fortune and check-in rewards once', async () => {
  const player = reactive({
    ...createPlayer(),
    props: { money: 1000, cultivateDan: 0 },
    checkinDays: 0,
    checkinStreak: 0,
    lastCheckinDate: null,
    fortuneTellingDate: null
  })
  const imports = {
    vue: { onMounted() {}, onUnmounted() {}, watch() {} },
    'vue-router': { useRouter: () => ({ push() {} }) },
    '@/plugins/store': { useMainStore: () => ({ player }) },
    '@/plugins/game': { gameNotifys() {}, formatNumberToChineseUnit: String }
  }
  const parent = (await loadView<GameBindings>('src/views/game/game.vue', { imports })).setup({}, { expose() {} })
  const context = {
    expose() {},
    emit(event: string, ...args: unknown[]) {
      if (event === 'game-result') parent.processGameResult(args[0])
    }
  }
  let roll: (() => void) | undefined
  const dice = (await loadView<DiceBindings>('src/views/game/Dicegame.vue', {
    imports,
    globals: {
      Math: Object.assign(Object.create(Math), { random: () => 0.9 }),
      setInterval(callback: () => void) { roll = callback; return 1 },
      clearInterval() {}
    }
  })).setup({}, context)
  dice.updateCanBet()
  dice.placeBet()
  expect(player.props.money).toBe(900)
  invariant(roll, 'A valid wager must schedule a dice roll')
  for (let count = 0; count < 20; count++) roll()
  expect(player.props.money).toBe(1100)
  expect(player.gameWins).toBe(1)

  player.props.money = 100
  const rock = (await loadView<RockBindings>('src/views/game/rock.vue', {
    imports,
    globals: { Math: Object.assign(Object.create(Math), { random: () => 0.9 }) }
  })).setup({}, context)
  rock.updateCanPlay()
  rock.play('石头')
  expect(player.props.money).toBe(0)
  expect(player.gameLosses).toBe(1)
  player.nextGameTimes.rps = 0
  player.props.money = 100
  rock.updateCanPlay()
  player.props.money = 0
  rock.play('石头')
  expect(player.props.money).toBe(0)
  expect(player.gameLosses).toBe(1)

  const fortune = (await loadView<FortuneBindings>('src/views/game/fortunetelling.vue', {
    imports,
    globals: { Math: Object.assign(Object.create(Math), { random: () => 0 }) }
  })).setup({}, context)
  fortune.tellFortune()
  expect(player.props.money).toBe(50)
  expect(player.gameWins).toBe(2)

  const checkin = (await loadView<CheckinBindings>('src/views/game/checkin.vue', { imports })).setup({}, context)
  checkin.checkIn()
  expect(player.props.money).toBe(1050)
  expect(player.props.cultivateDan).toBe(100)
  expect(player.gameWins).toBe(3)
})

interface ToeBindings extends BoardBindings {
  resetGame(): void
}

test('tic-tac-toe reserves one stake and a loss cannot credit money or settle twice', async () => {
  const player = createPlayer()
  const pendingMoves: (() => void)[] = []
  const imports = {
    vue: { onMounted() {}, onUnmounted() {}, watch() {} },
    'vue-router': { useRouter: () => ({ push() {} }) },
    '@/plugins/store': { useMainStore: () => ({ player }) },
    '@/plugins/game': { formatNumberToChineseUnit: String }
  }
  const parent = (await loadView<GameBindings>('src/views/game/game.vue', { imports })).setup({}, { expose() {} })
  const toe = (await loadView<ToeBindings>('src/views/game/toe.vue', {
    imports,
    globals: {
      Math: Object.assign(Object.create(Math), { random: () => 0 }),
      setTimeout(callback: () => void) { pendingMoves.push(callback); return pendingMoves.length },
      clearTimeout() {}
    }
  })).setup({}, {
    expose() {},
    emit(event: string, ...args: unknown[]) {
      if (event === 'game-result') parent.processGameResult(args[0])
    }
  })
  toe.canPlay.value = true
  for (const [row, column] of [[1, 1], [2, 2], [2, 1]]) {
    toe.makeMove(row, column)
    expect(player.props.money).toBe(0)
    const move = pendingMoves.shift()
    invariant(move, 'Every unfinished player turn must schedule the computer move')
    move()
  }
  expect(player.gameLosses).toBe(1)
  expect(player.props.money).toBe(0)
  toe.makeMove(1, 0)
  expect(player.gameLosses).toBe(1)
  expect(player.props.money).toBe(0)

  player.props.money = 1000
  player.nextGameTimes.ticTacToe = 0
  toe.resetGame()
  for (const [row, column] of [[0, 0], [1, 1]]) {
    toe.makeMove(row, column)
    const move = pendingMoves.shift()
    invariant(move, 'The computer must answer an unfinished player turn')
    move()
  }
  toe.makeMove(2, 2)
  expect(player.props.money).toBe(2000)
  expect(player.gameWins).toBe(1)
  expect(player.gameLosses).toBe(1)
})

test('canceling unfinished dice and tic-tac-toe games refunds the reserved stake', async () => {
  const player = createPlayer()
  const unmounted: (() => void)[] = []
  const intervals = new Set<number>()
  const timeouts = new Set<number>()
  let nextTimer = 1
  const imports = {
    vue: { onMounted() {}, onUnmounted: (callback: () => void) => unmounted.push(callback), watch() {} },
    '@/plugins/store': { useMainStore: () => ({ player }) },
    '@/plugins/game': { gameNotifys() {} }
  }
  const dice = (await loadView<DiceBindings>('src/views/game/Dicegame.vue', {
    imports,
    globals: {
      setInterval() { intervals.add(nextTimer); return nextTimer++ },
      clearInterval(id: number) { intervals.delete(id) }
    }
  })).setup({}, { expose() {}, emit() {} })
  dice.updateCanBet()
  dice.placeBet()
  expect(player.props.money).toBe(900)
  expect(intervals.size).toBe(1)
  unmounted.forEach(callback => callback())
  expect(player.props.money).toBe(1000)
  expect(intervals.size).toBe(0)
  unmounted.length = 0

  const toe = (await loadView<ToeBindings>('src/views/game/toe.vue', {
    imports,
    globals: {
      setTimeout() { timeouts.add(nextTimer); return nextTimer++ },
      clearTimeout(id: number) { timeouts.delete(id) }
    }
  })).setup({}, { expose() {}, emit() {} })
  toe.canPlay.value = true
  toe.makeMove(1, 1)
  expect(player.props.money).toBe(0)
  expect(timeouts.size).toBe(1)
  toe.resetGame()
  expect(player.props.money).toBe(1000)
  expect(timeouts.size).toBe(0)
  toe.makeMove(1, 1)
  unmounted.forEach(callback => callback())
  expect(player.props.money).toBe(1000)
  expect(timeouts.size).toBe(0)
  expect(player.gameWins).toBe(0)
  expect(player.gameLosses).toBe(0)
})

interface BoardBindings {
  board: Ref<string[][]>
  canPlay: Ref<boolean>
  makeMove(row: number, column: number): void
}

test('tic-tac-toe rejects out-of-board moves without corrupting a valid board', async () => {
  const component = await loadView<BoardBindings>('src/views/game/toe.vue', {
    imports: {
      vue: { onMounted() {}, onUnmounted() {} },
      '@/plugins/store': { useMainStore: () => ({ player: createPlayer() }) }
    },
    globals: { setTimeout() { return 1 } }
  })
  const game = component.setup({}, { expose() {}, emit() {} })
  game.canPlay.value = true
  expect(() => game.makeMove(-1, 0)).toThrow('棋盘坐标越界')
  expect(() => game.makeMove(0, 3)).toThrow('棋盘坐标越界')
  game.makeMove(1, 1)
  expect(game.board.value[1][1]).toBe('X')
  expect(game.board.value.flat().filter(cell => cell !== ' ')).toHaveLength(1)
})

interface MapBindings {
  holdingId: Ref<number | null>
  startFishing(): void
  endGame(): void
  isLucky(probability: number): boolean
  gridInfo(index: number, cell: MapCell): void
}

test('map assertions guard indices and fishing cleanup stops a held input timer', async () => {
  const timers = new Set<number>()
  const unmounted: (() => void)[] = []
  const component = await loadView<MapBindings>('src/views/mapExploration.vue', {
    imports: {
      vue: { onMounted() {}, onUnmounted: (callback: () => void) => unmounted.push(callback) },
      'vue-router': { useRouter: () => ({ push() {} }) },
      'element-plus': { ElMessageBox: {} },
      '@/plugins/npc': { default: {} },
      '@/plugins/monster': { default: {} },
      '@/plugins/store': { useMainStore: () => ({ player: createPlayer(), mapData: { x: 0, y: 0, map: [] }, fishingMap: [] }) },
      '@/plugins/game': { gameNotifys() {}, levelNames: String }
    },
    globals: {
      window: {
        setInterval() { timers.add(1); return 1 },
        removeEventListener() {}
      },
      clearInterval(id: number) { timers.delete(id) },
      cancelAnimationFrame() {}
    }
  })
  const map = component.setup({}, { expose() {} })
  expect(() => map.gridInfo(-1, { his: '', type: 'empty' })).toThrow('地图坐标越界')
  expect(() => map.isLucky(101)).toThrow('概率必须')
  expect(map.isLucky(100)).toBe(true)
  map.startFishing()
  map.startFishing()
  expect(timers.size).toBe(1)
  map.endGame()
  expect(map.holdingId.value).toBeNull()
  expect(timers.size).toBe(0)
  map.startFishing()
  unmounted.forEach(callback => callback())
  expect(map.holdingId.value).toBeNull()
  expect(timers.size).toBe(0)
})
