<template>
	<el-popover placement="right" width="280" trigger="hover" class="shadow-xl">
		<template #reference>
			<tag
				class="inventory-item mx-1"
				:key="item.id"
				:type="item.quality"
				:closable="!item.lock"
				@close="inventoryClose(item)"
			>
				<el-icon v-if="item.lock">
					<Lock />
				</el-icon>
				<el-icon v-else>
					<Unlock />
				</el-icon>
				{{ item?.name }}{{ item?.strengthen ? "+" + item?.strengthen : "" }}
			</tag>
		</template>
		<div class="monsterinfo w-full">
			<div class="monsterinfo-box w-full" v-if="inventoryInfo">
				<p>
					<span class="description"
						><span class="w-16 inline-block mr-1">类型: </span
						>{{ $genre[inventoryInfo.type] }}</span
					>
					<span class="flex items-center">
						<span class="icon mx-1" />
						<span class="value w-16 text-right" />
					</span>
				</p>
				<p>
					<span class="description"
						><span class="w-16 inline-block mr-1">炼器: </span
						>{{ inventoryInfo.strengthen || 0 }}</span
					>
					<span c class="flex items-center" lass="flex items-center">
						<span class="icon mx-1">
							<i
								:class="
									calculateDifference(
										inventoryInfo.strengthen,
										player.equipment[inventoryInfo.type]?.strengthen
									).icon
								"
							/>
						</span>
						<span class="value w-16 text-right">{{
							calculateDifference(
								inventoryInfo.strengthen,
								player.equipment[inventoryInfo.type]?.strengthen,
								true
							).num
						}}</span>
					</span>
				</p>
				<p>
					<span class="description"
						><span class="w-16 inline-block mr-1">境界: </span
						>{{ $levelNames(inventoryInfo.level) }}</span
					>
					<span class="flex items-center">
						<span class="icon mx-1">
							<i
								:class="
									calculateDifference(
										inventoryInfo.level,
										player.equipment[inventoryInfo.type]?.level
									).icon
								"
							/>
						</span>
						<span class="value w-16 text-right">
							{{
								inventoryInfo.level >
								parseInt(String(player.equipment[inventoryInfo.type]?.level))
									? $levelNames(inventoryInfo.level)
									: $levelNames(
											player.equipment[inventoryInfo.type]?.level || 0
									  )
							}}
						</span>
					</span>
				</p>
				<p>
					<span class="description"
						><span class="w-16 inline-block mr-1">品质: </span
						>{{ $levels[inventoryInfo.quality] }}</span
					>
					<span class="flex items-center">
						<span class="icon mx-1">
							<i
								:class="
									calculateDifference(
										levelsNum[inventoryInfo.quality],
										levelsNum[player.equipment[inventoryInfo.type].quality]
									).icon
								"
							/>
						</span>
						<span class="value w-16 text-right">
							{{
								Number(
									calculateDifference(
										levelsNum[inventoryInfo.quality],
										levelsNum[player.equipment[inventoryInfo.type]?.quality]
									).num
								) < 0
									? $levels[player.equipment[inventoryInfo.type]?.quality]
									: $levels[inventoryInfo.quality]
							}}
						</span>
					</span>
				</p>
				<p>
					<span class="description"
						><span class="w-16 inline-block mr-1">气血: </span
						>{{ inventoryInfo?.health }}</span
					>
					<span class="flex items-center">
						<span class="icon mx-1">
							<i
								:class="
									calculateDifference(
										inventoryInfo?.health,
										player.equipment[inventoryInfo.type]?.health
									).icon
								"
							/>
						</span>
						<span class="value w-16 text-right">{{
							calculateDifference(
								inventoryInfo?.health,
								player.equipment[inventoryInfo.type]?.health
							).num
						}}</span></span
					>
				</p>
				<p>
					<span class="description"
						><span class="w-16 inline-block mr-1">攻击: </span
						>{{ inventoryInfo?.attack }}</span
					>
					<span class="flex items-center">
						<span class="icon mx-1">
							<i
								:class="
									calculateDifference(
										inventoryInfo?.attack,
										player.equipment[inventoryInfo.type]?.attack
									).icon
								"
							/>
						</span>
						<span class="value w-16 text-right">{{
							calculateDifference(
								inventoryInfo?.attack,
								player.equipment[inventoryInfo.type]?.attack
							).num
						}}</span>
					</span>
				</p>
				<p>
					<span class="description"
						><span class="w-16 inline-block mr-1">防御: </span
						>{{ inventoryInfo?.defense }}</span
					>
					<span class="flex items-center"
						><span class="icon mx-1">
							<i
								:class="
									calculateDifference(
										inventoryInfo?.defense,
										player.equipment[inventoryInfo.type]?.defense
									).icon
								"
							/>
						</span>
						<span class="value w-16 text-right">{{
							calculateDifference(
								inventoryInfo?.defense,
								player.equipment[inventoryInfo.type]?.defense
							).num
						}}</span></span
					>
				</p>
				<p>
					<span class="description"
						><span class="w-16 inline-block mr-1">闪避率:</span
						>{{
							inventoryInfo?.dodge > 0
								? inventoryInfo?.dodge * 100 > 100
									? 100
									: (inventoryInfo?.dodge * 100).toFixed(2)
								: 0
						}}%</span
					>
					<span class="flex items-center">
						<span class="icon mx-1">
							<i
								:class="
									calculateDifference(
										inventoryInfo?.dodge,
										player.equipment[inventoryInfo.type]?.dodge
									).icon
								"
							/>
						</span>
						<span class="value w-16 text-right">{{
							calculateDifference(
								inventoryInfo?.dodge,
								player.equipment[inventoryInfo.type]?.dodge,
								true
							).num
						}}</span>
					</span>
				</p>
				<p>
					<span class="description"
						><span class="w-16 inline-block mr-1">暴击率:</span
						>{{
							inventoryInfo?.critical > 0
								? inventoryInfo?.critical * 100 > 100
									? 100
									: (inventoryInfo?.critical * 100).toFixed(2)
								: 0
						}}%</span
					>
					<span class="flex items-center">
						<span class="icon mx-1">
							<i
								:class="
									calculateDifference(
										inventoryInfo?.critical,
										player.equipment[inventoryInfo.type]?.critical
									).icon
								"
							/>
						</span>
						<span class="value w-16 text-right">{{
							calculateDifference(
								inventoryInfo?.critical,
								player.equipment[inventoryInfo.type]?.critical,
								true
							).num
						}}</span>
					</span>
				</p>
				<p>
					<span class="description"
						><span class="w-16 inline-block mr-1">装备评分:</span
						>{{ inventoryInfo?.score }}</span
					>
					<span class="flex items-center">
						<span class="icon mx-1">
							<i
								:class="
									calculateDifference(
										inventoryInfo?.score,
										player.equipment[inventoryInfo.type]?.score
									).icon
								"
							/>
						</span>
						<span class="value w-16 text-right">{{
							calculateDifference(
								inventoryInfo?.score,
								player.equipment[inventoryInfo.type]?.score
							).num
						}}</span></span
					>
				</p>
			</div>
		</div>
		<div class="flex items-center justify-evenly mt-4" v-if="inventoryInfo">
			<el-button
				plain
				type="text"
				size="small"
				:disabled="inventoryInfo.lock"
				@click="inventoryClose(inventoryInfo)"
			>
				装备分解
			</el-button>
			<el-button
				plain
				type="text"
				size="small"
				@click="inventoryLock(inventoryInfo.id)"
			>
				{{ inventoryInfo.lock ? "装备解锁" : "装备锁定" }}
			</el-button>
			<el-button
				type="text"
				size="small"
				@click="$emit('equipItem', inventoryInfo.id, inventoryInfo.type)"
			>
				立即装备
			</el-button>
		</div>
	</el-popover>
