<template>
  <div class="check-in">
    <div class="check-in-calendar">
      <div
        v-for="day in 7"
        :key="day"
        class="day-box"
        :class="{ checked: isCheckedIn(day), current: isCurrentDay(day) }"
      >
        <span class="day-number">{{ day }}</span>
        <span class="reward">{{ getReward(day) }}</span>
      </div>
    </div>
    <el-button @click="checkIn" :disabled="!canCheckIn" class="check-in-button">
      {{ canCheckIn ? '签到' : '今日已签到' }}
    </el-button>
    <p class="streak-info">当前连续签到: {{ player.checkinStreak }}天</p>
    <p class="next-bonus">距离下次额外奖励: {{ daysUntilNextBonus }}天</p>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { gameNotifys } from '@/plugins/game'
  import type { GameResult } from './types'

  const store = useMainStore()

  const player = ref(store.player)
  const rewards = ref([100, 200, 300, 400, 500, 1000, 2000])
  const bonusRewards = ref([100, 2000, 5000])

  const emit = defineEmits<{ 'game-result': [result: GameResult] }>()

  const canCheckIn = computed(() => {
    const now = new Date()
    const lastCheckin = new Date(player.value.lastCheckinDate ?? 0)
    return !player.value.lastCheckinDate || now.toDateString() !== lastCheckin.toDateString()
  })

  const daysUntilNextBonus = computed(() => {
    return 7 - (player.value.checkinStreak % 7)
  })

  const isCheckedIn = (day: number) => {
    return day <= player.value.checkinStreak % 7
  }

  const isCurrentDay = (day: number) => {
    return day === (player.value.checkinStreak % 7) + 1
  }

  const getReward = (day: number) => {
    return rewards.value[day - 1] + (day === 7 ? bonusRewards.value[Math.min(Math.floor(player.value.checkinStreak / 7), bonusRewards.value.length - 1)] : 0)
  }

  const checkIn = () => {
    if (!canCheckIn.value) return
    const dayInStreak = (player.value.checkinStreak % 7) + 1
    let reward = rewards.value[dayInStreak - 1]
    if (dayInStreak === 7) {
      const bonusLevel = Math.floor(player.value.checkinStreak / 7)
      reward += bonusRewards.value[Math.min(bonusLevel, 2)]
    }
    player.value.checkinStreak++
    player.value.checkinDays++
    player.value.lastCheckinDate = new Date().toISOString()
    player.value.props.cultivateDan += reward
    player.value.props.money += dayInStreak * 1000
    emit('game-result', { success: true, reward })
    gameNotifys({ title: '签到成功', message: `获得 ${reward} 培养丹！` })
  }
</script>

<style scoped>
  .check-in {
    padding: 20px;
    background-color: var(--el-bg-color);
    border-radius: 12px;
    color: var(--el-text-color-primary);
  }

  h3 {
    color: var(--el-text-color-primary);
  }

  .check-in-calendar {
    display: flex;
    overflow: auto;
    justify-content: center;
  }

  .day-box {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: var(--el-fill-color-light);
    font-size: 14px;
    transition: all 0.3s ease;
    color: var(--el-text-color-primary);
    margin-left: 10px;
  }

  .day-box.checked {
    background-color: var(--el-color-success);
    color: var(--el-color-white);
  }

  .day-box.current {
    border: 2px solid var(--el-color-primary);
  }

  .day-number {
    font-weight: bold;
  }

  .reward {
    font-size: 12px;
  }

  .check-in-button {
    width: 100%;
    margin-top: 20px;
    background-color: var(--el-color-primary);
    color: var(--el-color-white);
    border: none;
    padding: 12px;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s ease;
  }

  .check-in-button:disabled {
    background-color: var(--el-button-disabled-bg-color);
    color: var(--el-button-disabled-text-color);
  }

  .streak-info,
  .next-bonus {
    margin-top: 10px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  @media only screen and (max-width: 768px) {
    .check-in-calendar {
      display: -webkit-box;
    }
  }
</style>
