<script lang="ts">
import { computed, defineComponent, h, inject, PropType, ref, watch } from 'vue'
import { ColConfig, tableProvideKey } from './types'
import { useLogHooks } from './useLogHooks'

const getDirectionChar = (direction: 'asc' | 'desc' | undefined) => {
  return direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : ''
}

export default defineComponent({
  props: {
    col: {
      type: Object as PropType<ColConfig>,
      required: true,
    },
  },
  emits: ['sort'],
  setup(props, { emit }) {
    const { allSelected } = inject(tableProvideKey)!
    const sort = () => emit('sort')
    const onChange = () => {
      allSelected.value = !allSelected.value
    }

    const checkboxRef = ref<HTMLInputElement>()

    watch(allSelected, selected => {
      if (checkboxRef.value) {
        checkboxRef.value.indeterminate = selected === null
      }
    })

    if (import.meta.env.DEV) {
      useLogHooks(
        'HCell',
        computed(() => props.col.header)
      )
    }

    return () => {
      const col = props.col
      const isCheckbox = col.checkbox
      const slot = col.slots.header
      const children =
        slot ??
        (isCheckbox
          ? h('input', {
              type: 'checkbox',
              checked: allSelected.value,
              onChange,
              ref: checkboxRef,
            })
          : h('div', [col.header, col.sortable ? h('span', getDirectionChar(props.col.sortDirection)) : null]))

      return isCheckbox ? h('label', children) : h('div', { onClick: col.sortable ? sort : undefined }, children)
    }
  },
})
</script>
