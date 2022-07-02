<template>
  <Button class="ba" @click="onClick"><template #icon>A</template></Button>
  <Button :squared="false" @click="onClick"><template #icon>A</template></Button>
  <Button rounded @click="onClick">
    <template #icon> <i-carbon-accessibility /> </template>
  </Button>

  <Button label="Hello" style="font-size: 50px" rounded>
    <template #icon><i-heroicons-solid-chat-alt /></template>
  </Button>

  <FilledButton label="bla" @click="onClick">
    <template #icon><i-heroicons-solid-chat-alt /></template>
  </FilledButton>
</template>

<script lang="ts" setup>
const onClick = async (ev: MouseEvent) => {
  const result = await new Promise(resolve => setTimeout(() => resolve(5), 10000))
  console.log(result, ev)
}
</script>
