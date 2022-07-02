<template>
  <div v-bind="$attrs" :id="uniqueId" class="fuzzy-ui-table">
    <component :is="'style'" v-once ref="styleRef"></component>
    <Columns />
    <div ref="wrapperRef" class="table-scroll">
      <table>
        <thead>
          <HRow></HRow>
        </thead>
        <tbody>
          <Row
            v-for="(row, index) in filteredRows.slice(currentRow, currentRow + numberOfRows)"
            :key="index"
            :data="row"
          />
        </tbody>
      </table>
    </div>
    <div v-show="showLeftShadow" class="shadow shadow-left" />
    <div v-show="showRightShadow" class="shadow shadow-right" />
    <div v-show="showTopShadow" class="shadow shadow-top" />
    <div v-show="!filteredRows.length" class="no-data">
      <slot name="empty" :filter="!!data.length">
        <div>
          No data {{ data.length ? 'matching your filter' : '' }}
          <button v-if="data.length" class="reset-button" @click="resetFilter">Reset Filters</button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  provide,
  ref,
  useSlots,
  watch,
  watchEffect,
} from 'vue'
import { getId } from '../../utils'
import HRow from './HRow.vue'
import Row from './Row.vue'
import { ColConfig, Data, Row as RowType, tableProvideKey, UpdateFnType } from './types'
import { useLogHooks } from './useLogHooks'

const props = defineProps({
  data: {
    type: Array as PropType<Data>,
    required: true,
  },
  'onUpdate:data': {
    type: Function as PropType<(data: Data) => any | Promise<any>>,
  },
  onUpdateRow: {
    type: Function as PropType<(data: RowType, index: number) => any | Promise<any>>,
  },
  onUpdateField: {
    type: Function as PropType<UpdateFnType>,
  },
})

const emit = defineEmits<{
  (e: 'selection-change', row: RowType, checked: boolean): void
}>()

const uniqueId = getId('fuzzy-ui-table-')

if (import.meta.env.DEV) {
  useLogHooks('table', uniqueId)
}

const slots = useSlots()
const Columns = () => slots.default?.()

let currentSortKey = ''
let currentSortDirection: 'asc' | 'desc' | undefined = undefined

const wrapperRef = ref<HTMLDivElement>()
const styleRef = ref<HTMLStyleElement>()

const data = ref(props.data)
const columns = ref(new Map<string, ColConfig>())
const maxOrderNum = ref(0)
const checkedRows = ref(new Set<RowType>())
const rowKeys = ref(new Map<RowType, string>())
const filteredRowsSet = ref(new Set<RowType>(data.value))

const numberOfRows = ref(0)
const currentRow = ref(Infinity)
const currentRows = ref<RowType[]>([])
const partialRow = ref(0)
const rowHeight = ref(Infinity)

const showLeftShadow = ref(false)
const showRightShadow = ref(true)
const showTopShadow = ref(false)

const scrollbarWidth = ref(0)
const scrollbarHeight = ref(0)

const allSelected = computed({
  get: () => {
    const every = data.value.every(r => checkedRows.value.has(r))
    if (every) {
      return true
    }

    const some = data.value.some(r => checkedRows.value.has(r))

    if (some) {
      return null
    }

    return false
  },
  set: val => {
    if (val) {
      checkedRows.value = new Set(data.value)
    } else {
      checkedRows.value.clear()
    }
  },
})

const sortedColumns = computed(() => {
  return new Map(
    [...columns.value].sort(([, a], [, b]) => {
      if (a.fixed === 'left' && b.fixed !== 'left') {
        return -1
      }

      if (a.fixed !== 'left' && b.fixed === 'left') {
        return 1
      }

      if (a.fixed === 'right' && b.fixed !== 'right') {
        return 1
      }

      if (a.fixed !== 'right' && b.fixed === 'right') {
        return -1
      }

      return a.order - b.order
    })
  )
})

const filteredRows = computed(() => {
  return data.value.filter(row => filteredRowsSet.value.has(row))
})

const updateField = async (row: Record<string, unknown>, col: ColConfig, value: unknown) => {
  try {
    if (col.hasCustomSetter) {
      return await col.setter(row, value)
    }

    const field = col.prop
    const index = props.data.indexOf(row)

    if (props.onUpdateField) {
      return await props.onUpdateField?.(index, field, value)
    }

    if (props.onUpdateRow) {
      const r = { ...row, [field]: value }
      return await props.onUpdateRow(r, index)
    }

    if (props['onUpdate:data']) {
      const r = { ...row, [field]: value }
      const data = props.data.map((row, i) => (i === index ? r : { ...row }))
      return await props['onUpdate:data'](data)
    }

    await col.setter(row, value)
  } catch (e: unknown) {
    const field = col.prop
    const index = props.data.indexOf(row)
    console.warn(`Your update function threw an error while updating row #${index}, field: ${field} with ${value}:`, e)
    console.warn('Make sure to handle errors in your update function.')
  }
}

