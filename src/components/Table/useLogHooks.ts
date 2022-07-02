import { onBeforeUpdate, onMounted, onBeforeUnmount, onUnmounted, onUpdated, ref } from 'vue'

const enabled = false
export const useLogHooks = (key: string, data?: any) => {
  if (enabled) {
    onBeforeUpdate(() => {
      console.log('[onBeforeUpdate]', key, ref(data).value)
    })
    onMounted(() => {
      console.log('[onMounted]', key, ref(data).value)
    })
    onBeforeUnmount(() => {
      console.log('[onBeforeUnmount]', key, ref(data).value)
    })
    onUnmounted(() => {
      console.log('[onUnmounted]', key, ref(data).value)
    })
    onUpdated(() => {
      console.log('[onUpdated]', key, ref(data).value)
    })
    console.log('[Setup]', key, ref(data).value)
  }
}
