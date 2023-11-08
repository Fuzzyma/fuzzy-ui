<template>
  <tr>
    <th v-for="[key, col] in columns" :key="col.key + 'th'" v-bind="col.headerAttrs">
      <HCell :col="col" @sort="sort(key, col)" />
    </th>
  </tr>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import HCell from './HCell.vue'
import { ColConfig, tableProvideKey } from './types'
import { useLogHooks } from './useLogHooks'

useLogHooks('HRow')

const { columns, setSort } = inject(tableProvideKey)!

const sort = (colKey: string, col: ColConfig) => {
  setSort(colKey, col.sortDirection === undefined ? 'asc' : col.sortDirection === 'asc' ? 'desc' : undefined)
}
</script>