const registerCol = (colKey: string, config: ColConfig) => {
  if (columns.value.has(colKey)) {
    if (import.meta.env.DEV) console.warn(`Column with key "${colKey}" already registered.`)
    return
  }

  maxOrderNum.value = Math.max(maxOrderNum.value, config.order)

  columns.value.set(colKey, config)
}

const unregisterCol = (colKey: string) => {
  if (!columns.value.has(colKey)) {
    if (import.meta.env.DEV) console.warn(`Column with key "${colKey}" not registered.`)
    return
  }

  columns.value.delete(colKey)
}

const resetSort = () => {
  const rowOrder = [...rowKeys.value.keys()]
  data.value.sort((a, b) => rowOrder.indexOf(a) - rowOrder.indexOf(b))
}

const setSort = (colKey: string, direction: 'asc' | 'desc' | undefined) => {
  if (currentSortKey) {
    columns.value.get(currentSortKey)!.sortDirection = undefined
  }
  const col = columns.value.get(colKey)!
  currentSortKey = colKey
  col.sortDirection = direction
  currentSortDirection = direction

  if (!currentSortDirection) {
    resetSort()
    return
  }

  const sortFn =
    typeof col.sortable === 'function'
      ? col.sortable
      : (a: RowType, b: RowType) => {
          const aVal = col.getter(a)
          const bVal = col.getter(b)
          return `${aVal}`.localeCompare(`${bVal}`) * (currentSortDirection === 'asc' ? 1 : -1)
        }
  data.value.sort(sortFn)
}

const filter = (filterFn: (row: RowType) => boolean) => {
  filteredRowsSet.value = new Set(props.data.filter(filterFn))
}

const resetFilter = () => {
  filteredRowsSet.value = new Set(props.data)
}

const isCheckedRow = (row: RowType) => checkedRows.value.has(row)

const setCheckedRow = (row: RowType, checked: boolean) => {
  if (checked) {
    checkedRows.value.add(row)
  } else {
    checkedRows.value.delete(row)
  }
  emit('selection-change', row, checked)
}

const focusCell = (rowIndex: number, colIndex: number) => {
  nextTick(() => {
    const el = wrapperRef.value?.querySelector(
      `table > tbody > tr:nth-child(${rowIndex}) > td:nth-child(${colIndex + 1}) input`
    ) as HTMLInputElement

    el?.focus({ preventScroll: true })
  })
}

const setActiveCell = (rowIndex: number, colIndex: number, direction: string) => {
  switch (direction) {
    case 'up':
      wrapperRef.value?.scrollBy(0, -rowHeight.value)
      focusCell(rowIndex - 1, colIndex)
      break
    case 'down':
      wrapperRef.value?.scrollBy(0, rowHeight.value)
      focusCell(rowIndex + 1, colIndex)
      break
    case 'left':
      focusCell(rowIndex, colIndex - 1)
      break
    case 'right':
      focusCell(rowIndex, colIndex + 1)
      break
  }
}

const featurePartialRows = false
const updateCurrentRow = () => {
  const wrapper = wrapperRef.value
  if (!wrapper) return

  const { scrollTop, scrollHeight, clientHeight } = wrapper

  const newCurrentRow = Math.floor(scrollTop / rowHeight.value)

  if (newCurrentRow !== currentRow.value) {
    currentRow.value = newCurrentRow
    currentRows.value = filteredRows.value.slice(currentRow.value, currentRow.value + numberOfRows.value)
  }

  // Hidden behind feature flag because it is a real performance killer
  if (featurePartialRows) {
    const fraction = scrollTop % rowHeight.value
    if (fraction !== partialRow.value) {
      if (scrollTop === scrollHeight - clientHeight) {
        partialRow.value = 0
      } else {
        partialRow.value = fraction
      }
    }
  }
}

const updateShadowVisibility = (wrapper: HTMLDivElement) => {
  // Show shadows if not at maximum position
  const { scrollTop, scrollWidth, clientWidth, scrollLeft } = wrapper
  showLeftShadow.value = scrollLeft > 0
  showTopShadow.value = scrollTop > 0
  showRightShadow.value = scrollLeft !== scrollWidth - clientWidth
}