</template>

<script lang="ts" setup>
import { Player, EquipmentItem } from "@/store"
import { PropType } from "vue"
import { computed, getCurrentInstance } from "vue"

const vm = getCurrentInstance()!.proxy!
const props = defineProps({
	item: {
		type: Object as PropType<EquipmentItem>,
		required: true,
	},
	player: {
		type: Object as PropType<Player>,
		required: true,
	},
})
const levelsNum = {
	info: 1,
	pink: 7,
	danger: 6,
	purple: 4,
	primary: 3,
	success: 2,
	warning: 5,
}
const inventoryInfo = computed(() => {
	return props.player?.inventory.find((item) => item.id === props.item.id)
})
function calculateDifference(
	item1: number,
	item2: number,
	isPercent?: boolean
) {
	item1 = item1 || 0
	item2 = item2 || 0
	const isFloat = (num: number) => {
		return Number(num) === num && num % 1 !== 0
	}
	const Float =
		item1 - parseFloat(String(item2)) < -1
			? -1
			: item1 - parseFloat(String(item2)) > 1
			? 1
			: item1 - parseFloat(String(item2))
	const ojb = {
		num: isPercent
			? (Float * 100).toFixed(2) + "%"
			: String(item1 - parseInt(String(item2))),
		icon:
			item1 > item2
				? "success el-icon-caret-top"
				: item1 == item2
				? ""
				: "danger el-icon-caret-bottom",
	}
	ojb.num = ojb.num == "0" ? "" : ojb.num
	return ojb
}
function inventoryClose(item: EquipmentItem) {
	vm.$confirm(
		`你确定要分解<span class="el-tag el-tag--${item.quality}">${
			vm.$levels[item.quality]
		}${item.name}(${vm.$genre[item.type]})</span>吗?`,
		"装备分解通知",
		{
			center: true,
			cancelButtonText: "取消分解",
			confirmButtonText: "确定分解",
			dangerouslyUseHTMLString: true,
		}
	)
		.then(() => {
			const num =
				item.level + Math.floor((item.level * props.player.reincarnation) / 10)
			// 增加炼器石数量
			props.player.props.strengtheningStone += num
			// 删除背包装备
			props.player.inventory = props.player.inventory.filter(
				(obj) => obj.id !== item.id
			)
			// 装备分解通知
			vm.$notifys({
				title: "背包装备售卖提示",
				message: `${item.name}已成功卖出, 你获得了${num}个炼器石`,
			})
		})
		.catch(() => {})
}
function inventoryLock(id: number) {
	let inventoryItem = props.player.inventory.find((item) => item.id === id)
	if (!inventoryItem) return
	inventoryItem.lock = !inventoryItem.lock
	vm.$notifys({
		title: !inventoryItem.lock ? "装备解锁提示" : "装备锁定提示",
		message: !inventoryItem.lock ? "装备解锁成功" : "装备锁定成功",
	})
}
</script>

<style scoped></style>

