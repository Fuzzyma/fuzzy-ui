<template>
  <input v-model="value" type="number" @change="saveEmit(($event.target as HTMLInputElement).value)" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const value = computed({
  get: () => String(props.modelValue),
  set: (val: string) => {
    const num = Number(val)
    if (!isNaN(num)) {
      emit('update:modelValue', num)
    }
  },
})

const saveEmit = (value: string) => {
  const num = Number(value)
  if (isNaN(num)) {
    return emit('update:modelValue', 0)
  }
}
</script>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input {
  -moz-appearance: textfield;
}
</style>
