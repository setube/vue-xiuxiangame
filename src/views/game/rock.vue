<template>
  <div class="rps-game">
    <div class="bet-amount">
      <el-input-number v-model="betAmount" :min="100" :step="100" :max="100000" :disabled="!canPlay" />
    </div>
    <div class="options">
      <el-button v-for="option in options" :key="option" @click="play(option)" :disabled="!canPlay">
        {{ option }}
      </el-button>
    </div>
    <div class="game-result" v-if="result">
      <div class="player-choice">
        <div :class="['choice-image', type[result.playerChoice]]" />
        <p>你的选择</p>
      </div>
      <div class="vs">VS</div>
      <div class="computer-choice">
        <div :class="['choice-image', type[result.computerChoice]]" />
        <p>天道的选择</p>
      </div>
    </div>
    <div v-if="result" class="result">
      <p>{{ result.message }}</p>
    </div>
    <div class="message">
      <p v-if="canPlay">请选择</p>
      <p v-else-if="!hasEnoughMoney">灵石不足</p>
      <el-countdown v-else title="冷却中" :value="nextGameTime" @finish="updateCanPlay" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useMainStore } from '@/plugins/store'
  import { ref, computed, watch, onMounted } from 'vue'
  import { invariant } from '@/utils/assert'
  import type { CooldownUpdate, GameResult } from './types'

  type Choice = '石头' | '剪刀' | '布'

  const store = useMainStore()
  const type = {
    布: 'cloth',
    剪刀: 'scissors',
    石头: 'fist'
  }
  const result = ref<{ message: string; playerChoice: Choice; computerChoice: Choice } | null>(null)
  const options = ref<Choice[]>(['石头', '剪刀', '布'])
  const betAmount = ref(100)
  const canPlay = ref(false)
  const player = ref(store.player)
  const emit = defineEmits<{
    'game-result': [result: GameResult]
    'update-next-game-time': [update: CooldownUpdate]
  }>()

  const nextGameTime = computed(() => {
    return player.value.nextGameTimes?.rps || 0
  })

  const hasEnoughMoney = computed(() => {
    return player.value.props.money >= betAmount.value
  })

  const updateCanPlay = () => {
    canPlay.value = Date.now() >= nextGameTime.value && hasEnoughMoney.value
  }

  const play = (playerChoice: Choice) => {
    invariant(Number.isFinite(betAmount.value) && betAmount.value >= 100, '下注金额必须是不小于100的有限数值')
    if (!canPlay.value || !hasEnoughMoney.value) {
      updateCanPlay()
      return
    }
    const computerChoice = options.value[Math.floor(Math.random() * 3)]
    const won =
      (playerChoice === '石头' && computerChoice === '剪刀') ||
      (playerChoice === '剪刀' && computerChoice === '布') ||
      (playerChoice === '布' && computerChoice === '石头')
    const draw = playerChoice === computerChoice
    const reward = won ? betAmount.value * 2 : draw ? 0 : betAmount.value
    result.value = {
      message: won ? `恭喜您赢得了${reward}灵石！` : draw ? '很遗憾，五五开!' : '很遗憾，您输了。',
      playerChoice,
      computerChoice
    }
    if (won) {
      player.value.props.money += reward - betAmount.value
    } else {
      player.value.props.money -= reward
    }
    emit('game-result', { success: won, reward })
    const newNextGameTime = Date.now() + 10 * 60 * 1000
    player.value.nextGameTimes.rps = newNextGameTime
    emit('update-next-game-time', {
      game: 'rps',
      time: newNextGameTime
    })
    canPlay.value = false
  }

  watch(betAmount, () => updateCanPlay())

  onMounted(() => {
    updateCanPlay()
  })
</script>

<style scoped>
  .rps-game {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .bet-amount {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .options {
    display: flex;
    gap: 10px;
  }

  .game-result {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
  }

  .player-choice,
  .computer-choice {
    text-align: center;
  }

  .vs {
    font-size: 24px;
    font-weight: bold;
  }

  .choice-image {
    width: 100px;
    height: 100px;
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }

  .result {
    text-align: center;
  }

  .fist {
    background-image: url(@/assets/fist.svg);
  }

  .cloth {
    background-image: url(@/assets/cloth.svg);
  }

  .scissors {
    background-image: url(@/assets/scissors.svg);
  }

  .message {
    margin-bottom: 20px;
  }
</style>
