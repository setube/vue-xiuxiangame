import App from "./App.vue"
import { createApp } from "vue"
import "element-plus/dist/index.css"
import "normalize.css/normalize.css"
import "./style.css"
import router from "@/plugins/router"
import { painaInstall } from "@/plugins/store"
import { useMainStore } from "@/store"
import * as ElementPlusIconsVue from "@element-plus/icons-vue"
import ElementPlus from "element-plus"
import {
	formatNumberToChineseUnit,
	getLevelNames,
	notify,
	smoothScrollToBottom,
} from "@/utils"
import {
	dropdownTypeObject,
	genre,
	levels,
	maxLv,
	propItemNames,
} from "@/constant/base"

const app = createApp(App)

// store
painaInstall(app)
const store = useMainStore()
app.config.globalProperties.$store = store

app.config.globalProperties.$isAPP =
	location.host == "appassets.androidplatform.net"

// 常用方法及常量
app.config.globalProperties.$maxLv = maxLv
app.config.globalProperties.$dropdownTypeObject = dropdownTypeObject
app.config.globalProperties.$dropdownType = Object.entries(
	dropdownTypeObject
).map(([type, name]) => ({ type, name }))
app.config.globalProperties.$genre = genre
app.config.globalProperties.$levels = levels
app.config.globalProperties.$propItemNames = propItemNames
app.config.globalProperties.$formatNumberToChineseUnit =
	formatNumberToChineseUnit
app.config.globalProperties.$smoothScrollToBottom = smoothScrollToBottom
app.config.globalProperties.$levelNames = getLevelNames
app.config.globalProperties.$notifys = notify

// 全局注册icon
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
	app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
app.mount("#app")