const setScrollbarDimensions = (wrapper: HTMLDivElement) => {
  // Calculate scrollbar dimensions
  const { clientHeight, clientWidth, offsetWidth, offsetHeight } = wrapper
  scrollbarWidth.value = offsetWidth - clientWidth
  scrollbarHeight.value = offsetHeight - clientHeight
}

const onScroll = () => {
  updateShadowVisibility(wrapperRef.value!)
  updateCurrentRow()
}

watch(
  () => [...data.value],
  data => {
    data.forEach(d => {
      if (rowKeys.value.has(d)) return
      rowKeys.value.set(d, Math.random().toString())
      filteredRowsSet.value.add(d)
    })
  },
  { immediate: true }
)

watch(
  () => props.data,
  () => {
    console.log('Data watcher triggered')
    data.value = props.data
  }
)

watch(filteredRows, updateCurrentRow)

watchEffect(() => {
  const style = styleRef.value
  if (!style) return

  const cols = [...sortedColumns.value]

  const hiddenIndexes: number[] = []
  const fixedIndexes: number[] = []
  const leftFixedInfo: [index: number, width: number, pos: number][] = []
  const rightFixedInfo: [index: number, width: number, pos: number][] = []
  const widthInfo: [index: number, width: number][] = []

  cols.forEach(([, col], i) => {
    if (col.hidden) {
      hiddenIndexes.push(i + 1)
      return
    }

    if (col.fixed !== false) {
      fixedIndexes.push(i + 1)

      if (col.fixed === 'left' || col.fixed === true || col.fixed === '') {
        const last = leftFixedInfo.at(-1)
        leftFixedInfo.push([i + 1, Number(col.width) + 2, last ? last[1] + last[2] : 0])
      }
    } else if (col.width) {
      widthInfo.push([i + 1, Number(col.width)])
    }
  })

  cols
    .slice()
    .reverse()
    .forEach(([, col], i) => {
      if (col.fixed === 'right') {
        const last = rightFixedInfo.at(-1)
        rightFixedInfo.unshift([cols.length - i, Number(col.width), last ? last[1] + last[2] : 0])
      }
    })

  const hiddenNthChild = hiddenIndexes.map(i => `:nth-child(${i})`).join(',')
  const hideSelectors = `div#${uniqueId} > div > table tr > :is(td, th):is(${hiddenNthChild})`

  const fixedNthChild = fixedIndexes.map(i => `:nth-child(${i})`).join(',')
  const fixedSelectors = `div#${uniqueId} > div > table tr > :is(td, th):is(${fixedNthChild})`
  const fixedSelectorsTd = `div#${uniqueId} > div > table tr > td:is(${fixedNthChild})`
  const fixedSelectorsTdChecked = `div#${uniqueId} > div > table tr.checked > td:is(${fixedNthChild})`
  const fixedSelectorsTdHover = `div#${uniqueId} > div > table tr:hover > td:is(${fixedNthChild})`
  const fixedSelectorsTh = `div#${uniqueId} > div > table tr > th:is(${fixedNthChild})`

  const hideRule = hiddenNthChild ? `${hideSelectors} { display: none; }` : ''
  const fixedRule = fixedNthChild ? `${fixedSelectors} { position: sticky; z-index: 1; }` : ''
  const bgColorTd = fixedNthChild ? `${fixedSelectorsTd} { background: var(--fuzzy-ui-table-col-bg-fixed); }` : ''
  const bgColorTdChecked = fixedNthChild
    ? `${fixedSelectorsTdChecked} { background: var(--fuzzy-ui-table-row-bg-checked); }`
    : ''
  const bgColorTdHover = fixedNthChild
    ? `${fixedSelectorsTdHover} { background: var(--fuzzy-ui-table-row-bg-hover); }`
    : ''
  const bgColorTh = fixedNthChild ? `${fixedSelectorsTh} { background: var(--fuzzy-ui-table-header-bg-fixed); }` : ''

  const posAndWidthRulesLeft = leftFixedInfo
    .map(([i, width, left]) => {
      return `div#${uniqueId} > div > table tr > :nth-child(${i}) { left: ${left}px; width: ${width}px; min-width: ${width}px; }`
    })
    .join('\n')

  const posAndWidthRulesRight = rightFixedInfo
    .map(([i, width, right]) => {
      return `div#${uniqueId} > div > table tr > :nth-child(${i}) { right: ${right}px; width: ${width}px; min-width: ${width}px; }`
    })
    .join('\n')

  const widthRules = widthInfo
    .map(([i, width]) => {
      return `div#${uniqueId} > div > table tr > :nth-child(${i}) { width: ${width}px; max-width: ${width}px; min-width: ${width}px; }`
    })
    .join('\n')

  const hasLeft = leftFixedInfo.length > 0
  const hasRight = rightFixedInfo.length > 0

  const shadowPosLeft = hasLeft ? leftFixedInfo.at(-1)![1] + leftFixedInfo.at(-1)![2] : 0
  const shadowPosRight = hasRight ? rightFixedInfo.at(-1)![1] + rightFixedInfo.at(-1)![2] : 0

  const shadowRuleLeft = `div#${uniqueId} div.shadow-left { left: ${shadowPosLeft}px }`

  const rightPos = shadowPosRight + (wrapperRef.value?.offsetWidth ?? 0) - (wrapperRef.value?.clientWidth ?? 0)
  const shadowRuleRight = `div#${uniqueId} div.shadow-right { right: ${rightPos}px }`

  style.innerHTML = [
    hideRule,
    fixedRule,
    bgColorTd,
    bgColorTdChecked,
    bgColorTdHover,
    bgColorTh,
    posAndWidthRulesLeft,
    posAndWidthRulesRight,
    widthRules,
    hasLeft ? shadowRuleLeft : '',
    hasRight ? shadowRuleRight : '',
  ].join('\n')
})

