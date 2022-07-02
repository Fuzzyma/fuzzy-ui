<template>
  <div v-if="modelValue" class="modal">Modal here</div>
</template>

<script setup lang="ts">
defineProps({
  modelValue: Boolean,
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 70vh;
  background: #eee;
  border: 1px solid black;
  transition: opacity 0.25s;
}
</style>
