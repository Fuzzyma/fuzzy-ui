<template>
  <tr ref="tr" :class="{ checked: isCheckedRow(data) }">
    <Cell v-for="[, col] in columns" :key="col.key" :row="data" :col="col" />
  </tr>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
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

const tr = ref<HTMLTableRowElement>()

defineExpose({
  focusCell: (x: number, dx: number) => {
    const nthCol = x + 1 + dx

    let el
    // Optimize for the forward case
    if (dx > 0) {
      el = tr.value?.querySelector(
        `td:nth-child(n+${nthCol}) :is(input,button,a,textarea,select):not([disabled])`
      ) as HTMLInputElement
    } else {
      let els = tr.value?.querySelectorAll(
        `td:nth-child(-n+${nthCol}) :is(input,button,a,textarea,select):not([disabled])`
        // eslint-disable-next-line no-undef
      ) as NodeListOf<HTMLInputElement>
      el = els[els.length - 1]
    }

    el.focus()
    el.select()
  },
})

if (import.meta.env.DEV) {
  useLogHooks('row')
}
</script>
