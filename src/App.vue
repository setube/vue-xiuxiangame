<template>
	<div class="game-container-wrapper" draggable="true">
		<div :class="['game-container', { dark: player.dark }]">
			<router-view v-slot="{ Component }">
				<keep-alive v-if="$route.meta.keepAlive">
					<component :is="Component" :key="key" />
				</keep-alive>
				<component v-if="!$route.meta.keepAlive" :is="Component" :key="key" />
			</router-view>
			<div class="footer">
				<el-switch size="large" v-model="player.dark">
					<template #active-action>
						<i class="el-icon">
							<svg viewBox="0 0 24 24" class="dark-icon">
								<path
									d="M11.01 3.05C6.51 3.54 3 7.36 3 12a9 9 0 0 0 9 9c4.63 0 8.45-3.5 8.95-8c.09-.79-.78-1.42-1.54-.95A5.403 5.403 0 0 1 11.1 7.5c0-1.06.31-2.06.84-2.89c.45-.67-.04-1.63-.93-1.56z"
									fill="currentColor"
								></path>
							</svg>
						</i>
					</template>
					<template #inactive-action>
						<i class="el-icon">
							<svg viewBox="0 0 24 24" class="light-icon">
								<path
									d="M6.05 4.14l-.39-.39a.993.993 0 0 0-1.4 0l-.01.01a.984.984 0 0 0 0 1.4l.39.39c.39.39 1.01.39 1.4 0l.01-.01a.984.984 0 0 0 0-1.4zM3.01 10.5H1.99c-.55 0-.99.44-.99.99v.01c0 .55.44.99.99.99H3c.56.01 1-.43 1-.98v-.01c0-.56-.44-1-.99-1zm9-9.95H12c-.56 0-1 .44-1 .99v.96c0 .55.44.99.99.99H12c.56.01 1-.43 1-.98v-.97c0-.55-.44-.99-.99-.99zm7.74 3.21c-.39-.39-1.02-.39-1.41-.01l-.39.39a.984.984 0 0 0 0 1.4l.01.01c.39.39 1.02.39 1.4 0l.39-.39a.984.984 0 0 0 0-1.4zm-1.81 15.1l.39.39a.996.996 0 1 0 1.41-1.41l-.39-.39a.993.993 0 0 0-1.4 0c-.4.4-.4 1.02-.01 1.41zM20 11.49v.01c0 .55.44.99.99.99H22c.55 0 .99-.44.99-.99v-.01c0-.55-.44-.99-.99-.99h-1.01c-.55 0-.99.44-.99.99zM12 5.5c-3.31 0-6 2.69-6 6s2.69 6 6 6s6-2.69 6-6s-2.69-6-6-6zm-.01 16.95H12c.55 0 .99-.44.99-.99v-.96c0-.55-.44-.99-.99-.99h-.01c-.55 0-.99.44-.99.99v.96c0 .55.44.99.99.99zm-7.74-3.21c.39.39 1.02.39 1.41 0l.39-.39a.993.993 0 0 0 0-1.4l-.01-.01a.996.996 0 0 0-1.41 0l-.39.39c-.38.4-.38 1.02.01 1.41z"
									fill="currentColor"
								></path>
							</svg>
						</i>
					</template>
				</el-switch>
			</div>
		</div>
		<div class="wm_bg_1" v-if="!player.dark" />
		<div class="wm_bg_2" v-if="!player.dark" />
	</div>
</template>

<script>
export default {
	data() {
		return {
			timer: null,
			player: {},
		}
	},
	watch: {
		"player.dark"(val) {
			document.querySelector("html").classList = val ? "dark" : ""
		},
	},
	computed: {
		key() {
			return this.$route.path
		},
	},
	mounted() {
		// 玩家数据
		this.player = this.$store.player
		setInterval(() => {
			// 每分钟增加1岁
			this.player.age += 1
			// 每分钟更新一次玩家最后在线时间
			this.player.time = new Date().getTime()
		}, 60000)
		// 如果有脚本的话, 执行脚本内容
		if (this.player.script) new Function(this.player.script)()
	},
}
</script>

