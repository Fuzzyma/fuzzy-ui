<!-- <script lang="ts">
import { defineComponent, getCurrentInstance, pushScopeId, popScopeId } from 'vue'
import Button from '../Button.vue'

const recursiveScopeId = (vnode, id) => {
  vnode.scopeId = id
  vnode.children?.forEach?.(c => recursiveScopeId(c, id))
  vnode.dynamicChildren?.forEach?.(c => recursiveScopeId(c, id))
}

const changeScopeId = (fn, id) => {
  const vnode = fn()

  recursiveScopeId(vnode, id)
  return vnode
}

export default defineComponent({
  ...Button,
  name: 'WrapperComponent',
  setup(props, ctx) {
    return Button.setup!(props, ctx)
  },
  render(_ctx, _cache, $props, $setup, $data, $options) {
    const instance = getCurrentInstance()
    instance!.attrs.class = 'filled'
    return changeScopeId(() => {
      const vnode = Button.render!(_ctx, _cache, $props, $setup, $data, $options)
      vnode.props[vnode.scopeId] = ''
      return vnode
    }, Button.__scopeId)
  },
})
</script> -->
<script lang="ts">
import { defineComponent } from 'vue'
import Button from '../Button.vue'

export default defineComponent({
  ...Button,
  name: 'WrapperComponent',
  setup(props, ctx) {
    return Button.setup!(props, ctx)
  },
})
</script>

<template>
  <Button v-bind="$props" class="filled">
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </Button>
</template>

<style scoped>
.filled {
  --fuzzy-ui-button-background-color: #0070f3;
  --fuzzy-ui-button-hover-background-color: #0060e9;
  --fuzzy-ui-button-active-background-color: #0050d7;
  --fuzzy-ui-button-disabled-background-color: #66aeff;
  --fuzzy-ui-button-border-color: #7ebaff;
  --fuzzy-ui-button-active-color: rgb(188, 188, 188);
  /* --fuzzy-ui-button-disabled-color: rgb(188, 188, 188); */
  --fuzzy-ui-button-color: #fff;
  /* color: #fff; */
  font-size: 40px;
}
</style>
