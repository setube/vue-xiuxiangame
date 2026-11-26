<template>
  <div class="explore">
    <div class="cultivate" v-if="monster.name">
      你遇到了
      <span class="el-tag el-tag--danger" @click="openMonsterInfo" v-text="monster.name" />
      <div class="storyText">
        <div class="storyText-box">
          <el-scrollbar ref="scrollbar" always>
            <p class="fighting" v-if="isFighting" v-text="`${guashaRounds}回合 / 10回合`" />
            <p
              v-for="(item, index) in texts"
              :key="index"
              v-html="item"
              @click="openEquipmentInfo(openEquipItemInfo)"
            />
          </el-scrollbar>
        </div>
      </div>
      <div class="actions">
        <div class="action">
          <el-button class="item" @click="operate('startFight')" :disabled="isEnd">
            发起战斗
            <span class="shortcutKeys">(Q)</span>
          </el-button>
        </div>
        <div class="action">
          <el-button class="item" @click="operate('harvestPet')" :disabled="isCaptureFailed">
            收服对方
            <span class="shortcutKeys">(E)</span>
          </el-button>
        </div>
        <div class="action">
          <el-button class="item" @click="operate('runAway')" :disabled="isFailedRetreat">
            立马撤退
            <span class="shortcutKeys">(R)</span>
          </el-button>
        </div>
        <div class="action">
          <el-button class="item" @click="operate('explore')" :disabled="player.health <= 0" v-if="isEnd">
            继续探索
            <span class="shortcutKeys">(F)</span>
          </el-button>
        </div>
        <div class="action">
          <el-button class="item" @click="operate('goHome')" v-if="isEnd">
            回家疗伤
            <span class="shortcutKeys">(G)</span>
          </el-button>
        </div>
      </div>
    </div>
    <div class="cultivate error" v-else>
      <el-result icon="error" title="缺少对战信息" sub-title="请返回地图重新探索">
        <template #extra>
          <el-button :type="!player.dark ? 'primary' : ''" @click="router.push('/map')">返回地图</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ScrollbarInstance } from 'element-plus'
  import type { Equipment, EquipmentSlot, Monster, Achievement } from '@/types/game'
  import { assert, isEquipment } from '@/utils/assert'
  import { useRouter } from 'vue-router'
  import { ref, onMounted, onUnmounted } from 'vue'
  // 装备
  import equip from '@/plugins/equip'
  import { useMainStore } from '@/plugins/store'
  // 成就
  import achievement from '@/plugins/achievement'
  import {
    maxLv,
    levelNames,
    formatNumberToChineseUnit,
    genre,
    levels,
    gameNotifys,
    smoothScrollToBottom
  } from '@/plugins/game'
  import { ElMessageBox } from 'element-plus'

  const store = useMainStore()
  const router = useRouter()
  // 日志
  const texts = ref<string[]>([])
  // 是否结束战斗
  const isEnd = ref(false)
  const player = ref(store.player)
  const mapData = ref(store.mapData)
  const mapScroll = ref(store.mapScroll)
  // 野怪信息
  const monster = ref(store.monster)
  const loading = ref(true)
  // 是否胜利
  const victory = ref(false)
  const timerIds = ref<ReturnType<typeof setInterval>[]>([])
  const isFighting = ref(false)
  // 回合数
  const guashaRounds = ref(10)
  // 撤退失败
  const isFailedRetreat = ref(false)
  // 收服失败
  const isCaptureFailed = ref(false)
  const openEquipItemInfo = ref<EquipmentSlot>({})
  const scrollbar = ref<ScrollbarInstance | null>(null)

  // 玩家操作(绑定快捷键)
  const operate = (oprName: string | KeyboardEvent) => {
    oprName = typeof oprName === 'string' ? oprName : oprName.key
    switch (oprName) {
      // 发起战斗
      case 'q':
      case 'startFight':
        if (!isEnd.value) startFight()
        break
      // 收服对方
      case 'e':
      case 'harvestPet':
        if (!isEnd.value && !isCaptureFailed.value) harvestPet(monster.value)
        break
      // 立马撤退
      case 'r':
      case 'runAway':
        if (!isEnd.value && !isFailedRetreat.value) runAway()
        break
      // 回家疗伤
      case 'g':
      case 'goHome':
        if (isEnd.value) goHome()
        break
      // 继续探索
      case 'f':
      case 'explore':
        if (isEnd.value) router.push('/map')
        return
      default:
        return
    }
  }

  // 回家疗伤
  const goHome = () => {
    mapData.value = { y: 0, x: 0, map: [] }
    router.push('/home')
    mapScroll.value = 0
  }

  // 怪物信息
  const openMonsterInfo = () => {
    const successRate = calculateCaptureRate()
    const newProperties = (100 - successRate) * 0.5
    ElMessageBox.alert('', monster.value.name, {
      center: true,
      message: `<div class="monsterinfo">
      <div class="monsterinfo-box">
        <p>境界: ${player.value.level == 0 ? levelNames(player.value.level + 1) : levelNames(player.value.level)}</p>
        <p>悟性: ${Math.floor(newProperties)}</p>
        <p>气血: ${formatNumberToChineseUnit(monster.value.health)}</p>
        <p>攻击: ${formatNumberToChineseUnit(monster.value.attack)}</p>
        <p>防御: ${formatNumberToChineseUnit(monster.value.defense)}</p>
        <p>闪避率: ${
          monster.value.dodge > 0 ? (monster.value.dodge * 100 > 100 ? 100 : (monster.value.dodge * 100).toFixed(2)) : 0
        }%</p>
        <p>暴击率: ${
          monster.value.critical > 0
            ? monster.value.critical * 100 > 100
              ? 100
              : (monster.value.critical * 100).toFixed(2)
            : 0
        }%</p>
        <p>收服率: ${successRate}%</p>
      </div>
    </div>`,
      confirmButtonText: '知道了',
      dangerouslyUseHTMLString: true
    }).catch(() => {})
  }

  // 开始攻击
  const startFight = () => {
    if (isEnd.value) return
    isEnd.value = true
    victory.value = false
    const zs = player.value.reincarnation * 10
    const time = zs >= 200 ? 100 : 300 - zs
    const timerId = setInterval(() => {
      fightMonster()
      const element = scrollbar.value?.wrapRef
      if (!element) return
      const observer = new MutationObserver(() => {
        smoothScrollToBottom(element)
      })
      observer.observe(element, {
        childList: true,
        subtree: true
      })
    }, time)
    timerIds.value.push(timerId)
  }

  // 停止攻击
  const stopFight = () => {
    timerIds.value.forEach(id => {
      clearInterval(id)
    })
    isEnd.value = true
    timerIds.value = []
    isFailedRetreat.value = true
    isCaptureFailed.value = true
  }

  // 攻击怪物
  const fightMonster = () => {
    isFighting.value = true
    if (monster.value.health <= 0) return
    // 野怪伤害计算
    const monsterAttack = monster.value.attack // 野怪攻击
    const playerDefense = player.value.defense // 玩家防御
    let monsterHarm = Math.max(0, Math.floor(monsterAttack - playerDefense)) // 野怪伤害
    monsterHarm = monsterHarm <= 1 ? 1 : monsterHarm // 伤害小于1时强制破防
    // 玩家伤害计算
    const playerAttack = player.value.attack // 玩家攻击
    const monsterDefense = monster.value.defense // 野怪防御
    let playerHarm = Math.max(0, Math.floor(playerAttack - monsterDefense)) // 玩家伤害基础值
    playerHarm = playerHarm <= 1 ? 1 : playerHarm // 伤害小于1时强制破防
    // 是否暴击
    let isMCritical = false,
      isCritical = false
    // 怪物是否闪避
    const isMHit = Math.random() > player.value.dodge
    // 玩家是否闪避
    const isPHit = Math.random() > monster.value.dodge
    // 检查野怪是否暴击
    if (Math.random() < monster.value.critical) {
      // 野怪暴击，伤害加倍
      monsterHarm *= 2
      // 野怪成功暴击
      isMCritical = true
    }
    // 检查玩家是否暴击
    if (Math.random() < player.value.critical) {
      // 玩家暴击，伤害加倍
      playerHarm *= 1.5
      // 玩家成功暴击
      isCritical = true
    }
    // 怪物没有闪避
    if (isMHit) player.value.health -= monsterHarm
    // 玩家没有闪避
    if (isPHit) monster.value.health -= playerHarm
    player.value.health = Math.max(0, player.value.health)
    monster.value.health = Math.max(0, monster.value.health)
    if (guashaRounds.value > 1) {
      // 扣除回合数
      guashaRounds.value--
      // 野怪气血小于等于0
      if (monster.value.health <= 0) {
        // 增加击杀数量
        player.value.taskNum++
        // 增加培养丹
        const reincarnation = player.value.reincarnation ? 1 + 1 * player.value.reincarnation : 1
        player.value.props.cultivateDan += reincarnation
        // 发送提示
        texts.value.push(`击败${monster.value.name}后你获得了${reincarnation}颗培养丹`)
        findTreasure()
        stopFight()
      } else if (player.value.health <= 0) {
        texts.value.push('你因为太弱被击败了。')
        stopFight()
      } else {
        // 玩家
        texts.value.push(
          !isPHit
            ? `你攻击了${monster.value.name}，对方闪避了你的攻击，你未造成伤害，剩余${monster.value.health}气血。`
            : `你攻击了${monster.value.name}，${isCritical ? '触发暴击' : ''}造成了${playerHarm}点伤害，剩余${
                monster.value.health
              }气血。`
        )
        // 野怪
        texts.value.push(
          !isMHit
            ? `${monster.value.name}攻击了你，你闪避了对方的攻击，对方未造成伤害。`
            : `${monster.value.name}攻击了你，${isMCritical ? '触发暴击' : ''}造成了${monsterHarm}点伤害`
        )
      }
    } else {
      guashaRounds.value = 10
      texts.value.push(`回合结束, 你未战胜${monster.value.name}你输了。`)
      stopFight()
    }
  }

  // 逃跑
  const runAway = () => {
    guashaRounds.value--
    if (equip.getRandomInt(0, 1)) {
      isFailedRetreat.value = true
      texts.value.push('撤退失败，继续战斗。')
    } else {
      guashaRounds.value = 10
      router.push('/map')
      gameNotifys({ title: '提示', message: '你选择了撤退。' })
    }
  }

  // 发现道具
  const findTreasure = () => {
    let equipItem: Equipment | undefined
    let exp = Math.floor(player.value.maxCultivation / 100)
    exp = exp ? exp : 1
    // 如果总背包容量大于装备背包容量
    victory.value = true
    const randomInt = equip.getRandomInt(1, 4)
    // 神兵
    if (randomInt == 1) equipItem = equip.equip_Weapons(player.value.level)
    // 护甲
    else if (randomInt == 2) equipItem = equip.equip_Armors(player.value.level)
    // 灵宝
    else if (randomInt == 3) equipItem = equip.equip_Accessorys(player.value.level)
    // 法器
    else if (randomInt == 4) equipItem = equip.equip_Sutras(player.value.level)
    assert(equipItem, '未能生成探索奖励装备')
    texts.value.push(
      `你击败${monster.value.name}后，发现了一个宝箱，打开后获得了<span class="el-tag el-tag--${equipItem.quality}">${
        levels[equipItem.quality]
      }${equipItem.name}(${genre[equipItem.type]})</span>`
    )
    openEquipItemInfo.value = equipItem
    // 如果装备背包当前容量大于等于背包总容量
    if (player.value.inventory.length >= player.value.backpackCapacity) {
      texts.value.push(`当前装备背包容量已满, 该装备自动丢弃, 转生可增加背包容量`)
    } else {
      // 玩家获得道具
      player.value.inventory.push(equipItem)
    }
    // 如果没有满级
    if (player.value.level < maxLv) {
      // 增加修为
      // 如果当前境界小于最高境界当前修为大于等于总修为
      if (player.value.level < maxLv) {
        if (player.value.cultivation >= player.value.maxCultivation) {
          // 如果玩家等级大于10并且击杀数低于当前等级
          if (player.value.level > 10 && player.value.level > player.value.taskNum) {
            texts.value.push(
              `当前境界修为已满, 你需要通过击败<span class="textColor">(${player.value.taskNum} / ${player.value.level})</span>个敌人证道突破`
            )
            return
          }
          // 清空已击杀敌人
          player.value.taskNum = 0
          // 增加境界
          player.value.level++
          // 增加点数
          player.value.points += 3
          // 更新气血
          player.value.health = player.value.maxHealth
          // 增加玩家总修为
          player.value.maxCultivation = Math.floor(100 * Math.pow(2, player.value.level))
          texts.value.push(`恭喜你突破了！当前境界：${levelNames(player.value.level)}`)
        } else {
          // 当前修为
          player.value.cultivation += exp
        }
      } else {
        player.value.level = maxLv
        player.value.maxCultivation = Math.floor(100 * Math.pow(2, maxLv))
        texts.value.push('你当前的境界已修炼圆满, 需要转生后才能继续修炼')
      }
    }
  }
  // 发现的装备信息
  const openEquipmentInfo = (item: EquipmentSlot) => {
    if (!isEquipment(item)) return
    if (!victory.value) return
    ElMessageBox.confirm('', item.name, {
      center: true,
      message: `<div class="monsterinfo">
      <div class="monsterinfo-box">
        <p>类型: ${genre[item.type] ?? '未知'}</p>
        <p>境界: ${levelNames(item.level)}</p>
        <p>品质: ${levels[item.quality] ?? '未知'}</p>
        <p>气血: ${formatNumberToChineseUnit(item.health)}</p>
        <p>攻击: ${formatNumberToChineseUnit(item.attack)}</p>
        <p>防御: ${formatNumberToChineseUnit(item.defense)}</p>
        <p>闪避率: ${(item.dodge * 100).toFixed(2)}%</p>
        <p>暴击率: ${(item.critical * 100).toFixed(2)}%</p>
      </div>
    </div>`,
      showCancelButton: false,
      confirmButtonText: '确定',
      dangerouslyUseHTMLString: true
    }).catch(() => {})
  }
  // 收服灵宠
  const harvestPet = (item: Monster) => {
    isCaptureFailed.value = true
    // 成功几率
    const successRate = calculateCaptureRate()
    // 是否成功收服
    const isSuccess = successRate >= getRandomInt(1, 100)
    // 如果成功收服
    if (isSuccess) {
      // 总背包容量大于灵宠背包容量就可以收服对方
      if (player.value.backpackCapacity > player.value.pets.length) {
        // 收服后的属性根据收服前的成功率算
        const newProperties = Math.floor((100 - successRate) * 0.5)
        // 攻击
        const attack = Math.floor(getRandomInt(50, 150) * newProperties)
        // 防御
        const defense = Math.floor(getRandomInt(1, 15) * newProperties)
        // 血量
        const health = Math.floor(getRandomInt(100, 500) * newProperties)
        // 闪避
        const dodge = getRandomFloatInRange(0.001, 0.01) * newProperties
        // 暴击
        const critical = getRandomFloatInRange(0.001, 0.01) * newProperties
        // 添加到灵宠背包里
        player.value.pets.push({
          id: Date.now(),
          lock: false,
          name: item.name,
          level: 1,
          score: equip.calculateEquipmentScore(dodge, attack, health, critical, defense),
          dodge,
          health,
          attack,
          defense,
          critical,
          // 初始数据
          initial: {
            dodge,
            health,
            attack,
            defense,
            critical,
            rootBone: newProperties
          },
          // 悟性
          rootBone: newProperties,
          // 好感度
          favorability: 0,
          // 转生
          reincarnation: 0
        })
        // 玩家灵宠成就
        const petAchievement = player.value.achievement.pet
        // 完成成就
        const checkAchievement = (item: Achievement) => {
          const conditions = item.condition
          return (
            (!conditions.health || conditions.health <= health) &&
            (!conditions.attack || conditions.attack <= attack) &&
            (!conditions.defense || conditions.defense <= defense) &&
            (!conditions.dodge || conditions.dodge <= Number(dodge.toFixed(2))) &&
            (!conditions.critical || conditions.critical <= Number(critical.toFixed(2)))
          )
        }
        // 完成成就
        achievement.pet().forEach(item => {
          // 检查成就条件是否达成并且成就尚未完成
          if (checkAchievement(item) && !petAchievement.find(i => i.id === item.id)) {
            // 添加成就
            player.value.achievement.pet.push({ id: item.id })
            // 增加培养丹
            player.value.props.cultivateDan += item.award
            // 发送通知
            gameNotifys({ title: '获得成就提示', message: `恭喜你完成了${item.name}成就` })
          }
        })
        texts.value.push(`收服${item.name}成功`)
      } else {
        texts.value.push(`灵宠背包容量已满, 收服${item.name}失败, 转生可增加灵宠背包容量`)
      }
      // 恢复回合数
      guashaRounds.value = 10
      stopFight()
      // 如果没有收服
    } else {
      isCaptureFailed.value = true
      texts.value.push(`收服${item.name}失败`)
    }
  }
  // 计算收服灵宠成功概率
  const calculateCaptureRate = () => {
    // 基础100%几率
    const baseRate = 100
    // 每升一级减少的基础几率
    const decayFactor = 0.98
    // 根据等级计算实际几率
    let captureRate = baseRate * Math.pow(decayFactor, player.value.level)
    // 确保几率在 0% 到 100% 之间
    captureRate = Math.floor(Math.max(0, Math.min(100, captureRate)))
    return captureRate
  }
  const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const getRandomFloatInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min
  }

  onUnmounted(() => {
    stopFight()
    // 移除键盘监听
    window.removeEventListener('keydown', operate)
  })

  onMounted(() => {
    if (monster.value.name) loading.value = false
    // 添加键盘监听
    window.addEventListener('keydown', operate)
  })
</script>

<style scoped>
  .actions .action {
    width: calc(33.333% - 10px);
    margin: 5px;
  }

  .shortcutKeys {
    color: rgba(169, 169, 169, 0.4);
    margin-left: 2px;
  }

  .cultivate.error {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 770px;
  }

  @media only screen and (max-width: 768px) {
    .shortcutKeys {
      display: none;
    }
  }
</style>
