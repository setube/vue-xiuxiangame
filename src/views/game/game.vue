<template>
  <div class="games">
    <el-tabs v-model="tabs">
      <el-tab-pane name="checkin" label="签到">
        <CheckIn @game-result="processGameResult" />
      </el-tab-pane>
      <el-tab-pane name="dice" label="骰子">
        <DiceGame @game-result="processGameResult" />
      </el-tab-pane>
      <el-tab-pane name="rps" label="猜拳">
        <RockPaperScissors @game-result="processGameResult" />
      </el-tab-pane>
      <el-tab-pane name="fortune" label="算卦">
        <FortuneTelling @game-result="processGameResult" />
      </el-tab-pane>
      <el-tab-pane name="toe" label="井棋">
        <Toe @game-result="processGameResult" />
      </el-tab-pane>
      <el-tab-pane name="secret-realm" label="秘境">
        <SecretRealm @game-result="processGameResult" />
      </el-tab-pane>
    </el-tabs>
    <div class="stats">
      <div class="attribute-box">
        <el-row>
          <el-col :span="12" class="attribute-col" v-for="(item, index) in attributeList" :key="index">
            <div class="el-statistic">
              <div class="el-statistic__head">{{ item.name }}</div>
              <div class="el-statistic__content">
                <span class="el-statistic__number">{{ formatNumberToChineseUnit(item.value) }}{{ item.unit }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      <el-button class="attribute-label" @click="router.push('/home')">返回家中</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import Toe from './toe.vue'
  import CheckIn from './checkin.vue'
  import DiceGame from './Dicegame.vue'
  import SecretRealm from './SecretRealm.vue'
  import FortuneTelling from './fortunetelling.vue'
  import RockPaperScissors from './rock.vue'
  import { useRouter } from 'vue-router'
  import { ref, computed, watch, onMounted } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { formatNumberToChineseUnit } from '@/plugins/game'
  import { invariant, assertFiniteNumber, assertRecord } from '@/utils/assert'
  import type { GameResult } from '@/types/game'

  const store = useMainStore()
  const router = useRouter()
  const tabs = ref('checkin')
  const player = ref(store.player)
  const selectedGame = ref<string | null>(null)

  const attributeList = computed(() => {
    return [
      { name: '签到天数', unit: '天', value: player.value.checkinDays },
      { name: '拥有灵石', unit: '枚', value: player.value.props.money },
      { name: '胜利次数', unit: '次', value: player.value.gameWins },
      { name: '失败次数', unit: '次', value: player.value.gameLosses }
    ]
  })

  function assertGameResult(result: unknown): asserts result is GameResult {
    assertRecord(result, '游戏结果')
    invariant(typeof result.success === 'boolean', '游戏结果必须包含胜负状态')
    const reward = result.reward
    if (typeof reward === 'number') {
      assertFiniteNumber(reward, '游戏奖励')
    } else {
      assertRecord(reward, '游戏奖励')
      for (const [key, value] of Object.entries(reward)) {
        invariant(Object.hasOwn(player.value.props, key), '未知的游戏奖励道具')
        assertFiniteNumber(value, `游戏奖励.${key}`)
      }
    }
    if (!result.success) assertFiniteNumber(reward, '游戏扣除灵石')
  }

  const processGameResult = (result: unknown) => {
    assertGameResult(result)
    // Child games settle their own rewards; this event only updates statistics.
    if (result.success) player.value.gameWins++
    else player.value.gameLosses++
  }
  const checkDailyReset = () => {
    const now = new Date()
    const lastCheckinDate = new Date(player.value.lastCheckinDate ?? 0)
    if (now.toDateString() !== lastCheckinDate.toDateString()) player.value.checkedInToday = false
  }

  watch(tabs, newValue => {
    selectedGame.value = newValue
  })

  onMounted(() => {
    checkDailyReset()
  })
</script>

<style scoped>
  .game-container {
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .attribute-box {
    margin-bottom: 10px;
  }

  .attribute-col {
    margin-top: 10px;
  }

  .attribute-label {
    margin: 15px 0;
    width: 40%;
  }
</style>
