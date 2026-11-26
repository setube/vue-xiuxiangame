<template>
  <div class="fortune-telling">
    <el-button @click="tellFortune" :disabled="!canTellFortune" class="fortune-button">
      {{ canTellFortune ? '开始算卦' : '今日已算卦' }}
    </el-button>
    <div v-if="result" class="result">
      <p v-text="result.message" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import type { GameResult } from './types'

  const store = useMainStore()
  const result = ref<{ message: string } | null>(null)
  const player = ref(store.player)

  const emit = defineEmits<{ 'game-result': [result: GameResult] }>()

  const canTellFortune = computed(() => {
    const now = new Date()
    const lastFortune = new Date(player.value.fortuneTellingDate ?? 0)
    return !player.value.fortuneTellingDate || now.toDateString() !== lastFortune.toDateString()
  })

  const tellFortune = () => {
    if (!canTellFortune.value) return
    const fortunes = ['大吉', '中吉', '小吉', '吉', '末吉', '凶', '大凶']
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)]
    const reward = fortune === '大吉' ? 50 : fortune === '中吉' ? 30 : fortune === '小吉' ? 20 : 0
    result.value = {
      message: `您的运势是: ${fortune}${reward > 0 ? `，获得${reward}灵石！` : ''}`
    }
    player.value.fortuneTellingDate = new Date().toISOString()
    player.value.props.money += reward
    emit('game-result', { reward, success: reward > 0 })
  }
</script>

<style scoped>
  .fortune-telling {
    padding: 20px;
    background-color: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: var(--el-box-shadow-light);
  }

  .fortune-button {
    width: 100%;
    background-color: var(--el-color-primary);
    color: var(--el-color-white);
    border: none;
    padding: 12px;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s ease;
  }

  .fortune-button:hover {
    opacity: 0.9;
  }

  .fortune-button:disabled {
    background-color: var(--el-button-disabled-bg-color);
    color: var(--el-button-disabled-text-color);
  }

  .result {
    margin-top: 20px;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }
</style>
