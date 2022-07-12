<template>
  <td ref="tdRef">
    <CellSlot v-if="col.slots.default" />
    <label v-else-if="col.checkbox" class="fuzzy-ui-table-cell-checkbox">
      <input
        :checked="!!value"
        type="checkbox"
        @change="setCheckedRow(row, ($event.target as HTMLInputElement).checked)"
      />
    </label>
    <label v-else-if="col.options" class="fuzzy-ui-table-cell-select">
      <span v-if="col.prepend" class="fuzzy-ui-table-cell-prepend">{{ col.prepend }}</span>
      <span v-if="col.append" class="fuzzy-ui-table-cell-append">{{ col.append }}</span>
      <select v-model="value" :disabled="!editable" v-bind="col.attrs" v-on="listeners">
        <option :value="undefined" disabled hidden v-text="col.attrs.placeholder ?? 'Please Select...'" />
        <option value="" disabled hidden v-text="col.attrs.placeholder ?? 'Please Select...'" />
        <option v-for="option in col.options" :key="option.value" :value="option.value" v-text="option.label" />
      </select>
    </label>
    <label v-else>
      <span v-if="col.prepend" class="fuzzy-ui-table-cell-prepend">{{ col.prepend }}</span>
      <span v-if="col.append" class="fuzzy-ui-table-cell-append">{{ col.append }}</span>
      <input v-model="value" :disabled="!editable" v-bind="col.attrs" :type="type" v-on="listeners" />
    </label>
  </td>
</template>

<script setup lang="ts">
import { computed, inject, PropType, ref, Slot, watch, nextTick } from 'vue'
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

const value = ref(props.col.getter(props.row, props.col))

const type = ref(props.col.attrs.type === 'number' ? 'text' : (props.col.attrs.type as string))

const editable = computed(() => {
  if (!props.col.editable) {
    return false
  }
  if (typeof props.col.editable === 'boolean') {
    return props.col.editable
  }
  return props.col.editable(props.row)
})

watch(
  () => props.col.getter(props.row, props.col),
  val => {
    value.value = val
  }
)

const save = async () => {
  console.log('save')
  await updateField(props.row, props.col, value.value)

  // props.col.setter(props.row, value.value)

  // editOn.value = false
}

const edit = () => {
  value.value = String(props.col.getter(props.row, props.col))
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
  if (!editable.value) return {}

  return {
    focus: () => {
      value.value = props.col.getterOnEdit
        ? props.col.getter(props.row, props.col)
        : props.row[props.col.prop] ?? props.col.getter(props.row, props.col)
      type.value = props.col.attrs.type as string
    },
    blur: () => {
      type.value = props.col.attrs.type === 'number' ? 'text' : (props.col.attrs.type as string)
      nextTick().then(() => {
        value.value = props.col.getter(props.row, props.col)
      })
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
        value.value = String(props.col.getter(props.row, props.col))
        return
      }
    },
    // dblclick: edit,
  }
})

const CellSlot = () => {
  return props.col.slots.default?.({
    valueRef: value,
    row: props.row,
    col: props.col,
    listeners: listeners.value,
    type: type.value,
  })
}
</script>
