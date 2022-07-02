<template>
  <tr :class="{ checked: isCheckedRow(data) }">
    <Cell v-for="[, col] in columns" :key="col.key" :row="data" :col="col" />
  </tr>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import Cell from './Cell.vue'
import { tableProvideKey } from './types'
import { useLogHooks } from './useLogHooks'

defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const { columns, isCheckedRow } = inject(tableProvideKey)!

if (import.meta.env.DEV) {
  useLogHooks('row')
}
</script>
