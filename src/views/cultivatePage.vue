<template>
  <div class="cultivate">
    <div class="cultivation-info">
      <div class="realm-display">
        当前境界：
        <span class="realm-text" v-text="`${levelNames(player.level)}(${player.reincarnation || 0}转)`" />
      </div>
      <el-progress
        :percentage="cultivationPercentage"
        :format="(percentage: number) => `${percentage.toFixed(2)}%`"
        text-inside
        :stroke-width="20"
        status="success"
        class="custom-progress"
      />
    </div>
    <div class="storyText">
      <div class="storyText-box">
        <el-scrollbar ref="scrollbar" always>
          <p v-for="(item, index) in texts" :key="index" v-html="item" />
        </el-scrollbar>
      </div>
    </div>
    <div class="actions">
      <div class="action" v-for="(item, index) in buttonsFor" :key="index">
        <el-button class="item" @click="item.click" :disabled="item.disabled">{{ item.text }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ScrollbarInstance } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { ref, computed, onUnmounted, onMounted } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import equip from '@/plugins/equip'
  import { maxLv, smoothScrollToBottom, levelNames, gameNotifys } from '@/plugins/game'
  import { ElMessageBox } from 'element-plus'

  const store = useMainStore()
  const router = useRouter()
  const texts = ref<string[]>([])
  const player = ref(store.player)
  const isStop = ref(false)
  const isStart = ref(false)
  const timerIds = ref<ReturnType<typeof setInterval>[]>([])
  const observer = ref<MutationObserver | null>(null)
  const scrollbar = ref<ScrollbarInstance | null>(null)
  const buttonsFor = computed(() => {
    return [
      { text: '开始修炼', click: () => startCultivate(), disabled: !isStart.value },
      { text: '停止修炼', click: () => stopCultivate(), disabled: !isStop.value },
      { text: '转生突破', click: () => reincarnationBreakthrough() },
      { text: '返回家里', click: () => router.push('/home') }
    ]
  })

  const cultivationPercentage = computed(() => {
    const { cultivation, maxCultivation } = player.value
    return Math.min(100, (cultivation / maxCultivation) * 100)
  })

  const startCultivate = () => {
    isStart.value = false
    const zs = player.value.reincarnation * 10
    const time = zs >= 200 ? 100 : 300 - zs
    const timerId = setInterval(() => {
      if (player.value.cultivation <= player.value.maxCultivation) {
        isStop.value = true
        isStart.value = false
        const exp =
          player.value.level <= 10
            ? Math.floor(player.value.maxCultivation / equip.getRandomInt(10, 30))
            : Math.floor(player.value.maxCultivation / 100)
        texts.value.push(
          player.value.level < maxLv
            ? '你开始冥想，吸收周围的灵气。修为提升了！'
            : '你当前的境界已修炼圆满, 需要转生后才能继续修炼'
        )
        breakThrough(exp)
        // 10%的概率触发随机事件
        if (Math.random() < 0.1) triggerRandomEvent()
      } else {
        breakThrough(100)
      }
    }, time)
    timerIds.value.push(timerId)
  }

  const triggerRandomEvent = () => {
    const randomEvents = [
      { type: 'resource', name: '灵石', amount: 100, description: '你发现了一堆灵石！' },
      { type: 'cultivation', name: '顿悟', amount: 500, description: '你突然顿悟，修为大涨！' },
      { type: 'item', name: '丹药', effect: '增加100点修为', description: '你获得了一颗珍贵的丹药！' },
      { type: 'skill', name: '剑法', effect: '增加10%攻击力', description: '你领悟了一门高深剑法！' },
      { type: 'lucky', name: '雷劫', effect: '修为降低10%', description: '你遭遇了雷劫！' }
    ] as const
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)]
    texts.value.push(`<span style="color: #E6A23C">${event.description}</span>`)
    switch (event.type) {
      case 'resource':
        player.value.props.money += event.amount
        break
      case 'cultivation':
        player.value.cultivation += event.amount
        break
      // 增加修为
      case 'item':
        player.value.cultivation += player.value.cultivation * 0.05
        break
      // 减少修为
      case 'lucky':
        player.value.cultivation -= player.value.cultivation * 0.1
        break
      // 增加攻击力
      case 'skill':
        player.value.attack *= 1.1
        break
    }
  }

  const stopCultivate = () => {
    timerIds.value.forEach(id => {
      clearInterval(id)
    })
    timerIds.value = []
    isStart.value = true
    isStop.value = false
  }

  const breakThrough = (exp: number) => {
    const reincarnation = player.value.reincarnation ? player.value.reincarnation + 1 : 1
    if (player.value.level < maxLv) {
      if (player.value.cultivation >= player.value.maxCultivation) {
        if (player.value.level > 10 && player.value.level > player.value.taskNum) {
          stopCultivate()
          isStop.value = false
          isStart.value = false
          texts.value.push(
            `当前境界修为已满, 你需要通过击败<span class="textColor">(${player.value.taskNum} / ${player.value.level})</span>个敌人证道突破`
          )
          return
        }
        player.value.taskNum = 0
        player.value.level++
        player.value.points += 3
        player.value.health = player.value.maxHealth
        player.value.maxCultivation = Math.floor(100 * Math.pow(2, player.value.level * reincarnation))
        texts.value.push(`恭喜你突破了！当前境界：${levelNames(player.value.level)}`)
      } else {
        player.value.cultivation += exp
      }
    } else {
      isStop.value = false
      isStart.value = false
      player.value.level = maxLv
      player.value.maxCultivation = Math.floor(100 * Math.pow(2, maxLv * reincarnation))
      stopCultivate()
    }
  }

  const reincarnationBreakthrough = () => {
    let reincarnation = player.value.reincarnation
    reincarnation = reincarnation == 0 ? 1 * 100 : reincarnation * 100
    if (player.value.level == maxLv) {
      if (player.value.points) {
        gameNotifys({ title: '未满足转生条件', message: `当前还有${player.value.points}境界点未使用, 无法转生` })
        return
      }
      if (player.value.taskNum >= reincarnation) {
        const txt =
          player.value.reincarnation == 0
            ? '转生之后的敌人属性是转生前的百倍<br>转生前请务必确认自己的实力是否足够战胜转生后的对手, 避免卡档后删档重练'
            : '转生操作不可逆, 是否确定要转生?'
        ElMessageBox.confirm(txt, '转生提醒', {
          center: true,
          cancelButtonText: '取消转生',
          confirmButtonText: '立即转生',
          dangerouslyUseHTMLString: true
        })
          .then(() => {
            player.value.level = 0
            player.value.taskNum = 0
            player.value.cultivation = 0
            player.value.maxCultivation = 100
            player.value.reincarnation++
            player.value.backpackCapacity += 50
            gameNotifys({
              title: '转生提示',
              message: `转生成功, 当前为${player.value.reincarnation}转, 背包总容量增加50`,
              dangerouslyUseHTMLString: true
            })
          })
          .catch(() => {})
      } else {
        gameNotifys({
          title: '未满足转生条件',
          message: `需要通过击败<span class="textColor">(${player.value.taskNum} / ${reincarnation})</span>个敌人证道转生`,
          dangerouslyUseHTMLString: true
        })
      }
    } else {
      gameNotifys({
        title: '未满足转生条件',
        message: `境界需要达到<span class="textColor">${levelNames(maxLv)}</span>才能满足转生条件`,
        dangerouslyUseHTMLString: true
      })
    }
  }

  const setupObserver = () => {
    const element = scrollbar.value?.wrapRef
    if (element) {
      observer.value = new MutationObserver(() => smoothScrollToBottom(element))
      observer.value.observe(element, { subtree: true, childList: true })
    }
  }

  const stopObserving = () => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  }

  onMounted(() => {
    startCultivate()
    setupObserver()
  })

  onUnmounted(() => {
    stopCultivate()
    stopObserving()
  })
</script>

<style scoped>
  .cultivate {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  .cultivation-info {
    width: 100%;
    margin-bottom: 20px;
  }

  .custom-progress {
    width: 100%;
  }

  .realm-display {
    margin-bottom: 10px;
    font-size: 16px;
    text-align: center;
  }

  .realm-text {
    color: var(--el-color-primary);
    font-weight: bold;
  }

  .storyText {
    width: 100%;
  }

  .storyText-box {
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    margin-bottom: 20px;
    width: 100%;
    box-sizing: border-box;
  }

  .actions {
    width: 100%;
  }

  .action {
    width: calc(25% - 10px);
  }

  .item {
    width: 100%;
  }

  .event-text {
    color: #e6a23c;
    font-weight: bold;
  }

  @media (max-width: 768px) {
    .action {
      width: calc(50% - 10px);
    }
  }
</style>
