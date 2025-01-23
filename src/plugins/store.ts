import { App } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import crypto from "@/plugins/crypto"

export const pinia = createPinia()
export const painaInstall = (app: App) => {
  pinia.use(createPersistedState({
		storage: localStorage,
		serializer: {
			serialize: (state) => {
				return JSON.stringify({
					boss: crypto.encryption(state.boss),
					player: crypto.encryption(state.player),
				})
			},
			deserialize: (value) => {
				const state = JSON.parse(value)
				return {
					boss: crypto.decryption(state.boss),
					player: crypto.decryption(state.player),
				}
			},
		},
	}))
  app.use(pinia)
}
