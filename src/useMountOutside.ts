/* eslint-disable no-unused-vars */
import {
  App,
  devtools,
  h,
  Plugin,
  render,
  version,
  ComponentInternalInstance,
  inject,
  InjectionKey,
  Slot,
  Slots,
  VNodeChild,
} from 'vue'

type PluginOptions = {
  container?: HTMLElement
}

export type ComponentFactory = <T extends new (...args: any) => any>(
  component: T,
  props?: Record<string, unknown> | null,
  children?: VNodeChild | Slot | Slots
) => (extraProps?: Record<string, unknown> | null) => InstanceType<T>

type UseMountOutside = <T extends new (...args: any) => any>(
  component: T,
  props?: Record<string, unknown> | null,
  children?: VNodeChild | Slot | Slots
) => {
  component: InstanceType<T>
  unmount: () => void
}

const fuzzyUiUseMountOutside = Symbol('fuzzy-ui-useMountOutside') as InjectionKey<UseMountOutside>

const registerApp = (instance: ComponentInternalInstance, container: HTMLElement) => {
  const sideApp = {
    _instance: instance,
    _container: container,
  }

  ;(container as any).__vue_app__ = sideApp

  devtools?.emit('app:init', sideApp, version)

  return () => devtools?.emit('app:unmount', sideApp)
}

const useMountOutsideFactory = (app: App, { container }: PluginOptions = {}) => {
  if (!container) {
    container = document.createElement('div')
    document.body.appendChild(container)
  }

  const useMountOutside: UseMountOutside = (component, props?, children?) => {
    const sideRoot = h({
      render: () => h(component as any, props, children as any),
    })

    sideRoot.appContext = app._context
    const div = document.createElement('div')
    container!.appendChild(div)
    render(sideRoot, div)

    const unregister = registerApp(sideRoot.component!, div)

    const unmount = () => {
      unregister()
      render(null, div)
      container!.removeChild(div)
    }

    return { component: sideRoot.component?.subTree.component?.exposed, unmount } as ReturnType<UseMountOutside>
  }

  return useMountOutside
}

export const mountOutsidePlugin: Plugin = {
  install: (app, options: PluginOptions) => {
    const useMountOutside = useMountOutsideFactory(app, options)
    app.provide(fuzzyUiUseMountOutside, useMountOutside)
  },
}

export const useMountOutside = () => {
  const useMountOutside = inject(fuzzyUiUseMountOutside)
  if (!useMountOutside) {
    throw new Error('useMountOutside is not provided')
  }
  return useMountOutside
}
