<template>
  <div class="tic-tac-toe">
    <div class="game-board">
      <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row">
        <el-button
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          @click="makeMove(rowIndex, colIndex)"
          :disabled="cell !== ' ' || !canPlay || gameEnded || currentPlayer !== 'X'"
          class="cell"
        >
          {{ cell }}
        </el-button>
      </div>
    </div>
    <p v-if="canPlay" class="game-status" v-text="gameStatus" />
    <el-button @click="resetGame" v-if="canPlay && !gameEnded">重新开始</el-button>
    <el-countdown :title="hasEnoughMoney ? '冷却中' : '灵石不足'" :value="nextGameTime" @finish="finish" v-else />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { invariant } from '@/utils/assert'
  import type { CooldownUpdate, GameResult } from './types'

  type Marker = 'X' | 'O'
  type Cell = Marker | ' '
  type Position = [number, number]

  // 定义获胜组合
  const WINNING_LINES: Position[][] = [
    [
      [0, 0],
      [0, 1],
      [0, 2]
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2]
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2]
    ], // 横向三行
    [
      [0, 0],
      [1, 0],
      [2, 0]
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1]
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2]
    ], // 纵向三列
    [
      [0, 0],
      [1, 1],
      [2, 2]
    ],
    [
      [0, 2],
      [1, 1],
      [2, 0]
    ] // 两条对角线
  ]
  const store = useMainStore()
  const emit = defineEmits<{
    'game-result': [result: GameResult]
    'update-next-game-time': [update: CooldownUpdate]
  }>()

  // 游戏棋盘，3x3阵列，初始填充为空格
  const board = ref<Cell[][]>([
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
  ])
  const canPlay = ref(false)
  // 当前玩家，'X' 或 'O'
  const currentPlayer = ref<Marker>('X')
  // 游戏是否已经结束
  const gameEnded = ref(false)
  const gameStatus = ref('')
  const player = ref(store.player)
  let reservedStake = 0
  let computerTimer: ReturnType<typeof setTimeout> | undefined

  // 检查是否有玩家获胜
  const checkWinner = computed(() => {
    return WINNING_LINES.some(line => line.every(([row, col]) => board.value[row][col] === currentPlayer.value))
  })

  // 检查棋盘是否已满
  const isBoardFull = computed(() => {
    return board.value.flat().every(cell => cell !== ' ')
  })

  // 计算下次游戏可用时间
  const nextGameTime = computed(() => {
    return player.value.nextGameTimes?.ticTacToe || 0
  })

  // 判断玩家是否有足够的钱
  const hasEnoughMoney = computed(() => {
    return player.value.props.money >= 1000
  })

  const finish = () => {
    canPlay.value = Date.now() >= nextGameTime.value && hasEnoughMoney.value
    if (canPlay.value) resetGame()
  }

  // 处理玩家的移动
  const makeMove = (row: number, col: number) => {
    invariant(Number.isInteger(row) && row >= 0 && row < 3 && Number.isInteger(col) && col >= 0 && col < 3, '棋盘坐标越界')
    // 检查单元格是否为空，游戏是否未结束，以及玩家是否可以进行游戏
    if (board.value[row][col] === ' ' && !gameEnded.value && canPlay.value && currentPlayer.value === 'X') {
      if (reservedStake === 0) {
        if (!hasEnoughMoney.value) {
          canPlay.value = false
          return
        }
        reservedStake = 1000
        player.value.props.money -= reservedStake
      }
      // 更新棋盘并检查游戏状态
      updateBoard(row, col, currentPlayer.value)
      if (checkWinner.value) {
        endGame(`恭喜${player.value.name}胜利！`, true)
      } else if (isBoardFull.value) {
        endGame('平局！', false)
      } else {
        // 切换玩家并进行天道的行动
        switchPlayer()
        computerMove()
      }
    }
  }

  // 处理天道的行动
  const computerMove = () => {
    if (!gameEnded.value) {
      computerTimer = setTimeout(() => {
        computerTimer = undefined
        if (gameEnded.value || currentPlayer.value !== 'O') return
        let row: number, col: number
        const emptyCells: Position[] = []
        board.value.forEach((r, i) => r.forEach((c, j) => c === ' ' && emptyCells.push([i, j])))
        if (!emptyCells.length) return
        ;[row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
        updateBoard(row, col, currentPlayer.value)
        if (checkWinner.value) endGame(`恭喜天道胜利！`, false)
        else if (isBoardFull.value) endGame('平局！', false)
        else switchPlayer()
      }, 500)
    }
  }

  // 更新棋盘数据
  const updateBoard = (row: number, col: number, player: Marker) => {
    board.value[row][col] = player
  }

  // 切换当前玩家
  const switchPlayer = () => {
    currentPlayer.value = currentPlayer.value === 'X' ? 'O' : 'X'
    gameStatus.value = `${currentPlayer.value === 'X' ? player.value.name : '天道'}的轮次`
  }

  // 重置游戏状态
  const resetGame = () => {
    clearTimeout(computerTimer)
    computerTimer = undefined
    if (reservedStake > 0) {
      player.value.props.money += reservedStake
      reservedStake = 0
    }
    board.value = [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
      [' ', ' ', ' ']
    ]
    currentPlayer.value = 'X'
    gameEnded.value = false
    gameStatus.value = `${player.value.name}的轮次`
  }

  // 结束游戏并处理结果
  const endGame = (status: string, playerWon: boolean) => {
    if (gameEnded.value || reservedStake === 0) return
    gameStatus.value = status
    gameEnded.value = true
    const reward = playerWon ? 1000 : -1000
    player.value.props.money += reservedStake + reward
    reservedStake = 0
    emit('game-result', { success: playerWon, reward })
    const newNextGameTime = Date.now() + 10 * 60 * 1000
    player.value.nextGameTimes.ticTacToe = newNextGameTime
    emit('update-next-game-time', {
      game: 'ticTacToe',
      time: newNextGameTime
    })
  }

  onMounted(() => {
    canPlay.value = Date.now() >= nextGameTime.value && hasEnoughMoney.value
    gameStatus.value = `${player.value.name}的轮次`
  })

  onUnmounted(() => {
    clearTimeout(computerTimer)
    if (reservedStake > 0) player.value.props.money += reservedStake
    reservedStake = 0
  })
</script>

<style scoped>
  .tic-tac-toe {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 20px;
    background-color: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: var(--el-box-shadow-light);
  }

  .game-board {
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: 10px;
  }

  .row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .cell {
    width: 80px;
    height: 80px;
    font-size: 40px;
    font-weight: bold;
    background-color: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    /* border: none; */
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .cell:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .cell:hover:not(:disabled) {
    background-color: var(--el-fill-color);
  }

  .game-status {
    font-size: 18px;
    font-weight: bold;
    color: var(--el-text-color-primary);
  }

  h3 {
    color: var(--el-text-color-primary);
  }
</style>
