import { ComponentCustomProperties } from "vue"
import { Notify } from "element-plus"
import { propItemNames, dropdownTypeObject } from "@/constant/base"
import { Store } from '@/store'
// Vue 组件类型声明
declare module "*.vue" {
  import { DefineComponent } from "vue"
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Vue 全局属性扩展
declare module "vue" {
  interface ComponentCustomProperties {
    $notifys: (params: NotificationParams) => void
    $confirm: (
      content: string,
      title?: string,
      options?: {
        center?: boolean
        message?: string
        showClose?: boolean
        showCancelButton?: boolean
        confirmButtonText?: string
        cancelButtonText?: string
        closeOnClickModal?: boolean
        closeOnPressEscape?: boolean
        dangerouslyUseHTMLString?: boolean
      }
    ) => Promise<void>
    $genre: {
      sutra: "法器"
      armor: "护甲"
      weapon: "神兵"
      accessory: "灵宝"
    }
    $levels: {
      info: "黄阶"
      pink: "仙阶"
      danger: "神阶"
      purple: "天阶"
      primary: "地阶"
      success: "玄阶"
      warning: "帝阶"
    }
    $levelNames: (level: number) => string
    $formatNumberToChineseUnit: (num: number) => string
    $smoothScrollToBottom: (element: HTMLElement) => void
    $store: Store
    $propItemNames: typeof propItemNames
    $dropdownTypeObject: typeof dropdownTypeObject
    $dropdownType: { type: string; name: string }[]
    $maxLv: number
  }
}
declare global {}
