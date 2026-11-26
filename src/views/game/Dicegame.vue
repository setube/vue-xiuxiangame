<template>
  <div class="dice-game">
    <div class="options">
      <el-radio-group v-model="betType">
        <el-radio value="big" :disabled="!canBet || isRolling" label="大" />
        <el-radio value="small" :disabled="!canBet || isRolling" label="小" />
        <el-radio value="odd" :disabled="!canBet || isRolling" label="单" />
        <el-radio value="even" :disabled="!canBet || isRolling" label="双" />
      </el-radio-group>
    </div>
    <el-input-number class="bet-amount" v-model="betAmount" :min="100" :step="100" :max="1000000" :disabled="!canBet || isRolling" />
    <el-button @click="placeBet" :disabled="!canBet || isRolling" v-if="canBet">下注灵石</el-button>
    <el-countdown :title="hasEnoughMoney ? '冷却中' : '灵石不足'" :value="nextGameTime" @finish="updateCanBet" v-else />
    <div :class="['dice', 'dice-' + diceNumber, { rolling: isRolling }]" />
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { gameNotifys } from '@/plugins/game'
  import { invariant } from '@/utils/assert'
  import type { CooldownUpdate, GameResult } from './types'

  type BetType = 'big' | 'small' | 'odd' | 'even'

  const store = useMainStore()

  const player = ref(store.player)
  const canBet = ref(false)
  const betType = ref<BetType>('big')
  const betAmount = ref(100)
  const isRolling = ref(false)
  const diceNumber = ref(1)

  const emit = defineEmits<{
    'game-result': [result: GameResult]
    'update-next-game-time': [update: CooldownUpdate]
  }>()
  let rollInterval: ReturnType<typeof setInterval> | undefined
  let reservedBet: number | undefined

  const hasEnoughMoney = computed(() => {
    return player.value.props.money >= betAmount.value
  })

  const nextGameTime = computed(() => {
    return player.value.nextGameTimes?.dice || 0
  })

  const updateCanBet = () => {
    canBet.value = Date.now() >= nextGameTime.value && hasEnoughMoney.value
  }

  const placeBet = () => {
    invariant(Number.isFinite(betAmount.value) && betAmount.value >= 100, '下注金额必须是不小于100的有限数值')
    if (isRolling.value) return
    if (!canBet.value || !hasEnoughMoney.value) {
      gameNotifys({ title: '无法下注', message: '灵石不足或正在冷却中' })
      return
    }
    const wager = betAmount.value
    const wagerType = betType.value
    player.value.props.money -= wager
    reservedBet = wager
    isRolling.value = true
    let rollCount = 0
    rollInterval = setInterval(() => {
      diceNumber.value = Math.floor(Math.random() * 6) + 1
      rollCount++
      if (rollCount >= 20) {
        clearInterval(rollInterval)
        rollInterval = undefined
        finishRoll(wager, wagerType)
      }
    }, 100)
  }

  const finishRoll = (wager: number, wagerType: BetType) => {
    const dice = diceNumber.value
    let won = false
    switch (wagerType) {
      case 'big':
        won = dice > 3
        break
      case 'small':
        won = dice <= 3
        break
      case 'odd':
        won = dice % 2 !== 0
        break
      case 'even':
        won = dice % 2 === 0
        break
    }
    const reward = won ? wager * 2 : 0
    canBet.value = false
    reservedBet = undefined
    player.value.props.money += reward
    gameNotifys({ title: `骰子点数: ${dice}`, message: won ? `恭喜您赢得了${reward}灵石！` : '很遗憾，您输了。' })
    emit('game-result', { success: won, reward })
    const newNextGameTime = Date.now() + 10 * 60 * 1000
    player.value.nextGameTimes.dice = newNextGameTime
    emit('update-next-game-time', { game: 'dice', time: newNextGameTime })
    isRolling.value = false
    updateCanBet()
  }

  watch(betAmount, () => updateCanBet())

  onMounted(() => {
    updateCanBet()
  })

  onUnmounted(() => {
    clearInterval(rollInterval)
    if (reservedBet !== undefined) player.value.props.money += reservedBet
    reservedBet = undefined
  })
</script>

<style scoped>
  .dice-game {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .options {
    margin-top: 10px;
  }

  .bet-amount {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dice {
    width: 100px;
    height: 100px;
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }

  .dice-1 {
    background-image: url(../../assets/dice1.svg);
  }

  .dice-2 {
    background-image: url(../../assets/dice2.svg);
  }

  .dice-3 {
    background-image: url(../../assets/dice3.svg);
  }

  .dice-4 {
    background-image: url(../../assets/dice4.svg);
  }

  .dice-5 {
    background-image: url(../../assets/dice5.svg);
  }

  .dice-6 {
    background-image: url(../../assets/dice6.svg);
  }

  .rolling {
    animation: roll 0.1s linear infinite;
  }

  @keyframes roll {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
</style>
