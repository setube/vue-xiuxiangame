<template>
  <div class="attributes">
    <div class="attribute-box">
      <div class="tag attribute">气血: {{ formatNumberToChineseUnit(strengthenInfo.health ?? 0) }}</div>
      <div class="tag attribute">攻击: {{ formatNumberToChineseUnit(strengthenInfo.attack ?? 0) }}</div>
      <div class="tag attribute">防御: {{ formatNumberToChineseUnit(strengthenInfo.defense ?? 0) }}</div>
      <div class="tag attribute">
        暴击率:
        {{
          (strengthenInfo.critical ?? 0) > 0
            ? (strengthenInfo.critical ?? 0) * 100 > 100
              ? 100
              : ((strengthenInfo.critical ?? 0) * 100).toFixed(2)
            : 0
        }}%
      </div>
      <div class="tag attribute">
        闪避率:
        {{
          (strengthenInfo.dodge ?? 0) > 0
            ? (strengthenInfo.dodge ?? 0) * 100 > 100
              ? 100
              : ((strengthenInfo.dodge ?? 0) * 100).toFixed(2)
            : 0
        }}%
      </div>
      <div class="tag attribute">炼器等级: {{ strengthenInfo.strengthen ?? 0 }}</div>
      <div class="tag attribute">装备评分: {{ formatNumberToChineseUnit(strengthenInfo.score ?? 0) }}</div>
      <div
        class="tag attribute"
        @click="
          gameNotifys({
            title: '获得方式',
            message: '分解装备可获取',
            position: 'top-left'
          })
        "
        v-if="calculateCost"
      >
        拥有炼器石:
        {{ formatNumberToChineseUnit(player.props.strengtheningStone) }}
      </div>
      <div class="tag attribute" v-if="calculateCost">炼器消耗: {{ calculateCost }}</div>
      <div class="tag attribute" v-if="calculateEnhanceSuccessRate">
        成功率: {{ (calculateEnhanceSuccessRate * 100).toFixed(2) }}%
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { formatNumberToChineseUnit, gameNotifys } from '@/plugins/game'
  import type { EquipmentSlot, Player } from '@/types/game'

  // 定义组件名称
  defineOptions({
    name: 'weapon-tooltip'
  })

  // 定义props
  defineProps<{
    calculateCost?: number
    calculateEnhanceSuccessRate?: number
    player: Player
    strengthenInfo: EquipmentSlot
  }>()
</script>
<style scoped>
  .attribute {
    width: calc(50% - 8px);
    margin: 4px;
    overflow: auto hidden;
  }

  .attribute-box {
    display: flex;
    flex-wrap: wrap;
  }

  /* 炼器弹窗 */

  .click-box button {
    margin-top: 10px;
    width: 100%;
  }

  /* 装备信息 */

  .collapse p,
  .monsterinfo-box p {
    display: contents;
  }

  /* 基础属性对比 */

  /* 属性对比 */

  /* 新手弹窗 */

  .newbieinfo-box p {
    margin-bottom: 10px;
  }

  @media only screen and (max-width: 768px) {
  }
</style>
<style>
  @media only screen and (max-width: 768px) {
    /* 新手弹窗 */
  }

  /* 上传按钮 */
</style>
