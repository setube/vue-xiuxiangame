<template>
  <el-tag :disable-transitions="true" :class="customTypeClass">
    <slot></slot>
  </el-tag>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps({
    type: {
      type: String,
      default: 'info'
    }
  })

  const customTypeClass = computed(() => {
    if (props.type === 'pink') return 'el-tag--pink'
    else if (props.type === 'purple') return 'el-tag--purple'
    else return `el-tag--${props.type}`
  })
</script>
