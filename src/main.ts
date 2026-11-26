import App from './App.vue'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import router from '@/plugins/router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus, { ElNotification } from 'element-plus'
import { getSaveLoadError } from '@/plugins/store'
import { invariant } from '@/utils/assert'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
const root = document.querySelector<HTMLDivElement>('#app')
invariant(root, 'Application root #app is missing')
app.mount(root)

if (getSaveLoadError()) {
  ElNotification.error({
    title: '本地存档校验失败',
    message: '原始存档已保留，自动保存已暂停。请通过“导入存档”导入有效备份恢复；恢复前的新进度不会保存。',
    duration: 0,
    showClose: true
  })
}
