<template>
  <div>
    <div class="legend">
      <div class="legend-item">
        <div class="color-box player"></div>
        玩家
      </div>
      <div class="legend-item">
        <div class="color-box npc"></div>
        NPC
      </div>
      <div class="legend-item">
        <div class="color-box fishing"></div>
        钓鱼点
      </div>
      <div class="legend-item">
        <div class="color-box obstacle"></div>
        障碍物
      </div>
      <div class="legend-item">
        <div class="color-box empty"></div>
        空地
      </div>
    </div>
    <div class="map">
      <div class="grid-container">
        <div
          v-for="(cell, index) in grid"
          :key="index"
          :ref="el => setCellRef(el, index)"
          :class="['grid-item', cell.type, `x-${index % gridSize}`, `y-${Math.floor(index / gridSize)}`]"
          :style="{ backgroundColor: cell.his }"
          @click="gridInfo(index, cell)"
        />
      </div>
    </div>
    <div class="controls">
      <el-button class="home-button" @click="move('q')">
        回家
        <span class="shortcutKeys">(Q)</span>
      </el-button>
      <el-button class="up-button" @click="move('up')" :disabled="isTopObstacle || playerY == 0">
        往北
        <span class="shortcutKeys">(W)</span>
      </el-button>
      <el-button class="dialogue-button" @click="move('e')" :disabled="!isNpc && !isFishing">
        {{ isNpc || !isFishing ? '对话' : '钓鱼' }}
        <span class="shortcutKeys">(E)</span>
      </el-button>
      <el-button class="left-button" @click="move('left')" :disabled="isLeftObstacle || playerX === 0">
        往西
        <span class="shortcutKeys">(A)</span>
      </el-button>
      <el-button class="down-button" @click="move('down')" :disabled="isDownObstacle || playerY === gridSize - 1">
        往南
        <span class="shortcutKeys">(S)</span>
      </el-button>
      <el-button class="right-button" @click="move('right')" :disabled="isRightObstacle || playerX === gridSize - 1">
        往东
        <span class="shortcutKeys">(D)</span>
      </el-button>
    </div>
    <el-drawer v-model="fishingShow" @close="endGame" title="钓鱼" direction="rtl" class="strengthen">
      <div class="game-container">
        <div class="time">倒计时: {{ fishing.timeLeft }}秒</div>
        <div class="outer-wrapper">
          <div class="progress-bar-container">
            <div class="progress-bar" ref="progressBar" :style="{ height: fishing.progressPercentage }" />
            <div class="progress-text">{{ fishing.progressText }}%</div>
          </div>
          <div
            class="outer-container"
            ref="outerContainer"
            :style="{
              border: fishing.overlap ? '2px solid var(--el-color-warning)' : '2px solid var(--el-border-color)'
            }"
          >
            <div
              class="moving-container"
              ref="movingContainer"
              :style="{
                animation: fishing.overlap ? 'wobble .5s ease-in-out infinite' : '',
                transformOrigin: fishing.overlap ? 'bottom center' : ''
              }"
            >
              <svg viewBox="0 0 1024 1024">
                <path
                  d="M942 619.8c-27.4-29.4-42.5-67.6-42.5-107.8s15.1-78.4 42.5-107.8c14.8-15.8 18.6-38 10-58-8.6-19.8-27.3-32.2-48.9-32.3h-0.9c-35.3 0-70 9.4-100.2 27.2-29.4 17.3-53.9 41.9-71.1 71.4-2.8 4.8-7.3 6-9.7 6.4-4.2 0.6-8.4-0.8-11.3-3.8-38.3-38.2-82.9-68.2-132.5-89.1-51.4-21.7-105.9-32.7-162.2-32.7-29.1 0-57.6 2.9-85.5 8.7l-1.1 0.3c-33.5 7.1-66 18.3-97.1 33.6-28.6 14.1-55.7 31.5-80.5 51.8l-0.2 0.2c-2.1 1.7-4.1 3.4-6.2 5.2-0.4 0.4-0.9 0.8-1.3 1.1l-4.5 3.9c-0.6 0.5-1.2 1.1-1.8 1.6-1.7 1.5-3.3 3-5 4.5-0.8 0.7-1.6 1.5-2.4 2.3-1 1-2.1 2-3.1 2.9-0.8 0.8-1.6 1.5-2.4 2.3l-4.5 4.5c-0.8 0.8-1.6 1.6-2.4 2.5-1 1.1-2.1 2.1-3.1 3.2-0.7 0.8-1.4 1.5-2.2 2.3l-4.5 4.8c-0.6 0.7-1.3 1.4-1.9 2.1-1.3 1.5-2.7 3-4 4.5-0.3 0.4-0.7 0.8-1 1.1-1.6 1.9-3.3 3.8-4.9 5.7-0.4 0.5-0.9 1-1.3 1.6-1.7 2-3.3 4-4.9 6-14.1 17.6-21.9 39.7-21.9 62.2s7.8 44.6 21.9 62.2c1.6 2 3.3 4 4.9 6 0.4 0.5 0.9 1 1.3 1.6 1.6 1.9 3.2 3.8 4.9 5.7 0.3 0.4 0.7 0.7 1 1.1 1.3 1.5 2.7 3 4 4.5 0.6 0.7 1.3 1.4 1.9 2.1 1.5 1.6 3 3.3 4.6 4.9 0.7 0.7 1.4 1.5 2.1 2.2 1 1.1 2.1 2.2 3.1 3.2l2.4 2.4c1.5 1.5 3 3 4.6 4.5 0.8 0.8 1.6 1.5 2.4 2.3 1 1 2.1 2 3.1 3 0.8 0.7 1.6 1.5 2.4 2.2 1.7 1.5 3.3 3 5 4.5 0.6 0.5 1.2 1.1 1.8 1.6l4.5 3.9c0.4 0.4 0.9 0.7 1.3 1.1 2.1 1.8 4.1 3.5 6.2 5.2 0.1 0 0.1 0.1 0.2 0.1 24.8 20.3 51.9 37.8 80.5 51.9 31.2 15.3 63.7 26.5 97.1 33.6l1.1 0.3c27.8 5.8 56.4 8.7 85.5 8.7 56.2 0 110.8-11 162.2-32.7 49.6-20.9 94.2-50.9 132.5-89.1 3-3 7.1-4.3 11.3-3.8 2.4 0.3 6.9 1.6 9.7 6.4 17.1 29.4 41.7 54.1 71.1 71.4 30.3 17.8 64.9 27.2 100.2 27.2h0.9c21.5-0.1 40.3-12.5 48.8-32.3 8.6-20.3 4.8-42.5-10-58.3z m-619.8 59.4c-76.3-19.4-145.4-62.9-196.3-123.6-0.3-0.4-0.6-0.7-0.9-1.1-1.5-1.8-2.9-3.5-4.4-5.3 0 0 0-0.1-0.1-0.1-11.5-14.4-15.5-32.4-11.9-49.4 0.3-1.6 0.8-3.2 1.2-4.8s1-3.2 1.6-4.7c2.2-5.4 5.2-10.6 9-15.4 1.5-1.8 3-3.7 4.5-5.5 0.3-0.3 0.6-0.7 0.9-1 50.9-60.7 120.1-104.2 196.3-123.6 54.7 38.3 87.1 100.2 87.1 167.2 0.1 67.2-32.3 129.1-87 167.3z m593.1-17.3c-1.1 2.5-4.4 8.2-12.3 8.2h-0.8c-28.2 0-55.8-7.5-80-21.7-23.5-13.8-43.1-33.5-56.8-57-8.3-14.3-22.6-23.7-39.1-25.9-16.6-2.2-32.9 3.3-44.8 15.1-71.3 71-165.9 110.2-266.4 110.2-13.9 0-27.8-0.8-41.4-2.3 47.9-45.6 75.5-108.9 75.5-176.6s-27.6-131-75.5-176.6c13.7-1.5 27.5-2.3 41.4-2.3 100.5 0 195.2 39.1 266.4 110.2 11.8 11.8 28.1 17.3 44.8 15.1 16.5-2.2 30.8-11.6 39.1-25.9 13.7-23.5 33.3-43.2 56.8-57 24.1-14.2 51.8-21.7 80-21.7h0.7c7.9 0 11.2 5.7 12.3 8.2s3 8.9-2.5 14.8c-34.3 36.8-53.2 84.8-53.2 135.1s18.9 98.3 53.2 135.1c5.6 6.1 3.7 12.5 2.6 15z"
                  :fill="fishing.overlap ? 'var(--el-color-warning)' : 'var(--el-border-color)'"
                />
                <path
                  d="M273 515.4m-30 0a30 30 0 1 0 60 0 30 30 0 1 0-60 0Z"
                  :fill="fishing.overlap ? 'var(--el-color-warning)' : 'var(--el-border-color)'"
                />
              </svg>
            </div>
            <div class="inner-container" ref="innerContainer">
              <svg viewBox="0 0 1024 1024">
                <path
                  d="M893.456828 709.055005"
                  :fill="fishing.overlap ? 'var(--el-color-warning)' : 'var(--el-border-color)'"
                />
                <path
                  d="M491.889987 337.939709"
                  :fill="fishing.overlap ? 'var(--el-color-warning)' : 'var(--el-border-color)'"
                />
                <path
                  d="M568.154951 338.993714"
                  :fill="fishing.overlap ? 'var(--el-color-warning)' : 'var(--el-border-color)'"
                />
                <path
                  d="M789.271978 570.404178c-10.123568-32.030507-33.907251-88.211041-88.099501-128.403438 59.974953 92.142583 39.444361 191.201693 16.587793 231.574193 19.583011-9.214872 48.428989-39.642882 48.428989-39.642882s5.043876 37.219693-1.590218 81.112366c-2.619664 2.876514-4.52199 6.466272-5.253654 10.576893-14.963807 83.60514-81.932034 172.931584-216.578664 172.931584-129.71634 0-226.874147-110.219287-226.874147-262.079974L315.892577 167.967526c0-1.240247 2.843768-2.440585 2.641153-3.623527 24.40483-7.115048 43.811832-29.649274 43.811832-56.31561 0-32.355919-25.581632-58.68968-57.93755-58.68968s-58.313104 26.332738-58.313104 58.68968c0 23.514553 11.484565 43.790342 31.504528 53.148477-0.724501 2.143826-3.66139 4.402263-3.66139 6.791683l0 468.503347c0 176.588881 114.748441 304.763099 269.192975 304.763099 130.210597 0 230.4066-78.81709 255.399831-201.286376 2.036379-0.156566 4.120854-0.963954 4.539386-2.777253C817.526485 674.573679 802.432719 618.005312 789.271978 570.404178zM305.160141 81.350796c14.71412 0 26.676569 11.962449 26.676569 26.676569s-11.962449 26.676569-26.676569 26.676569-26.676569-11.962449-26.676569-26.676569S290.446022 81.350796 305.160141 81.350796z"
                  :fill="fishing.overlap ? 'var(--el-color-warning)' : 'var(--el-border-color)'"
                />
              </svg>
            </div>
          </div>
        </div>
        <el-button
          @touchstart="startFishing"
          @touchend="stopFishing"
          @mousedown="startFishing"
          @mouseup="stopFishing"
          @mouseleave="stopFishing"
          @click="moveButton"
          :disabled="fishing.disabled"
          class="button"
        >
          钓鱼
          <span class="diaoyu-shortcutKeys">({{ holdingId ? '松开' : '长按' }})</span>
        </el-button>
      </div>
    </el-drawer>
    <el-drawer v-model="npcShow" :title="npcInfo.name" direction="rtl" class="strengthen">
      <div class="wife-box">
        <div class="attributes">
          <div class="attribute-box">
            <div class="tag attribute">境界: {{ levelNames(npcInfo.lv) }} ({{ npcInfo.reincarnation }}转)</div>
            <div class="tag attribute">气血: 不详</div>
            <div class="tag attribute">攻击: 不详</div>
            <div class="tag attribute">防御: 不详</div>
            <div class="tag attribute">闪避: 不详</div>
            <div class="tag attribute">暴击: 不详</div>
            <div class="tag attribute">好感度: {{ npcInfo.favorability }}</div>
          </div>
        </div>
        <div class="click-box">
          <el-button type="primary" @click="giftShow = !giftShow">
            {{ giftShow ? '取消赠送' : '赠送礼物' }}
          </el-button>
          <el-button
            type="primary"
            :disabled="npcInfo.favorability < 1000 || isHaveWife(npcInfo.name)"
            @click="harvestNpc(npcInfo)"
          >
            {{ isHaveWife(npcInfo.name) ? '已结为道侣' : '结为道侣' }}
          </el-button>
        </div>
        <div class="gift-box" v-if="giftShow">
          <div class="gift-item" v-for="(item, index) in giftItems" :key="index" @click="giftInfo(item, index)">
            <tag :type="item.lv">{{ item.name }}</tag>
            <span class="gift-name">{{ item.price }}灵石</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
  // tag组件
  import tag from '@/components/tag.vue'
  // npc
  import npc from '@/plugins/npc'
  // 怪物
  import monster from '@/plugins/monster'
  import { useRouter } from 'vue-router'
  import { ref, computed, onUnmounted, onMounted, nextTick } from 'vue'
  import { useMainStore } from '@/plugins/store'
  import { ElMessageBox } from 'element-plus'
  import { levelNames, gameNotifys } from '@/plugins/game'
  import MinHeap from '@/plugins/minheap'
  import type { ComponentPublicInstance } from 'vue'
  import type { MapCell, NPC, Quality } from '@/types/game'
  import { invariant } from '@/utils/assert'

  type Position = [number, number]
  type Direction = 'up' | 'down' | 'left' | 'right'
  interface Gift { lv: Quality; plus: number; name: string; price: number }
  interface FishingState {
    score: number; bottom: string; overlap: boolean; timerIds: number[]
    timeLeft: number; gameOver: boolean; disabled: boolean; timeExpired: boolean
    progressText: number; innerPosition: number; moveUpAnimationId: number
    progressPercentage: string; moveDownAnimationId: number; moveParentContainerId: number
  }

  const router = useRouter()
  const store = useMainStore()
  // 保存每个格子的数据
  const grid = ref<MapCell[]>([])
  // 玩家数据
  const player = ref(store.player)
  // 地图数据
  const mapData = ref(store.mapData)
  // 玩家在X轴的位置
  const playerX = ref(0)
  // 玩家在Y轴的位置
  const playerY = ref(0)
  const npcInfo = ref<NPC>({ name: '', lv: 0, position: 0, favorability: 0, reincarnation: 0 })
  // 钓鱼相关
  const fishing = ref<FishingState>({
    // 分数
    score: 0,
    bottom: '0px',
    // 是否重叠
    overlap: false,
    // 存储定时
    timerIds: [],
    // 剩余时间
    timeLeft: 60,
    // 游戏结束
    gameOver: false,
    // 禁用按钮
    disabled: false,
    // 时间结束
    timeExpired: false,
    // 进度
    progressText: 0,
    // 内部容器位置
    innerPosition: 0,
    // 向上移动的动画ID
    moveUpAnimationId: 0,
    // 进度条百分比
    progressPercentage: '0%',
    // 向下移动的动画ID
    moveDownAnimationId: 0,
    // 父容器的动画ID
    moveParentContainerId: 0
  })
  const npcShow = ref(false)
  // 地图的大小
  const gridSize = ref(50)
  const giftShow = ref(false)
  // NPC的数量
  const npcCount = ref(10)
  // 是否正在长按
  const holdingId = ref<number | null>(null)
  // 钓鱼点坐标
  const fishingMap = ref<number[]>([])
  // 钓鱼弹窗
  const fishingShow = ref(false)
  // 障碍物的数量
  const obstacleCount = ref(0)
  const cellRefs = ref<(HTMLElement | null)[]>([])
  const movingContainer = ref<HTMLElement | null>(null)
  const outerContainer = ref<HTMLElement | null>(null)
  const innerContainer = ref<HTMLElement | null>(null)
  const setCellRef = (element: Element | ComponentPublicInstance | null, index: number) => {
    cellRefs.value[index] = element instanceof HTMLElement ? element : null
  }
  // 礼物列表
  const giftItems = computed(() => {
    const arr: Gift[] = []
    const num: Record<number, string> = {
      1: '一',
      2: '二',
      3: '三',
      4: '四',
      5: '五',
      6: '六'
    }
    const lv: Record<number, Quality> = {
      1: 'info',
      2: 'success',
      3: 'primary',
      4: 'purple',
      5: 'warning',
      6: 'danger'
    }
    const price: Record<number, number> = {
      1: 200,
      2: 400,
      3: 800,
      4: 1500,
      5: 2000,
      6: 3000
    }
    for (let i = 1; i < 7; i++) {
      arr.push({
        lv: lv[i],
        plus: price[i] / 100,
        name: `${num[i]}品驻颜丹`,
        price: price[i]
      })
    }
    return arr
  })

  const totalCells = computed(() => {
    return gridSize.value * gridSize.value
  })

  const nearbyIndices = computed(() => {
    return [
      (playerY.value - 1) * gridSize.value + playerX.value, // 上
      (playerY.value + 1) * gridSize.value + playerX.value, // 下
      playerY.value * gridSize.value + (playerX.value - 1), // 左
      playerY.value * gridSize.value + (playerX.value + 1) // 右
    ]
  })

  // 计算玩家附近是否有NPC
  const isNpc = computed(() => {
    return nearbyIndices.value.some(index => grid.value[index]?.type === 'npc')
  })

  // 计算玩家附近是否有钓鱼点
  const isFishing = computed(() => {
    return nearbyIndices.value.some(index => grid.value[index]?.type === 'fishing')
  })

  // 判断玩家上方有没有障碍物
  const isTopObstacle = computed(() => {
    return checkDirection('up')
  })

  // 判断玩家左方有没有障碍物
  const isLeftObstacle = computed(() => {
    return checkDirection('left')
  })

  // 判断玩家下方有没有障碍物
  const isDownObstacle = computed(() => {
    return checkDirection('down')
  })

  // 判断玩家右方有没有障碍物
  const isRightObstacle = computed(() => {
    return checkDirection('right')
  })

  // 回家
  const goHome = () => {
    router.push('/home')
    if (playerX.value !== 0 || playerY.value !== 0) {
      store.mapData = { y: 0, x: 0, map: [] }
      // 重置所有钓鱼数据
      resetFishingData(false)
      // 重置玩家所在行
      store.mapScroll = 0
    }
  }

  // 清空所有定时
  const clearAllTiming = () => {
    fishing.value.timerIds.forEach(id => clearInterval(id))
    fishing.value.timerIds = []
  }

  // 初始化地图
  const initializeGrid = () => {
    // 生成地图
    grid.value = Array(totalCells.value)
      .fill(null)
      .map<MapCell>(() => ({ his: '', type: 'empty' }))
    const safeZone = createSafeZone()
    // 障碍物的数量
    obstacleCount.value = Math.floor(totalCells.value * 0.1)
    // 生成障碍物
    generateItems('obstacle', obstacleCount.value, safeZone)
    // 确保障碍物生成不会堵塞路径
    ensurePathAvailability()
    // 生成钓鱼点
    generateItems('fishing', 10, safeZone)
    // 确保钓鱼点生成不会堵塞路径
    ensurePathAvailability()
    // 生成NPC
    generateNpcs(npcCount.value, safeZone)
    // 确保NPC生成不会堵塞路径
    ensurePathAvailability()
    // 更新玩家初始位置
    updatePlayerPosition()
  }

  // 创建一个安全区域，该区域是围绕玩家当前位置的 5x5 网格
  const createSafeZone = () => {
    const safeZone = new Set<number>()
    for (let y = playerY.value - 2; y <= playerY.value + 2; y++) {
      for (let x = playerX.value - 2; x <= playerX.value + 2; x++) {
        // 确保坐标在有效的网格范围内
        if (y >= 0 && y < gridSize.value && x >= 0 && x < gridSize.value) safeZone.add(y * gridSize.value + x) // 将坐标转换为一维索引并添加到安全区域集合中
      }
    }
    // 返回安全区域集合
    return safeZone
  }

  // 确保地图中有可用路径，如果没有则重新生成障碍物和 NPC
  const ensurePathAvailability = () => {
    while (!isPathAvailable()) {
      // 重新生成障碍物，排除在安全区域内的网格
      generateItems('obstacle', obstacleCount.value, createSafeZone())
      // 重新生成 NPC，排除在安全区域内的网格
      generateNpcs(npcCount.value, createSafeZone())
    }
  }

  // 使用 A* 算法检查从起点到终点的路径是否可用
  const isPathAvailable = () => {
    // 起点坐标
    const start: Position = [playerY.value, playerX.value]
    // 终点坐标
    const end: Position = [49, 49]
    // 四个方向的移动方式
    const directions: Position[] = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0]
    ]
    // 计算启发式函数（曼哈顿距离加上一个小权重）
    const heuristic = (a: Position, b: Position) => {
      const d1 = Math.abs(a[0] - b[0])
      const d2 = Math.abs(a[1] - b[1])
      return d1 + d2 + 0.1 * Math.min(d1, d2)
    }
    // 初始化 A* 算法所需的数据结构
    const openSet = new MinHeap<Position>() // 用于存储待检查的节点
    const cameFrom = new Map<string, Position>() // 记录路径
    const gScore = new Map<string, number>() // 记录从起点到当前节点的实际代价
    const fScore = new Map<string, number>() // 记录从起点到终点的估算代价
    gScore.set(start.toString(), 0)
    fScore.set(start.toString(), heuristic(start, end))
    openSet.add(start, heuristic(start, end))
    while (!openSet.isEmpty()) {
      // 获取具有最低 f 值的节点
      const current = openSet.poll()
      invariant(current, '地图寻路队列不能为空')
      // 如果当前节点是终点，则路径可用
      if (current[0] === 49 && current[1] === 49) return true
      for (const [dy, dx] of directions) {
        const newY = current[0] + dy
        const newX = current[1] + dx
        const neighbor: Position = [newY, newX]
        // 确保邻居节点在有效的网格范围内且为空
        if (
          newY >= 0 &&
          newY < gridSize.value &&
          newX >= 0 &&
          newX < gridSize.value &&
          grid.value[newY * gridSize.value + newX].type === 'empty'
        ) {
          const tentativeGScore = (gScore.get(current.toString()) ?? Infinity) + 1
          // 如果找到更短的路径
          if (tentativeGScore < (gScore.get(neighbor.toString()) ?? Infinity)) {
            cameFrom.set(neighbor.toString(), current)
            gScore.set(neighbor.toString(), tentativeGScore)
            const fScoreValue = tentativeGScore + heuristic(neighbor, end)
            fScore.set(neighbor.toString(), fScoreValue)
            openSet.add(neighbor, fScoreValue)
          }
        }
      }
    }
    // 如果没有找到路径，则返回 false
    return false
  }

  // 生成指定数量的障碍物，并确保生成后路径仍然可用
  const generateItems = (type: 'obstacle' | 'fishing', count: number, excludeSet: Set<number>) => {
    invariant(Number.isInteger(count) && count >= 0 && count < totalCells.value, '地图元素数量越界')
    // 将所有现有的障碍物转换为空
    grid.value.forEach(cell => {
      if (cell.type === type) cell.type = 'empty'
    })
    let placed = 0
    const arr: number[] = []
    // 用来存储每个钓鱼点周围的5x5区域
    const restrictedZone = new Set<number>()
    while (placed < count) {
      const index = Math.floor(Math.random() * totalCells.value)
      // 检查是否新生成的位置在安全区域或禁区内，并且该格子为空
      if (!excludeSet.has(index) && !restrictedZone.has(index) && grid.value[index].type === 'empty') {
        grid.value[index].type = type
        placed++
        // 如果是钓鱼点，存储钓鱼点坐标，并生成其周围的5x5禁区
        if (type === 'fishing') {
          arr.push(index)
          store.fishingMap = arr
          // 将钓鱼点周围的5x5区域添加到禁区
          addToRestrictedZone(index, restrictedZone)
        }
        // 生成障碍物后立即检查路径是否可行
        if (!isPathAvailable()) {
          // 如果阻塞路径，回溯这个障碍物的生成
          grid.value[index].type = 'empty'
          placed--
        }
      }
    }
  }

  // 生成指定数量的 NPC，并确保生成后路径仍然可用
  const generateNpcs = (count: number, excludeSet: Set<number>) => {
    // 将所有现有的 NPC 转换为空
    grid.value.forEach(cell => {
      if (cell.type === 'npc') cell.type = 'empty'
    })
    const existingNpcs = player.value.npcs
    const names = npc.npcNames()
    const arr: NPC[] = []
    let placed = 0
    while (placed < count) {
      const index = Math.floor(Math.random() * totalCells.value)
      // 确保新生成的 NPC 不在安全区域内且为空
      if (!excludeSet.has(index) && grid.value[index].type === 'empty') {
        const existing = existingNpcs[placed]
        const favorability = existing?.favorability ?? 0
        const lightness = calculateLightness(favorability)
        // 设置 NPC 的颜色
        grid.value[index].his = `hsl(340, 82%, ${lightness}%, 1)`
        grid.value[index].type = 'npc'
        const npcData = {
          lv: 144,
          name: existing?.name ?? names[placed],
          position: index,
          favorability: favorability,
          reincarnation: 10
        }
        arr.push(npcData)
        player.value.npcs = arr
        placed++
        // 生成 NPC 后立即检查路径是否可行
        if (!isPathAvailable()) {
          // 如果阻塞路径，回溯这个 NPC 的生成
          grid.value[index].type = 'empty'
          placed--
        }
      }
    }
  }

  // 将目标的5x5范围改为禁区
  const addToRestrictedZone = (index: number, restrictedZone: Set<number>) => {
    const gridX = index % gridSize.value
    const gridY = Math.floor(index / gridSize.value)
    // 遍历钓鱼点周围的5x5区域
    for (let y = gridY - 2; y <= gridY + 2; y++) {
      for (let x = gridX - 2; x <= gridX + 2; x++) {
        if (y >= 0 && y < gridSize.value && x >= 0 && x < gridSize.value) {
          // 将坐标转换为一维索引并添加到禁区集合中
          restrictedZone.add(y * gridSize.value + x)
        }
      }
    }
  }

  // 根据亲密度计算颜色亮度
  const calculateLightness = (favorability: number) => {
    const maxFavorability = 1000
    const minLightness = 50 // 最暗
    const maxLightness = 76 // 最亮
    // 根据亲密度百分比计算亮度
    const percentage = favorability / maxFavorability
    return minLightness + (maxLightness - minLightness) * percentage
  }

  const harvestNpc = (item: NPC) => {
    ElMessageBox.confirm('与对方结为道侣有50%的概率失败, 失败后好感度会清空, 请问还想与对方结为道侣吗?', '结为道侣', {
      center: true,
      cancelButtonText: '取消',
      confirmButtonText: '确定'
    })
      .then(() => {
        const rand = isLucky(50)
        if (rand) {
          // 添加道侣
          player.value.wifes.push({
            name: item.name,
            level: 0,
            dodge: 0,
            attack: 10,
            health: 100,
            defense: 10,
            critical: 0,
            reincarnation: 0
          })
          gameNotifys({ title: '提示', message: '你成功邀请对方与你结为道侣', position: 'top-left' })
        } else {
          npcInfo.value.favorability = 0
          gameNotifys({ title: '提示', message: '对方拒绝了你的邀请, 好感度清空', position: 'top-left' })
        }
      })
      .catch(() => {})
  }

  // 礼物信息
  const giftInfo = (item: Gift, index: number) => {
    ElMessageBox.confirm('', '赠送礼物', {
      center: true,
      message: `<div class="monsterinfo">
      <div class="monsterinfo-box">
        <p>名称: ${item.name}</p>
        <p>价格: ${item.price}</p>
        <p>增加好感度: ${item.plus}</p>
      </div>
    </div>`,
      lockScroll: false,
      cancelButtonText: '取消赠送',
      confirmButtonText: '立即赠送',
      dangerouslyUseHTMLString: true
    })
      .then(() => {
        if (item.price > player.value.props.money) {
          gameNotifys({ title: '赠送提示', message: '灵石不足, 赠送失败', position: 'top-left' })
          return
        }
        // 扣除灵石数量
        player.value.props.money -= item.price
        // 增加好感度
        npcInfo.value.favorability += item.plus
        // 增加传送符
        player.value.props.flying += index
        // 增加情缘点
        player.value.props.qingyuan += index
        gameNotifys({
          title: '赠送提示',
          message: `赠送成功, ${npcInfo.value.name}对你的好感度增加了, 并赠与了你${index}张传送符和${index}点情缘`,
          position: 'top-left'
        })
      })
      .catch(() => {})
  }

  // 地图信息
  const gridInfo = (index: number, item: MapCell) => {
    invariant(Number.isInteger(index) && index >= 0 && index < grid.value.length, '地图坐标越界')
    // 如果坐标不是空地
    if (item.type != 'empty') return
    const x = index % gridSize.value
    const y = Math.floor(index / gridSize.value)
    ElMessageBox.confirm('地图坐标信息', '地图坐标信息', {
      center: true,
      message: `<div class="monsterinfo">
      <div class="monsterinfo-box">
        <p>X轴: ${x}</p>
        <p>Y轴: ${y}</p>
      </div>
    </div>`,
      lockScroll: false,
      cancelButtonText: '取消传送',
      confirmButtonText: '立即传送',
      dangerouslyUseHTMLString: true
    })
      .then(() => {
        if (!player.value.props.flying) {
          gameNotifys({ title: '传送提示', message: '传送失败, 传送符不足', position: 'top-left' })
          return
        }
        playerY.value = y
        playerX.value = x
        updatePlayerPosition()
        gameNotifys({ title: '传送提示', message: '传送成功', position: 'top-left' })
      })
      .catch(() => {})
  }

  // 更新玩家在地图上的位置
  const updatePlayerPosition = () => {
    grid.value.forEach(cell => (cell.type === 'player' ? (cell.type = 'empty') : cell.type))
    const playerIndex = playerY.value * gridSize.value + playerX.value
    grid.value[playerIndex].type = 'player'
    // 更新地图数据
    store.mapData = {
      y: playerY.value,
      x: playerX.value,
      map: grid.value
    }
    // 20%概率遇怪
    const rand = isLucky(20)
    if (rand && playerIndex != 0) {
      // 玩家境界
      let level = player.value.level == 0 ? 1 : player.value.level
      // 怪物难度根据玩家最高境界 + 转生次数
      const monsterLv = level * player.value.reincarnation + level
      // 添加怪物数据
      store.monster = {
        // 名称
        name: monster.monster_Names(monsterLv),
        // 气血
        health: monster.monster_Health(monsterLv),
        // 攻击
        attack: monster.monster_Attack(monsterLv),
        // 防御
        defense: monster.monster_Defense(monsterLv),
        // 闪避率
        dodge: monster.monster_Criticalhitrate(monsterLv),
        // 暴击
        critical: monster.monster_Criticalhitrate(monsterLv)
      }
      // 跳转对战
      router.push('/explore')
    }
    // 每次更新玩家位置后调用
    if (playerIndex != 0) updateScroll(playerIndex)
  }

  // 计算玩家指定方向是否有NPC或障碍物
  const checkDirection = (direction: Direction) => {
    const directions = {
      up: (playerY.value - 1) * gridSize.value + playerX.value,
      down: (playerY.value + 1) * gridSize.value + playerX.value,
      left: playerY.value * gridSize.value + (playerX.value - 1),
      right: playerY.value * gridSize.value + (playerX.value + 1)
    }
    const index = directions[direction]
    return ['obstacle', 'fishing', 'npc'].includes(grid.value[index]?.type)
  }

  // 根据方向移动玩家
  const move = (input: string | KeyboardEvent) => {
    let newX = playerX.value
    let newY = playerY.value
    const direction = typeof input === 'string' ? input : input.key
    switch (direction) {
      case 'q':
        goHome()
        return
      case 'w':
      case 'up':
      case 'ArrowUp':
        if (newY > 0) {
          newY--
          goPlayerXY(newY, newX)
        }
        break
      case 's':
      case 'down':
      case 'ArrowDown':
        if (newY < gridSize.value - 1) {
          newY++
          goPlayerXY(newY, newX)
        }
        break
      case 'a':
      case 'left':
      case 'ArrowLeft':
        if (newX > 0) {
          newX--
          goPlayerXY(newY, newX)
        }
        break
      case 'd':
      case 'right':
      case 'ArrowRight':
        if (newX < gridSize.value - 1) {
          newX++
          goPlayerXY(newY, newX)
        }
        break
      case 'e':
        if (!isNpc.value && !isFishing.value) return
        if (isNpc.value) talkToNpc()
        else startGame()
        return
      default:
        return
    }
  }

  const goPlayerXY = (newY: number, newX: number) => {
    const newIndex = newY * gridSize.value + newX
    // 仅在目标位置为空地时移动玩家
    if (grid.value[newIndex].type === 'empty') {
      playerX.value = newX
      playerY.value = newY
    }
    updatePlayerPosition()
  }

  // 滚动条自动滚动到玩家所在行
  const updateScroll = (playerIndex: number) => {
    const playerCell = cellRefs.value[playerIndex]
    if (playerCell) {
      store.mapScroll = playerIndex
      playerCell.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
    }
  }

  // 找到并与附近的NPC对话
  const talkToNpc = () => {
    const nearbyNpc = player.value.npcs.find(npc => nearbyIndices.value.includes(npc.position))
    if (!nearbyNpc) return
    npcShow.value = true
    npcInfo.value = nearbyNpc
  }

  // 概率计算
  const isLucky = (probability: number) => {
    invariant(Number.isFinite(probability) && probability >= 0 && probability <= 100, '概率必须介于0和100之间')
    // 生成一个0到100之间的随机数
    const randomValue = Math.random() * 100
    // 判断随机数是否小于等于传入的概率值
    return randomValue < probability
  }

  // 判断玩家是否已当前NPC结为道侣
  const isHaveWife = (name: string) => {
    return !!name && player.value.wifes.some(item => item.name === name)
  }

  // 钓鱼
  const moveButton = () => {
    // 平滑向上移动
    smoothMoveUp()
    // 检查碰撞
    checkCollision()
  }

  // 启动长按上浮逻辑
  const startFishing = () => {
    if (!holdingId.value) {
      moveButton()
      holdingId.value = window.setInterval(moveButton, 100)
    }
  }

  // 停止上浮并启动自动下滑
  const stopFishing = () => {
    if (holdingId.value) {
      clearInterval(holdingId.value)
      holdingId.value = null
    }
  }

  // 移动鱼的位置
  const moveParentContainer = () => {
    if (!fishingShow.value) return
    const moving = movingContainer.value
    const outer = outerContainer.value
    if (!moving || !outer) return
    // 移动速度
    const speed = 3000
    // 最大Y轴移动范围
    const maxY = outer.clientHeight - moving.clientHeight
    const move = () => {
      // 如果时间已到，停止移动
      if (fishing.value.timeExpired) {
        // 清空所有定时
        clearAllTiming()
        return
      }
      // 随机生成新的Y轴位置
      const newY = Math.random() * maxY
      // 设置新的位置
      moving.style.transition = `top ${speed}ms ease`
      moving.style.top = `${newY}px`
      // 在动画结束后调用下一次移动
      setTimeout(() => {
        if (!fishing.value.timeExpired) {
          fishing.value.moveParentContainerId = requestAnimationFrame(move)
        }
      }, speed)
    }
    // 启动移动
    move()
  }

  // 鱼钩自动向下移动
  const autoMoveDown = () => {
    const step = () => {
      const inner = innerContainer.value
      if (fishing.value.timeExpired || !inner) return
      // 检查钓鱼的容器是否触底
      if (fishing.value.innerPosition <= 0) {
        // 如果触底且没有重叠，则扣除分数和进度
        if (!fishing.value.overlap) {
          fishing.value.score = Math.max(fishing.value.score - 0.2, 0)
          updateProgressBar()
        }
      } else {
        // 向下移动
        fishing.value.innerPosition -= 1
        inner.style.bottom = `${fishing.value.innerPosition}px`
        // 检查碰撞
        checkCollision()
      }
      // 请求下一帧动画
      fishing.value.moveDownAnimationId = requestAnimationFrame(step)
    }
    // 启动自动向下移动
    fishing.value.moveDownAnimationId = requestAnimationFrame(step)
  }

  // 平滑向上移动鱼钩的位置
  const smoothMoveUp = () => {
    const outer = outerContainer.value
    const inner = innerContainer.value
    if (!outer || !inner || fishing.value.timeExpired) return
    // 目标位置
    const targetPosition = Math.min(
      fishing.value.innerPosition + 10,
      outer.clientHeight - inner.clientHeight
    )
    const step = () => {
      if (fishing.value.timeExpired) return
      if (fishing.value.innerPosition < targetPosition) {
        // 向上移动
        fishing.value.innerPosition += 2
        inner.style.bottom = `${fishing.value.innerPosition}px`
        // 请求下一帧动画
        fishing.value.moveUpAnimationId = requestAnimationFrame(step)
      }
    }
    // 启动平滑向上移动
    fishing.value.moveUpAnimationId = requestAnimationFrame(step)
  }

  // 检查碰撞
  const checkCollision = () => {
    // 如果游戏结束或时间到，停止检查
    if (fishing.value.gameOver || fishing.value.timeExpired) return
    // 获取鱼的矩形区域
    const movingRect = movingContainer.value?.getBoundingClientRect()
    // 获取鱼钩的矩形区域
    const innerRect = innerContainer.value?.getBoundingClientRect()
    if (!movingRect || !innerRect) return
    // 判断鱼钩是否触底
    const isTouchingBottom = fishing.value.innerPosition <= 0
    // 判断是否有重叠
    const isOverlap = !(
      (
        movingRect.bottom < innerRect.top || // 鱼钩底部在鱼上方
        movingRect.top > innerRect.bottom || // 鱼钩顶部在鱼下方
        movingRect.right < innerRect.left || // 鱼钩右边在鱼左边
        movingRect.left > innerRect.right
      ) // 鱼钩左边在鱼右边
    )
    // 根据鱼钩的触底和重叠状态更新分数
    fishing.value.score = isOverlap
      ? Math.min(fishing.value.score + 0.1, 100)
      : isTouchingBottom
      ? Math.max(fishing.value.score - 0.2, 0)
      : Math.max(fishing.value.score - 0.2, 0)
    // 更新分数后更新进度条
    updateProgressBar()
    // 更新重叠状态
    fishing.value.overlap = isOverlap
  }

  // 更新进度条
  const updateProgressBar = () => {
    // 最大分数
    const maxScore = 100
    // 计算进度百分比
    const progressPercentage = Math.min((fishing.value.score / maxScore) * 100, 100)
    if (fishing.value.score >= maxScore && !fishing.value.gameOver) {
      fishing.value.gameOver = true
      const fishInfo = getRandomFish()
      invariant(fishInfo, '未能生成有效的钓鱼奖励')
      // 清空所有定时
      clearAllTiming()
      ElMessageBox.confirm(fishInfo.description, fishInfo.name, {
        center: true,
        showClose: false,
        lockScroll: false,
        showCancelButton: false,
        closeOnClickModal: false,
        confirmButtonText: '卖掉这条鱼'
      })
        .then(() => {
          // 结束游戏
          endGame()
          // 增加灵石数量
          player.value.props.money += fishInfo.price
          gameNotifys({ title: '提示', message: `你获得了${fishInfo.price}灵石`, position: 'top-left' })
        })
        .catch(() => {})
    }
    // 更新进度条文字
    fishing.value.progressText = Math.round(progressPercentage)
    // 更新进度条高度
    fishing.value.progressPercentage = `${progressPercentage}%`
  }

  // 启动计时器
  const startTimer = () => {
    const timer = window.setInterval(() => {
      fishing.value.timeLeft--
      // 倒计时结束
      if (fishing.value.timeLeft == 0) {
        // 清空所有定时
        clearAllTiming()
        ElMessageBox.confirm('钓鱼失败，鱼溜走了！', '提示', {
          center: true,
          lockScroll: false,
          showCancelButton: false,
          confirmButtonText: '确定',
          dangerouslyUseHTMLString: true
        })
          .then(() => endGame())
          .catch(() => endGame())
      }
    }, 1000)
    fishing.value.timerIds.push(timer)
  }

  // 结束游戏
  const endGame = () => {
    fishingShow.value = false
    stopFishing()
    // 清空所有定时
    clearAllTiming()
    // 移除钓鱼点
    const index = store.fishingMap.find(index => nearbyIndices.value.includes(index))
    if (index !== undefined && grid.value[index]) grid.value[index].type = 'empty'
    // 结束所有动画
    cancelAnimationFrame(fishing.value.moveUpAnimationId)
    cancelAnimationFrame(fishing.value.moveDownAnimationId)
    cancelAnimationFrame(fishing.value.moveParentContainerId)
    // 重置钓鱼数据
    resetFishingData(true)
  }

  // 开始游戏
  const startGame = () => {
    fishingShow.value = true
    resetFishingData(false)
    nextTick(() => {
      if (!fishingShow.value) return
      moveParentContainer()
      autoMoveDown()
      startTimer()
    })
  }

  // 重置所有钓鱼数据
  const resetFishingData = (bool: boolean) => {
    // 分数
    fishing.value.score = 0
    // 是否重叠
    fishing.value.overlap = false
    // 剩余时间
    fishing.value.timeLeft = 60
    // 游戏结束
    fishing.value.gameOver = bool
    // 禁用按钮
    fishing.value.disabled = bool
    // 时间结束
    fishing.value.timeExpired = bool
    // 内部容器位置
    fishing.value.innerPosition = 0
    if (!bool) {
      // 进度
      fishing.value.progressText = 0
      // 更新进度条高度
      fishing.value.progressPercentage = '0%'
    }
  }

  // 产出钓到鱼的信息
  const getRandomFish = () => {
    const random = Math.random()
    let cumulativeProbability = 0
    const fishList = [
      { name: '金鳞鲤鱼', price: 100, description: '金色鳞片的鲤鱼，象征着好运和财富。', probability: 0.25 },
      { name: '青铜鲑鱼', price: 150, description: '体型健硕的鲑鱼，常出现在清凉的河流中。', probability: 0.2 },
      { name: '冰川鳟鱼', price: 200, description: '来自寒冷冰川地区的鳟鱼，肉质鲜美。', probability: 0.18 },
      { name: '红尾锦鲤', price: 300, description: '具有漂亮红色尾巴的锦鲤，观赏价值极高。', probability: 0.15 },
      { name: '银鳍鲢鱼', price: 80, description: '常见于淡水湖泊，银色鳍片在水中闪闪发光。', probability: 0.3 },
      { name: '巨口鲶鱼', price: 180, description: '以其巨大的嘴巴和强劲的咬力著称，肉质肥美。', probability: 0.17 },
      { name: '幽蓝灯鱼', price: 250, description: '深海中发出幽蓝光芒的小型鱼类，具有神秘色彩。', probability: 0.14 },
      { name: '翡翠剑鱼', price: 500, description: '剑形的鱼嘴和翡翠般的色彩让它成为海中战士。', probability: 0.08 },
      { name: '斑点鲈鱼', price: 90, description: '遍布斑点的鲈鱼，适应力极强，分布广泛。', probability: 0.28 },
      { name: '火焰红鱼', price: 400, description: '拥有火焰般红色鳞片的稀有鱼类，价格不菲。', probability: 0.1 },
      { name: '雷电鳗鱼', price: 350, description: '全身带有微弱电流的鳗鱼，捕食时能够电击猎物。', probability: 0.12 },
      { name: '黑甲鲨', price: 600, description: '身披黑色盔甲般鳞片的鲨鱼，充满攻击性。', probability: 0.06 },
      { name: '水晶鲤鱼', price: 120, description: '鳞片透明的鲤鱼，在阳光下晶莹剔透。', probability: 0.22 },
      { name: '紫鳍金枪鱼', price: 700, description: '金枪鱼中的顶级品种，因其紫色鳍而得名。', probability: 0.05 },
      { name: '珍珠贝鱼', price: 220, description: '外形酷似贝壳的鱼类，藏有珍珠般的光泽。', probability: 0.16 },
      { name: '蓝鲸鱼苗', price: 1000, description: '蓝鲸的幼年鱼苗，体积虽小但潜力巨大。', probability: 0.03 },
      { name: '彩虹鳟鱼', price: 280, description: '彩虹般斑斓的鳟鱼，深受垂钓者喜爱。', probability: 0.13 },
      { name: '毒针河豚', price: 150, description: '体型小但带有剧毒的河豚，需小心处理。', probability: 0.2 },
      { name: '黄金海马', price: 500, description: '稀有的海马品种，金黄色的身体闪闪发光。', probability: 0.08 },
      { name: '深海魔鱼', price: 800, description: '生活在深海中的巨大鱼类，外表极具威胁性。', probability: 0.04 }
    ]
    // 遍历鱼类列表，根据概率抽取鱼
    for (const fish of fishList) {
      // 累加概率
      cumulativeProbability += fish.probability
      if (random < cumulativeProbability) {
        // 一旦随机数小于当前累加的概率，返回该鱼
        return fish
      }
    }
    // 如果没有匹配到
    return null
  }

  onMounted(() => {
    if (mapData.value.map.length) {
      // 恢复地图数据
      grid.value = mapData.value.map
      // 玩家所在Y轴
      playerY.value = mapData.value.y
      // 玩家所在X轴
      playerX.value = mapData.value.x
    } else {
      // 初始化地图数据
      initializeGrid()
    }
    // 恢复玩家滚动条位置
    if (store.mapScroll) nextTick(() => updateScroll(store.mapScroll))
    // 添加键盘监听
    window.addEventListener('keydown', move)
  })

  onUnmounted(() => {
    fishing.value.timeExpired = true
    stopFishing()
    cancelAnimationFrame(fishing.value.moveUpAnimationId)
    cancelAnimationFrame(fishing.value.moveDownAnimationId)
    cancelAnimationFrame(fishing.value.moveParentContainerId)
    // 清空所有定时
    clearAllTiming()
    // 移除键盘监听
    window.removeEventListener('keydown', move)
  })
