import { ComputedRef, InjectionKey, Ref, Slots, WritableComputedRef } from 'vue'

export type UpdateFnType = (
  index: number,
  field: any,
  value: any,
  data: Ref<Row[]>,
  dataIndex: number
) => any | Promise<any>
export type Row = Record<string, unknown>
export type Data = Row[]
export type ColConfig = {
  append?: string
  attrs: Record<string, unknown>
  checkbox?: boolean
  class?: string | Array<any> | object
  colAttrs?: (row: any, col: ColConfig) => Record<string, unknown> | undefined
  editable?: boolean | ((row: any) => boolean)
  filterable?: boolean
  fixed?: string | boolean
  format: (value: any) => unknown
  getter: (row: any, col: ColConfig) => unknown
  getterOnEdit?: boolean
  hasCustomSetter: boolean
  header: string
  hidden?: boolean
  key: string
  options?: Array<{ label: string; value: any }>
  order: number
  prepend?: string
  prop: string
  setter: (row: any, value: unknown) => void
  slots: Slots
  sortDirection?: 'asc' | 'desc'
  sortable?: boolean | ((rowA: any, rowB: any, col: ColConfig) => number)
  width?: string | number
}

export const tableProvideKey = Symbol('fuzzy-ui-table') as InjectionKey<{
  allSelected: WritableComputedRef<boolean | null>
  columns: ComputedRef<Map<string, ColConfig>>
  data: Ref<Row[]>
  isCheckedRow: (row: Row) => boolean
  maxOrderNum: Ref<number>
  registerCol: (colKey: string, config: ColConfig) => void
  setActiveCell: (x: number, direction: [dx: number, dy: number], row: Row) => void
  setCheckedRow: (row: Row, checked: boolean) => void
  setSort: (colKey: string, direction: 'asc' | 'desc' | undefined) => void
  unregisterCol: (colKey: string) => void
  updateField: (row: Record<string, unknown>, col: ColConfig, value: unknown) => Promise<void>
}>
