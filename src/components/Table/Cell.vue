<template>
  <td ref="tdRef">
    <Component :is="col.slots.default" v-if="col.slots.default" :row="row" :col="col" />
    <label v-else-if="col.checkbox">
      <input
        :checked="!!value"
        type="checkbox"
        @change="setCheckedRow(row, ($event.target as HTMLInputElement).checked)"
      />
    </label>
    <input v-else v-model="value" :disabled="!col.editable" :type="col.type" v-on="listeners" />
  </td>
</template>

<script setup lang="ts">
import { computed, inject, PropType, ref, Slot, watch } from 'vue'
import { ColConfig, tableProvideKey } from './types'
import { useLogHooks } from './useLogHooks'

const props = defineProps({
  row: {
    type: Object,
    required: true,
  },
  col: {
    type: Object as PropType<ColConfig>,
    required: true,
  },
  component: {
    type: Function as PropType<Slot>,
  },
})

useLogHooks('cell')

const { setActiveCell, setCheckedRow, updateField } = inject(tableProvideKey)!

const value = ref(props.col.getter(props.row))

watch(
  () => props.col.getter(props.row),
  val => {
    value.value = val
  }
)

const save = async () => {
  await updateField(props.row, props.col, value.value)

  // props.col.setter(props.row, value.value)
  value.value = props.col.getter(props.row)
  // editOn.value = false
}

const edit = () => {
  value.value = String(props.col.getter(props.row))
}

defineExpose({ edit, save })

// const updateFn = computed(() => {
//   const index = data.indexOf(props.row)
//   return updateField.bind(null, props.row, index, props.col.prop)
// })

const tdRef = ref<HTMLTableCellElement>()

const getRowAndColIndex = () => {
  const index = tdRef.value!.cellIndex
  const rowIndex = (tdRef.value?.parentElement as HTMLTableRowElement).rowIndex
  return [rowIndex, index] as const
}

const listeners = computed(() => {
  if (!props.col.editable) return {}

  return {
    focus: () => {
      value.value = props.col.getterOnEdit
        ? props.col.getter(props.row)
        : props.row[props.col.prop] ?? props.col.getter(props.row)
    },
    change: save,
    keydown: (e: KeyboardEvent) => {
      if (e.key === 'Tab') return
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        return setActiveCell(...getRowAndColIndex(), 'down')
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        return setActiveCell(...getRowAndColIndex(), 'up')
      }
      // if (e.key === 'Tab') {
      //   e.preventDefault()
      //   if (e.shiftKey) {
      //     return setActiveCell(...getRowAndColIndex(), 'left')
      //   } else {
      //     return setActiveCell(...getRowAndColIndex(), 'right')
      //   }
      // }
      if (e.key === 'Escape') {
        e.preventDefault()
        value.value = String(props.col.getter(props.row))
        return
      }
    },
    // dblclick: edit,
  }
})
</script>
