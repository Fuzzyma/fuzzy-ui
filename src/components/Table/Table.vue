<!-- <template>
  <div v-id v-bind="$attrs" class="fuzzy-ui-table">
    <component :is="'style'" v-once ref="styleRef"></component>
    <Columns />
    <div ref="scrollRef" class="table-scroll">
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
</template> -->

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  provide,
  Ref,
  ref,
  toRaw,
  useAttrs,
  useSlots,
  watch,
  watchEffect,
} from 'vue'
import { getId } from '../../utils'
import HRow from './HRow.vue'
import Row from './Row.vue'
import { ColConfig, Data, Row as RowType, tableProvideKey, UpdateFnType } from './types'
import { useLogHooks } from './useLogHooks'

import {
  setBlockTracking,
  openBlock,
  createBlock,
  createVNode,
  createElementVNode,
  renderList,
  Fragment,
  createElementBlock,
  vShow,
  withDirectives,
  renderSlot,
  createCommentVNode,
  createTextVNode,
  mergeProps,
} from 'vue'

const Comp = defineComponent({
  props: {
    data: {
      type: Array as PropType<Data>,
      required: true,
    },
    'onUpdate:data': {
      type: Function as PropType<(data: Data) => any | Promise<any>>,
    },
    onUpdateRow: {
      type: Function as PropType<
        (row: RowType, index: number, data: Ref<RowType[]>, dataIndex: number) => any | Promise<any>
      >,
    },
    onUpdateField: {
      type: Function as PropType<UpdateFnType>,
    },
    showAll: {
      type: Boolean,
    },
  },

  emits: ['selection-change'],

  setup(props, { emit, expose }) {
    const uniqueId = getId('fuzzy-ui-table-')

    const vId = (el: HTMLElement) => {
      el.setAttribute('id', uniqueId)
    }

    if (import.meta.env.DEV) {
      useLogHooks('table', uniqueId)
    }

    const slots = useSlots()
    const Columns = () => slots.default?.()

    let currentSortKey = ''
    let currentSortDirection: 'asc' | 'desc' | undefined = undefined

    const scrollRef = ref<HTMLDivElement>()
    const styleRef = ref<HTMLStyleElement>()

    const data = ref(props.data.slice())
    const columns = ref(new Map<string, ColConfig>())
    const maxOrderNum = ref(0)
    const checkedRows = ref(new Set<RowType>())
    const rowKeys = ref(new Map<RowType, string>())
    const filteredRowsSet = ref(new Set<RowType>(data.value))
    const refs = ref(new Map<RowType, InstanceType<typeof Row>>())

    const numberOfRows = ref(props.showAll ? Infinity : 0)
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

        const index = toRaw(props.data).indexOf(toRaw(row))
        const dataIndex = data.value.indexOf(row)

        if (props.onUpdateField) {
          return await props.onUpdateField?.(index, field, value, data, dataIndex)
        }

        if (props.onUpdateRow) {
          const r = { ...row, [field]: value }
          return await props.onUpdateRow(r, index, data, dataIndex)
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
        console.warn(
          `Your update function threw an error while updating row #${index}, field: ${field} with ${value}:`,
          e
        )
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
          : (a: RowType, b: RowType, col: ColConfig) => {
              const aVal = col.getter(a, col)
              const bVal = col.getter(b, col)

              if (typeof aVal === 'number' && typeof bVal === 'number') {
                return aVal - bVal
              }

              return `${aVal}`.localeCompare(`${bVal}`)
            }

      const reverseIfNeeded = (a: RowType, b: RowType) =>
        currentSortDirection === 'asc' ? sortFn(a, b, col) : sortFn(b, a, col)
      data.value.sort(reverseIfNeeded)
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

    let idle: Promise<void> | null = null
    let promiseResolve: () => void

    const setActiveCell = async (x: number, [dx, dy]: [dx: number, dy: number], row: RowType) => {
      if (idle) return

      // Reached left most cell => go one row up
      if (x + dx < 0) {
        x = sortedColumns.value.size - 1
        dy = -1
        dx = 0
      }

      // Reached right most cell => go one row down
      if (x + dx > sortedColumns.value.size - 1) {
        x = 0
        dx = 0
        dy = 1
      }

      const y = filteredRows.value.indexOf(row)
      const nextRow = filteredRows.value[y + dy]

      // Reached top or bottom => do nothing
      if (!nextRow) {
        return
      }

      // Scroll one row if we reached the top or bottom of the table (buffer of 3 rows)
      if (dy < 0 && currentRows.value.indexOf(nextRow) < 2) {
        if (scrollRef.value?.scrollTop) {
          scrollRef.value?.scrollBy(0, -rowHeight.value)
          idle = new Promise(resolve => {
            promiseResolve = resolve
          })
        }
      } else if (dy > 0 && currentRows.value.indexOf(nextRow) > currentRows.value.length - 4) {
        if (y < filteredRows.value.length - 3) {
          scrollRef.value?.scrollBy(0, rowHeight.value)
          idle = new Promise(resolve => {
            promiseResolve = resolve
          })
        }
      }

      idle?.then(() => {
        refs.value.get(nextRow)?.focusCell(x, dx)
        idle = null
      }) ?? refs.value.get(nextRow)?.focusCell(x, dx)
      // nextTick().then(() => {
      //   promiseResolve?.()
      // })
    }

    const featurePartialRows = true
    const updateCurrentRow = () => {
      const wrapper = scrollRef.value
      if (!wrapper) return

      const { scrollTop, scrollHeight, clientHeight } = wrapper

      let newCurrentRow = Math.floor(scrollTop / rowHeight.value)

      // This is a hack to show the last row in chrome
      if (scrollTop === scrollHeight - clientHeight) {
        newCurrentRow = filteredRows.value.length - numberOfRows.value
      }

      if (newCurrentRow !== currentRow.value) {
        currentRow.value = newCurrentRow
        currentRows.value = filteredRows.value.slice(currentRow.value, currentRow.value + numberOfRows.value + 1)
      }

      // Hidden behind feature flag because it is a real performance killer
      if (featurePartialRows) {
        const fraction = scrollTop % rowHeight.value
        if (fraction !== partialRow.value) {
          // if (scrollTop === scrollHeight - clientHeight) {
          //   partialRow.value = 0
          // } else {
          // console.log(scrollTop, scrollHeight, clientHeight, scrollHeight - clientHeight)
          partialRow.value = ~~fraction
          // }
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

    // let scrollAnimationFrame: number
    const onScroll = () => {
      updateShadowVisibility(scrollRef.value!)
      updateCurrentRow()
      promiseResolve?.()
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
        data.value = props.data.slice()
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

      const id = uniqueId

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
      const hideSelectors = `div#${id} > div > table tr > :is(td, th):is(${hiddenNthChild})`

      const fixedNthChild = fixedIndexes.map(i => `:nth-child(${i})`).join(',')
      const fixedSelectors = `div#${id} > div > table tr > :is(td, th):is(${fixedNthChild})`
      const fixedSelectorsTd = `div#${id} > div > table tr > td:is(${fixedNthChild})`
      const fixedSelectorsTdChecked = `div#${id} > div > table tr.checked > td:is(${fixedNthChild})`
      const fixedSelectorsTdHover = `div#${id} > div > table tr:hover > td:is(${fixedNthChild})`
      const fixedSelectorsTh = `div#${id} > div > table tr > th:is(${fixedNthChild})`

      const hideRule = hiddenNthChild ? `${hideSelectors} { display: none; }` : ''
      const fixedRule = fixedNthChild ? `${fixedSelectors} { position: sticky; z-index: 1; }` : ''
      const bgColorTd = fixedNthChild ? `${fixedSelectorsTd} { background: var(--fuzzy-ui-table-col-bg-fixed); }` : ''
      const bgColorTdChecked = fixedNthChild
        ? `${fixedSelectorsTdChecked} { background: var(--fuzzy-ui-table-row-bg-checked); }`
        : ''
      const bgColorTdHover = fixedNthChild
        ? `${fixedSelectorsTdHover} { background: var(--fuzzy-ui-table-row-bg-hover); }`
        : ''
      const bgColorTh = fixedNthChild
        ? `${fixedSelectorsTh} { background: var(--fuzzy-ui-table-header-bg-fixed); }`
        : ''

      const posAndWidthRulesLeft = leftFixedInfo
        .map(([i, width, left]) => {
          return `div#${id} > div > table tr > :nth-child(${i}) { left: ${left}px; max-width: ${width}px; min-width: ${width}px; }`
        })
        .join('\n')

      const posAndWidthRulesRight = rightFixedInfo
        .map(([i, width, right]) => {
          return `div#${id} > div > table tr > :nth-child(${i}) { right: ${right}px; max-width: ${width}px; min-width: ${width}px; }`
        })
        .join('\n')

      const widthRules = widthInfo
        .map(([i, width]) => {
          return `div#${id} > div > table tr > :nth-child(${i}) { width: ${width}px; max-width: ${width}px; min-width: ${width}px; }`
        })
        .join('\n')

      const hasLeft = leftFixedInfo.length > 0
      const hasRight = rightFixedInfo.length > 0

      const shadowPosLeft = hasLeft ? leftFixedInfo.at(-1)![1] + leftFixedInfo.at(-1)![2] : 0
      const shadowPosRight = hasRight ? rightFixedInfo.at(-1)![1] + rightFixedInfo.at(-1)![2] : 0

      const shadowRuleLeft = `div#${id} div.shadow-left { left: ${shadowPosLeft}px }`

      const rightPos = shadowPosRight + scrollbarWidth.value
      const shadowRuleRight = `div#${id} div.shadow-right { right: ${rightPos}px }`

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
      const wrapper = scrollRef.value!

      nextTick(() => {
        setScrollbarDimensions(wrapper)
        updateShadowVisibility(wrapper)
      })

      const fontSize = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--fuzzy-ui-table-cell-font-size')
      const calcHeight = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--fuzzy-ui-table-row-height')
      const replaceCalc = calcHeight.replace(/calc/g, '')
      const replaceEm = replaceCalc.replace(/em/g, '*' + fontSize).replace(/px/g, '')
      rowHeight.value = eval(replaceEm)

      const thRowHeight = parseInt(window.getComputedStyle(wrapper).getPropertyValue('--fuzzy-ui-table-header-height'))
      numberOfRows.value = props.showAll ? Infinity : Math.ceil((wrapper.clientHeight - thRowHeight) / rowHeight.value)

      updateCurrentRow()

      wrapper.addEventListener('scroll', onScroll, { passive: true })
    })

    onBeforeUnmount(() => scrollRef.value!.removeEventListener('scroll', onScroll))

    expose({
      filter,
      resetFilter,
      selected: checkedRows,
      filteredRows,
      scrollRef,
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

    const hoisted_scroll = {
      ref: 'scrollRef',
      class: 'table-scroll',
    }
    const hoisted_shadowLeft = { class: 'shadow shadow-left' }
    const hoisted_shadowRight = { class: 'shadow shadow-right' }
    const hoisted_shadowTop = { class: 'shadow shadow-top' }
    const hoisted_empty = { class: 'no-data' }
    const hoisted_root = { class: 'fuzzy-ui-table' }
    const hoisted_empty_button = {
      onClick: resetFilter,
      class: 'reset-button',
      key: 0,
    }
    const hoisted_data_style = ['data', 'style']
    const hoisted_data = ['data']
    const hoisted_dynamic_style = ['style', 'class']
    const $attrs = useAttrs()

    const rowKeys2 = new Map<RowType, number>()

    let lastNumberOfRows = 0
    let lastCurrentRow = 0
    let oldMax = 0

    const getRowNodes = () => {
      const height = rowHeight.value
      const newRows = filteredRows.value.slice(currentRow.value, currentRow.value + numberOfRows.value + 1)

      if (props.showAll) {
        return renderList(newRows, (data, key) => {
          return (
            openBlock(),
            createBlock(
              Row,
              {
                key,
                data,
              },
              null,
              8,
              hoisted_data
            )
          )
        })
      }

      const lastRows = filteredRows.value.slice(lastCurrentRow, lastCurrentRow + lastNumberOfRows + 1)

      lastCurrentRow = currentRow.value
      lastNumberOfRows = numberOfRows.value

      const fraction = partialRow.value

      const freed: number[] = []
      // Delete unused rows and collect free keys
      lastRows.forEach(row => {
        if (!newRows.includes(row)) {
          const key = rowKeys2.get(row)
          rowKeys2.delete(row)

          if (key != null) {
            freed.push(key)
          }
        }
      })

      // const id = uniqueId

      const rowNodes = newRows
        .map((row, i) => {
          let key = rowKeys2.get(row)

          if (!key) {
            key = freed.shift() || (oldMax = Math.max(rowKeys2.size, oldMax + 1))
            rowKeys2.set(row, key)
          }

          // cssText += `div#${id} > div > table tr:nth-child(${key + 1}) { transform: translateY(${
          //   i * height - fraction
          // }px) }`

          return {
            key,
            ref: (el: InstanceType<typeof Row>) => refs.value.set(row, el),
            // style: { top: i * height - partialRow.value + 'px' },
            // style: 'top:' + (i * height - partialRow.value) + 'px',
            style: { transform: 'translateY(' + (i * height - fraction) + 'px)' },
            // style: 'transform: translateY(' + (i * height - partialRow.value) + 'px)',
            data: row,
          }
        })
        .sort((a, b) => a.key - b.key)

      // return renderList(rowNodes, ({ key, style, data }) => h(Row, { key, data, style }))
      return renderList(rowNodes, ({ key, style, data, ref }) => {
        return (
          openBlock(),
          createBlock(
            Row,
            {
              key,
              data,
              style,
              ref,
            },
            null,
            8,
            hoisted_data_style
          )
        )
      })
    }

    const computedStyle = computed(() => ({
      '--fuzzy-ui-table-filtered_rows_length': filteredRows.value.length,
      '--fuzzy-ui-table-scrollbar_width': scrollbarWidth.value + 'px',
      '--fuzzy-ui-table-scrollbar_height': scrollbarHeight.value + 'px',
    }))

    // return () => {
    //   const len = data.value.length

    //   return withDirectives(
    //     h('div', mergeProps($attrs, hoisted_root, { style: computedStyle.value }), [
    //       h('style', { ref: styleRef }),
    //       Columns(),
    //       h('div', { ...hoisted_wrapper }, [
    //         h('table', [h('thead', h(HRow)), h('tbody', getRowNodes())]),
    //       ]),
    //       withDirectives(h('div', hoisted_shadowLeft), [[vShow, showLeftShadow.value]]),
    //       withDirectives(h('div', hoisted_shadowRight), [[vShow, showRightShadow.value]]),
    //       withDirectives(h('div', hoisted_shadowTop), [[vShow, showTopShadow.value]]),
    //       withDirectives(
    //         h('div', hoisted_empty, [
    //           renderSlot(
    //             slots,
    //             'empty',
    //             { filter: !!len },
    //             () => [
    //               h('div', [
    //                 'No data ' + (len ? 'matching your filter' : ''),
    //                 len ? h('button', hoisted_empty_button, 'Reset filter') : null,
    //               ]),
    //             ],
    //             true
    //           ),
    //         ]),
    //         [[vShow, !filteredRows.value.length]]
    //       ),
    //     ]),
    //     [[vId]]
    //   )
    // }

    // let cssText = ''

    return (_: any, cache: any[]) => {
      const len = data.value.length

      return withDirectives(
        (openBlock(),
        createElementBlock(
          'div',
          mergeProps($attrs, hoisted_root, {
            class: { 'fuzzy-ui-table-show-all': props.showAll },
            style: computedStyle.value,
          }),
          [
            cache[0] ||
              (setBlockTracking(-1),
              (cache[0] = createElementVNode('style', { ref: styleRef }, [], 512)),
              setBlockTracking(1),
              cache[0]),

            createVNode(Columns),
            createElementVNode(
              'div',
              { ...hoisted_scroll, ref: scrollRef },
              [
                createElementVNode('table', null, [
                  createElementVNode('thead', null, [createVNode(HRow)]),
                  createElementVNode('tbody', null, [
                    (openBlock(true), createElementBlock(Fragment, null, getRowNodes(), 128)),
                  ]),
                ]),
              ],
              512
            ),
            withDirectives(createElementVNode('div', hoisted_shadowLeft, null, 512), [[vShow, showLeftShadow.value]]),
            withDirectives(createElementVNode('div', hoisted_shadowRight, null, 512), [[vShow, showRightShadow.value]]),
            withDirectives(createElementVNode('div', hoisted_shadowTop, null, 512), [[vShow, showTopShadow.value]]),
            // createElementVNode('style', null, [createTextVNode(cssText, 1)], 512),
            withDirectives(
              createElementVNode(
                'div',
                hoisted_empty,
                [
                  renderSlot(
                    slots,
                    'empty',
                    {
                      filter: !!len,
                    },
                    () => [
                      createElementVNode('div', null, [
                        createTextVNode('No data ' + (len ? 'matching your filter' : ''), 1),
                        len
                          ? (openBlock(), createElementBlock('button', hoisted_empty_button, 'Reset Filters'))
                          : createCommentVNode('v-if', true),
                      ]),
                    ],
                    true
                  ),
                ],
                512
              ),
              [[vShow, !filteredRows.value.length]]
            ),
          ],
          16,
          hoisted_dynamic_style
        )),
        [[vId]]
      )
    }
  },
})

export default Comp as typeof Comp & {
  new (...args: any): {
    filter: (filterFn: (row: RowType) => boolean) => void
    filteredRows: RowType[]
    resetFilter: () => void
    scrollRef: HTMLDivElement
    selected: RowType[]
  }
}

// TODO:
// - Resize observer to calculate new height of container and hide/show shadow
// - Adding a row doesnt resort the table
// - support events on column
</script>

<style scoped>
div.shadow {
  position: absolute;
  width: var(--fuzzy-ui-table-shadow-width);
  top: 0;
  height: min(
    calc(
      var(--fuzzy-ui-table-filtered_rows_length) * var(--fuzzy-ui-table-row-height) +
        var(--fuzzy-ui-table-header-height)
    ),
    calc(100% - var(--fuzzy-ui-table-scrollbar_height))
  );
}

div.shadow-top {
  background: linear-gradient(180deg, var(--fuzzy-ui-table-shadow-color), transparent);
  height: var(--fuzzy-ui-table-shadow-width);
  top: calc(var(--fuzzy-ui-table-header-height) - 1px);
  width: calc(100% - var(--fuzzy-ui-table-scrollbar_width));
}

div.no-data {
  position: absolute;
  top: calc(var(--fuzzy-ui-table-header-height) - 1px);
  left: 0;
  width: calc(100% - var(--fuzzy-ui-table-scrollbar_width));
  height: calc(100% - var(--fuzzy-ui-table-scrollbar_height) - var(--fuzzy-ui-table-header-height));
}

div.fuzzy-ui-table > .table-scroll::after {
  height: calc(var(--fuzzy-ui-table-filtered_rows_length) * var(--fuzzy-ui-table-row-height));
}
</style>

<style>
:where(:root) {
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
  --fuzzy-ui-table-shadow-color: gray;
  --fuzzy-ui-table-shadow-width: 5px;
  --fuzzy-ui-table-cell-padding: 10px;
  --fuzzy-ui-table-cell-font-size: 14px;
  --fuzzy-ui-table-cell-font-weight: normal;
  --fuzzy-ui-table-cell-color: #333;
  --fuzzy-ui-table-cell-border-color: #e5e5e5;
  --fuzzy-ui-table-cell-border-width: 1px;
  --fuzzy-ui-table-cell-focus-color: #00f;
  --fuzzy-ui-table-cell-min-width: 0;
  --fuzzy-ui-table-cell-max-width: auto;
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
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr > td > :is(input, label) {
  all: unset;
  /* padding: var(--fuzzy-ui-table-cell-padding); */
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  height: var(--fuzzy-ui-table-cell-height);
  line-height: 1;
}

.fuzzy-ui-table > .table-scroll > table tr > :is(td, th) > label.fuzzy-ui-table-cell-checkbox > input {
  margin: auto;
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr > td > label:focus-within {
  outline: 2px ridge var(--fuzzy-ui-table-cell-focus-color);
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr > td > label:not(.fuzzy-ui-table-cell-checkbox) {
  display: flex;
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr > td > label:not(.fuzzy-ui-table-cell-checkbox) > span {
  flex-shrink: 0;
}

.fuzzy-ui-table
  > .table-scroll
  > table
  > tbody
  > tr
  > td
  > label:not(.fuzzy-ui-table-cell-checkbox)
  > span.fuzzy-ui-table-cell-prepend {
  padding: var(--fuzzy-ui-table-cell-padding);
  padding-right: 0;
}

.fuzzy-ui-table
  > .table-scroll
  > table
  > tbody
  > tr
  > td
  > label:not(.fuzzy-ui-table-cell-checkbox)
  > span.fuzzy-ui-table-cell-append {
  padding: var(--fuzzy-ui-table-cell-padding);
  padding-left: 0;
  order: 2;
}

.fuzzy-ui-table
  > .table-scroll
  > table
  > tbody
  > tr
  > td
  > label:not(.fuzzy-ui-table-cell-checkbox)
  > :is(input, select) {
  flex-grow: 1;
  background: none;
  min-width: 0;
  padding: var(--fuzzy-ui-table-cell-padding);
  width: 100%;
  border: none;
  text-overflow: ellipsis;
}

.fuzzy-ui-table
  > .table-scroll
  > table
  > tbody
  > tr
  > td
  > label:not(.fuzzy-ui-table-cell-checkbox)
  > span.fuzzy-ui-table-cell-prepend
  + :is(input, select) {
  padding-left: 0;
}

.fuzzy-ui-table
  > .table-scroll
  > table
  > tbody
  > tr
  > td
  > label:not(.fuzzy-ui-table-cell-checkbox)
  > span.fuzzy-ui-table-cell-append
  + :is(input, select) {
  padding-right: 0;
}

.fuzzy-ui-table
  > .table-scroll
  > table
  > tbody
  > tr
  > td
  > label:not(.fuzzy-ui-table-cell-checkbox)
  > :is(input, select):focus {
  outline: none;
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

.fuzzy-ui-table > .table-scroll > table > tbody {
  position: relative;
  contain: content;
}

.fuzzy-ui-table > .table-scroll > table > tbody > tr {
  background-color: var(--fuzzy-ui-table-row-bg);
}

.fuzzy-ui-table:not(.fuzzy-ui-table-show-all) > .table-scroll > table > tbody > tr {
  contain: content;
  position: absolute;
  width: 100%;
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
  border-collapse: separate;
  contain: layout;
  /* height: 1px; */
}

.fuzzy-ui-table > .table-scroll > table > thead {
  position: sticky;
  background: white;
  z-index: 2;
  top: 0;
  contain: content;
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
  background: linear-gradient(90deg, var(--fuzzy-ui-table-shadow-color), transparent);
}

.fuzzy-ui-table > div.shadow-right {
  background: linear-gradient(90deg, transparent, var(--fuzzy-ui-table-shadow-color));
}

.fuzzy-ui-table:not(.fuzzy-ui-table-show-all) tr {
  display: flex;
}

.fuzzy-ui-table tr > :is(td, th) {
  flex: 1 1 0;
  overflow: hidden;
  min-width: var(--fuzzy-ui-table-cell-min-width);
  max-width: var(--fuzzy-ui-table-cell-max-width);
}
</style>