onMounted(() => {
  const wrapper = wrapperRef.value!

  nextTick(() => {
    setScrollbarDimensions(wrapper)
    updateShadowVisibility(wrapper)
  })

  const fontSize = window.getComputedStyle(document.documentElement).getPropertyValue('--fuzzy-ui-table-cell-font-size')
  const calcHeight = window.getComputedStyle(document.documentElement).getPropertyValue('--fuzzy-ui-table-row-height')
  const replaceCalc = calcHeight.replace(/calc/g, '')
  const replaceEm = replaceCalc.replace(/em/g, '*' + fontSize).replace(/px/g, '')
  rowHeight.value = eval(replaceEm)

  const thRowHeight = parseInt(window.getComputedStyle(wrapper).getPropertyValue('--fuzzy-ui-table-header-height'))
  numberOfRows.value = Math.ceil((wrapper.clientHeight - thRowHeight) / rowHeight.value) + 1

  updateCurrentRow()

  wrapper.addEventListener('scroll', onScroll)
})

onBeforeUnmount(() => wrapperRef.value!.removeEventListener('scroll', onScroll))

defineExpose({
  filter,
  resetFilter,
  selected: checkedRows,
})

provide(tableProvideKey, {
  updateField,
  data,
  columns: sortedColumns,
  registerCol,
  unregisterCol,
  isCheckedRow,
  setCheckedRow,
  setSort,
  setActiveCell,
  allSelected,
  maxOrderNum,
})

// TODO:
// - Resize observer to calculate new height of container and hide/show shadow
// - Adding a row doesnt resort the table
</script>

<style scoped>
div.shadow {
  position: absolute;
  width: 5px;
  top: 0;
  height: min(
    calc(v-bind('filteredRows.length') * var(--fuzzy-ui-table-row-height) + var(--fuzzy-ui-table-header-height)),
    calc(100% - v-bind('scrollbarHeight + "px"'))
  );
}

div.shadow-top {
  background: linear-gradient(180deg, gray, transparent);
  height: 5px;
  top: calc(var(--fuzzy-ui-table-header-height) - 1px);
  width: calc(100% - v-bind('scrollbarWidth + "px"'));
}

div.no-data {
  position: absolute;
  top: calc(var(--fuzzy-ui-table-header-height) - 1px);
  left: 0;
  width: calc(100% - v-bind('scrollbarWidth + "px"'));
  height: calc(100% - v-bind('scrollbarHeight + "px"') - var(--fuzzy-ui-table-header-height));
}

div.fuzzy-ui-table > .table-scroll::after {
  height: calc(v-bind('filteredRows.length') * var(--fuzzy-ui-table-row-height));
}

/* div.fuzzy-ui-table > .table-scroll > table > tbody {
  transform: translateY(v-bind('(-partialRow) + "px"'));
} */
</style>

