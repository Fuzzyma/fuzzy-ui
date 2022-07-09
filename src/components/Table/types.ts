import { ComputedRef, InjectionKey, Ref, Slots, WritableComputedRef } from 'vue'

export type UpdateFnType = (index: number, field: string, value: unknown) => any | Promise<any>
export type Row = Record<string, unknown>
export type Data = Row[]
export type ColConfig = {
  append?: string
  attrs: Record<string, unknown>
  checkbox?: boolean
  editable?: boolean | ((row: Row) => boolean)
  filterable?: boolean
  fixed?: string | boolean
  getter: (row: Row, col?: ColConfig) => unknown
  getterOnEdit?: boolean
  hasCustomSetter: boolean
  header: string
  hidden?: boolean
  key: string
  options?: Array<{ label: string; value: any }>
  order: number
  prepend?: string
  prop: string
  setter: (row: Row, value: unknown) => void
  slots: Slots
  sortDirection?: 'asc' | 'desc'
  sortable?: boolean
  width?: string | number
}

export const tableProvideKey = Symbol('fuzzy-ui-table') as InjectionKey<{
  allSelected: WritableComputedRef<boolean | null>
  columns: ComputedRef<Map<string, ColConfig>>
  data: Ref<Row[]>
  isCheckedRow: (row: Row) => boolean
  maxOrderNum: Ref<number>
  registerCol: (colKey: string, config: ColConfig) => void
  setActiveCell: (rowIndex: number, colIndex: number, direction: string) => void
  setCheckedRow: (row: Row, checked: boolean) => void
  setSort: (colKey: string, direction: 'asc' | 'desc' | undefined) => void
  unregisterCol: (colKey: string) => void
  updateField: (row: Record<string, unknown>, col: ColConfig, value: unknown) => Promise<void>
}>
