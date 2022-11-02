<script lang="ts">
import { computed, defineComponent, inject, onBeforeUnmount, PropType, reactive, toRefs, useAttrs, useSlots } from 'vue'
import { getId } from '../../utils'
import { ColConfig, Row, tableProvideKey } from './types'
import { useLogHooks } from './useLogHooks'

const spaceSeperatedToCamelCase = (str: string) => {
  return unCapitalize(str.replace(/\s(.)/g, (match, group1) => group1.toUpperCase()))
}

const unCapitalize = (str: string) => {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

const createPropAccessor = (field: string) => (row: Row) => row[field]
const createPropMutator = (field: string) => (row: Row, value: unknown) => (row[field] = value)

const returnNull = () => null

export default defineComponent({
  props: {
    header: { type: String, default: '' },
    prop: { type: String },
    getter: { type: Function as PropType<ColConfig['getter']> },
    setter: { type: Function as PropType<ColConfig['setter']> },
    sortable: [Boolean, Function] as PropType<ColConfig['sortable']>,
    filterable: Boolean,
    editable: [Boolean, Function] as PropType<ColConfig['editable']>,
    checkbox: Boolean,
    width: [String, Number],
    fixed: [String, Boolean],
    hidden: Boolean,
    sortDirection: {
      type: String as PropType<'asc' | 'desc' | undefined>,
      default: undefined,
    },
    order: {
      type: Number,
    },
    getterOnEdit: {
      type: Boolean,
    },
    prepend: {
      type: String,
    },
    append: {
      type: String,
    },
    options: {
      type: Array as PropType<ColConfig['options']>,
    },
    class: {
      type: [String, Array, Object],
    },
    colAttrs: {
      type: Function as PropType<ColConfig['colAttrs']>,
    },
    format: {
      type: Function as PropType<ColConfig['format']>,
      default: (s: unknown) => s,
    },
  },
  setup(props) {
    const { registerCol, isCheckedRow, unregisterCol, setCheckedRow, maxOrderNum } = inject(tableProvideKey)!

    if (import.meta.env.DEV) {
      useLogHooks(
        'Column.vue',
        computed(() => props.header)
      )
    }

    const computedAccessor = computed(() => {
      if (props.getter) {
        return props.getter
      }

      if (props.checkbox) {
        return isCheckedRow
      }

      return createPropAccessor(computedProp.value)
    })

    const computedMutator = computed(() => {
      if (props.setter) {
        return props.setter
      }

      if (props.checkbox) {
        return setCheckedRow as ColConfig['setter']
      }

      return createPropMutator(computedProp.value)
    })

    const computedProp = computed(() => {
      return props.prop ?? spaceSeperatedToCamelCase(props.header)
    })

    const maxOrder = maxOrderNum.value + 1
    const internalOrder = computed(() => props.order ?? maxOrder)
    const colKey = getId(props.header || props.prop)

    const propRefs = toRefs(props)
    const adaptedProps = reactive({
      ...propRefs,
      prop: computedProp,
      getter: computedAccessor,
      setter: computedMutator,
      slots: useSlots(),
      key: colKey,
      sortDirection: props.sortDirection,
      fixed: computed(() => (props.fixed === true || props.fixed === '' ? 'left' : props.fixed)),
      order: internalOrder,
      hasCustomSetter: computed(() => !!props.setter),
      attrs: useAttrs(),
    })

    registerCol(colKey, adaptedProps)

    onBeforeUnmount(() => unregisterCol(colKey))

    return returnNull
  },
})
</script>