<style>
:root {
  --fuzzy-ui-table-col-bg-fixed: #dddddd;
  --fuzzy-ui-table-header-bg: #f5f5f5;
  --fuzzy-ui-table-header-bg-fixed: var(--fuzzy-ui-table-col-bg-fixed);
  --fuzzy-ui-table-row-bg: white;
  --fuzzy-ui-table-row-bg-checked: #f0f0f0;
  --fuzzy-ui-table-row-bg-hover: #ccc;
  --fuzzy-ui-table-header-color: #333;
  --fuzzy-ui-table-header-font-size: 16px;
  --fuzzy-ui-table-header-font-weight: bold;
  --fuzzy-ui-table-header-height: 40px;
  --fuzzy-ui-table-header-padding: 10px;
  --fuzzy-ui-table-header-border: 1px solid #e5e5e5;
  --fuzzy-ui-table-cell-padding: 10px;
  --fuzzy-ui-table-cell-font-size: 14px;
  --fuzzy-ui-table-cell-font-weight: normal;
  --fuzzy-ui-table-cell-color: #333;
  --fuzzy-ui-table-cell-border-color: #e5e5e5;
  --fuzzy-ui-table-cell-border-width: 1px;
  --fuzzy-ui-table-cell-min-width: auto;
  --fuzzy-ui-table-cell-height: calc(var(--fuzzy-ui-table-cell-font-size) + var(--fuzzy-ui-table-cell-padding) * 2);
  --fuzzy-ui-table-row-height: calc(
    var(--fuzzy-ui-table-cell-height) + var(--fuzzy-ui-table-cell-border-width) * 2 + 2px
  );
}

.fuzzy-ui-table > .table-scroll > table > thead > tr > th > :is(div, label) {
  height: var(--fuzzy-ui-table-header-height);
  max-height: var(--fuzzy-ui-table-header-height);
  padding: var(--fuzzy-ui-table-header-padding);
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.fuzzy-ui-table > .table-scroll > table > thead > tr > th {
  background: var(--fuzzy-ui-table-header-bg);
  color: var(--fuzzy-ui-table-header-color);
  font-size: var(--fuzzy-ui-table-header-font-size);
  font-weight: var(--fuzzy-ui-table-header-font-weight);
  padding: 0;
  border: var(--fuzzy-ui-table-header-border);
  box-sizing: border-box;
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr > td {
  padding: 1px;
  /* height: var(--fuzzy-ui-table-cell-height); */
  box-sizing: border-box;
  /* padding: var(--fuzzy-ui-table-cell-padding); */
  font-size: var(--fuzzy-ui-table-cell-font-size);
  font-weight: var(--fuzzy-ui-table-cell-font-weight);
  color: var(--fuzzy-ui-table-cell-color);
  border-width: var(--fuzzy-ui-table-cell-border-width);
  border-color: var(--fuzzy-ui-table-cell-border-color);
  border-style: solid;
  white-space: nowrap;
  min-width: var(--fuzzy-ui-table-cell-min-width);
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr > td > :is(input, label) {
  all: unset;
  padding: var(--fuzzy-ui-table-cell-padding);
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  height: var(--fuzzy-ui-table-cell-height);
  line-height: 1;
}

.fuzzy-ui-table > .table-scroll > table tr > :is(td, th) > label > input {
  margin: auto;
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr > td > input:focus {
  outline: auto 1px Highlight;
}

.fuzzy-ui-table > .table-scroll > table > thead > tr > th > div > div {
  display: flex;
  width: 100%;
  align-items: center;
}

.fuzzy-ui-table > .table-scroll > table > thead > tr > th > div > div > span {
  transform: scaleY(0.7);
  margin-left: auto;
  user-select: none;
  min-width: 16px;
  flex-shrink: 0;
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr {
  background-color: var(--fuzzy-ui-table-row-bg);
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr.checked {
  background-color: var(--fuzzy-ui-table-row-bg-checked);
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr:hover {
  background-color: var(--fuzzy-ui-table-row-bg-hover);
}

.fuzzy-ui-table {
  position: relative;
  /* float: left; */
}

.fuzzy-ui-table > .table-scroll {
  overflow: auto;
  position: relative;
  height: 100%;
  width: 100%;
}

.fuzzy-ui-table > .table-scroll::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  pointer-events: none;
}

.fuzzy-ui-table > .table-scroll > table {
  position: sticky;
  border-spacing: 0;
  width: 100%;
  top: 0;
  /* height: 1px; */
}

.fuzzy-ui-table > .table-scroll > table > thead {
  position: sticky;
  background: white;
  z-index: 2;
  top: 0;
}

.fuzzy-ui-table > .no-data > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  height: 100%;
}

.fuzzy-ui-table > .no-data .reset-button {
  all: unset;
  text-decoration: underline;
  cursor: pointer;
}

.fuzzy-ui-table::after {
  display: table;
  content: '';
  clear: both;
}

.fuzzy-ui-table > div.shadow-left {
  background: linear-gradient(90deg, gray, transparent);
}

.fuzzy-ui-table > div.shadow-right {
  background: linear-gradient(90deg, transparent, gray);
}
</style>