</script>

<style scoped>
  .map {
    max-width: 770px;
    height: 500px;
    overflow: auto;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(50, 12px);
    grid-template-rows: repeat(50, 12px);
    gap: 1px;
    width: fit-content;
    margin: 0 auto;
  }

  .grid-item {
    width: 12px;
    height: 12px;
    background-color: #ddd;
  }

  .player {
    background-color: var(--el-color-success);
  }

  .fishing {
    background-color: var(--el-color-primary);
  }

  .obstacle {
    background-color: var(--el-color-warning);
  }

  .npc {
    background-color: var(--el-color-pink-light);
  }

  .empty {
    background-color: var(--el-color-info-light-8);
  }

  .x-0.y-0 {
    border-top-left-radius: 2px;
  }

  .x-49.y-0 {
    border-top-right-radius: 2px;
  }

  .x-0.y-49 {
    border-bottom-left-radius: 2px;
  }

  .x-49.y-49 {
    border-bottom-right-radius: 2px;
  }

  .controls {
    text-align: center;
    margin-top: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto auto;
    width: 200px;
    margin: 20px auto;
  }

  .center-buttons {
    display: flex;
    justify-content: space-between;
    grid-column: span 3;
  }

  .controls > button,
  .center-buttons > button {
    padding: 10px;
    margin: 5px;
    font-size: 16px;
  }

  .legend {
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin: 0 10px;
  }

  @media only screen and (max-width: 768px) {
    .legend {
      flex-wrap: wrap;
    }

    .legend-item {
      width: 33.333%;
      margin: 10px 0 0 0;
      justify-content: center;
    }
  }

  .color-box {
    width: 12px;
    height: 12px;
    margin-right: 5px;
    border-radius: 2px;
  }

  .wife-box {
    padding: 0 5px;
  }

  .attribute-box {
    display: flex;
    flex-wrap: wrap;
  }

  .attribute {
    width: 100%;
    margin: 4px;
  }

  .click-box {
    padding: 0 5px;
    margin-top: 10px;
    display: flex;
  }

  .click-box button {
    margin-top: 10px;
    width: 100%;
  }

  .gift-box {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    margin-top: 20px;
  }

  .gift-item {
    width: calc(50% - 8px);
    margin-top: 10px;
    display: grid;
    padding: 0 4px;
  }

  /* 钓鱼 */
  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .time {
    font-size: 15px;
    margin-bottom: 10px;
  }

  .outer-wrapper {
    display: flex;
    align-items: center;
  }

  .progress-bar-container {
    width: 40px;
    height: 400px;
    margin-right: 10px;
    border: 2px solid var(--el-border-color);
    border-radius: 5px;
    position: relative;
    overflow: hidden;
  }

  .progress-bar {
    width: 100%;
    height: 0%;
    background-color: var(--el-color-success);
    position: absolute;
    bottom: 0;
    transition: height 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }

  .progress-text {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: bold;
    padding-bottom: 5px;
    position: relative;
    top: 50%;
    bottom: 0;
    text-align: center;
    transform: translateY(-50%);
  }

  .outer-container {
    width: 50px;
    height: 400px;
    position: relative;
    overflow: hidden;
    border: 2px solid var(--el-text-color-primary);
    border-radius: 5px;
  }

  .moving-container {
    width: 50px;
    height: 50px;
    /* background-color: lightblue; */
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  .moving-container svg {
    width: 36px;
    height: 36px;
  }

  .inner-container {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    transition: bottom 0.1s ease;
  }

  .inner-container svg {
    width: 36px;
    height: 36px;
    transform: scaleX(-1);
  }

  .button {
    margin-top: 10px;
    padding: 10px 20px;
    font-size: 16px;
    width: 100%;
  }

  /* 移动按钮 */
  .shortcutKeys {
    color: rgba(169, 169, 169, 0.4);
    margin-left: 2px;
  }

  /* 钓鱼 */
  .diaoyu-shortcutKeys {
    display: block;
  }

  @media only screen and (max-width: 768px) {
    .shortcutKeys {
      display: block;
    }

    .diaoyu-shortcutKeys {
      color: rgba(169, 169, 169, 0.4);
      margin-left: 2px;
    }
  }
</style>

<style>
  /* 钓鱼动画 */
  @keyframes wobble {
    0% {
      transform: translateX(-50%) rotate(0);
    }

    25% {
      transform: translateX(-50%) rotate(-5deg);
    }

    50% {
      transform: translateX(-50%) rotate(0);
    }

    75% {
      transform: translateX(-50%) rotate(5deg);
    }

    100% {
      transform: translateX(-50%) rotate(0);
    }
  }
</style>
