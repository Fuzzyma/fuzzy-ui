<template>
  <Component
    :is="$attrs.href ? 'a' : is"
    class="fuzzy-ui-button"
    :class="{ squared: squared ?? iconOnly, loading }"
    :type="is === 'button' && !$attrs.href && $attrs.type ? 'button' : $attrs.type"
    @click="handleClick"
  >
    <div class="fuzzy-ui-button__content" :class="{ loading, iconRight, hasSlot: $slots.default }">
      <slot>
        <slot name="icon"><component :is="icon" v-if="icon" /></slot>
        <slot name="label">
          <span v-if="label" class="fuzzy-ui-button__content_label">{{ label }}</span>
        </slot>
      </slot>
    </div>

    <Transition v-if="loading" name="fade">
      <div class="fuzzy-ui-button__loader">
        <slot name="loader" :icon-only="iconOnly">
          <Component :is="loader ?? loaderComponent" />
        </slot>
      </div>
    </Transition>
  </Component>
</template>

<script setup lang="ts">
import { computed, PropType, ref, shallowRef, useSlots, watchEffect, type Component } from 'vue'
import { useLogHooks } from './Table/useLogHooks'

const props = defineProps({
  is: {
    type: [String, Object] as PropType<Component<object, object, any> | string>,
    default: 'button',
  },
  onClick: {
    type: Function as PropType<(ev: MouseEvent) => void | unknown | Promise<void | unknown>>,
  },
  icon: {
    type: [String, Object] as PropType<Component<object, object, any> | string>,
  },
  iconRight: {
    type: Boolean,
  },
  label: {
    type: String,
  },
  loader: {
    type: [String, Object] as PropType<Component<object, object, any> | string>,
  },
  loading: {
    type: Boolean,
    default: undefined,
  },
  squared: {
    type: Boolean,
    default: undefined,
  },
})

const emit = defineEmits(['update:loading'])

if (import.meta.env.DEV) {
  useLogHooks('Button')
}

const slots = useSlots()

const iconOnly = computed(() => {
  return !props.label && !slots.default?.() && !slots.label?.()
})

const loaderComponent = shallowRef<Component<object, object, any>>()

watchEffect(async () => {
  if (props.loader || slots.loader?.()) return
  if (iconOnly.value) {
    loaderComponent.value = (await import('./CircleLoader.vue')).default
  } else {
    loaderComponent.value = (await import('./DotLoader.vue')).default
  }
})

const internalLoading = ref(false)
const loading = computed({
  get() {
    return props.loading ?? internalLoading.value
  },
  set(val: boolean) {
    internalLoading.value = val
    emit('update:loading', val)
  },
})

const handleClick = async (ev: MouseEvent) => {
  if (!props.onClick || loading.value) return
  const result = props.onClick(ev)
  if (result instanceof Promise) {
    loading.value = true
    await result
    loading.value = false
  }
  return result
}
</script>

<style>
:where(:root) {
  --fuzzy-ui-button-padding: 0.15em 0.4em;
  --fuzzy-ui-button-border-radius: 0.125em;
  --fuzzy-ui-button-border-width: 1px;
  --fuzzy-ui-button-border-color: currentColor;
  --fuzzy-ui-button-background-color: white;
  --fuzzy-ui-button-color: currentColor;
  --fuzzy-ui-button-hover-background-color: #f0f0f0;
  --fuzzy-ui-button-hover-color: currentColor;
  --fuzzy-ui-button-active-background-color: #e0e0e0;
  --fuzzy-ui-button-active-color: currentColor;
  --fuzzy-ui-button-disabled-background-color: #f0f0f0;
  --fuzzy-ui-button-disabled-color: currentColor;
  --fuzzy-ui-button-disabled-opacity: 0.5;
  --fuzzy-ui-button-loading-color: currentColor;
  --fuzzy-ui-button-loading-opacity: 0.8;
  --fuzzy-ui-button-icon-size: 1em;
  --fuzzy-ui-button-font-size: 1em;
}

.fuzzy-ui-button {
  display: inline-flex;
  position: relative;
  align-items: center;
  justify-content: center;
  border-style: solid;
  max-width: 100%;
}

.fuzzy-ui-button.loading {
  pointer-events: none;
}

.fuzzy-ui-button.squared {
  aspect-ratio: 1;
}

.fuzzy-ui-button__content {
  text-overflow: ellipsis;
  overflow: hidden;
  /* transition: opacity 0.25s ease-in-out; */
  transition: background-color 0.1s ease-in-out, color 0.1s ease-in-out;
}

.fuzzy-ui-button__content:not(.hasSlot) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25em;
  flex: 1 1 0;
  max-width: 100%;
}

.fuzzy-ui-button__content.iconRight {
  flex-direction: row-reverse;
}

.fuzzy-ui-button__content.loading {
  opacity: 0;
}

.fuzzy-ui-button__content_label {
  text-overflow: ellipsis;
  overflow: hidden;
}

.fuzzy-ui-button__loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125em;
  box-sizing: border-box;
}

.fuzzy-ui-button .fade-enter-active,
.fuzzy-ui-button .fade-leave-active {
  transition: opacity 0.25s;
}
.fuzzy-ui-button .fade-enter,
.fuzzy-ui-button .fade-leave-to {
  opacity: 0;
}

.fuzzy-ui-button {
  border-radius: var(--fuzzy-ui-button-border-radius);
  border-width: var(--fuzzy-ui-button-border-width);
  border-color: var(--fuzzy-ui-button-border-color);
  background-color: var(--fuzzy-ui-button-background-color);
  color: var(--fuzzy-ui-button-color);
  transition: background-color 0.1s ease-in-out, color 0.1s ease-in-out;
  font-size: var(--fuzzy-ui-button-font-size);
  padding: var(--fuzzy-ui-button-padding);
  line-height: 1;
}

.fuzzy-ui-button:focus-visible {
  outline-color: var(--fuzzy-ui-button-color);
}

.fuzzy-ui-button:hover {
  background-color: var(--fuzzy-ui-button-hover-background-color);
}

.fuzzy-ui-button:hover .fuzzy-ui-button__content {
  color: var(--fuzzy-ui-button-hover-color);
}

.fuzzy-ui-button:active {
  background-color: var(--fuzzy-ui-button-active-background-color);
}

.fuzzy-ui-button:active .fuzzy-ui-button__content {
  color: var(--fuzzy-ui-button-active-color);
}

.fuzzy-ui-button.disabled,
.fuzzy-ui-button[disabled] {
  background-color: var(--fuzzy-ui-button-disabled-background-color);
  pointer-events: none;
}

.fuzzy-ui-button.disabled .fuzzy-ui-button__content,
.fuzzy-ui-button[disabled] .fuzzy-ui-button__content {
  color: var(--fuzzy-ui-button-disabled-color);
  opacity: var(--fuzzy-ui-button-disabled-opacity);
}

.fuzzy-ui-button__loader {
  color: var(--fuzzy-ui-button-loading-color);
  opacity: var(--fuzzy-ui-button-loading-opacity);
}
</style>
