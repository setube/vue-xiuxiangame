import assert from 'node:assert/strict'
import test from 'node:test'
import { computed, reactive, ref } from 'vue'
import { loadView } from './helpers/load-view.js'

const createClock = () => {
  let now = 0
  let nextId = 0
  const intervals = new Map()

  return {
    intervals,
    setInterval(callback, delay) {
      assert.equal(typeof callback, 'function', 'Interval callbacks must be plain functions, not .value')
      const id = ++nextId
      intervals.set(id, { callback, delay, nextAt: now + delay })
      return id
    },
    clearInterval(id) {
      intervals.delete(id)
    },
    tick(milliseconds) {
      const until = now + milliseconds
      while (true) {
        const next = [...intervals.entries()]
          .filter(([, interval]) => interval.nextAt <= until)
          .sort((left, right) => left[1].nextAt - right[1].nextAt)[0]
        if (!next) break
        const [, interval] = next
        now = interval.nextAt
        interval.nextAt += interval.delay
        interval.callback()
      }
      now = until
    }
  }
}

const createStore = () =>
  reactive({
    player: {
      name: '玩家',
      health: 100,
      maxHealth: 100,
      level: 1,
      maxCultivation: 1000,
      cultivation: 25,
      props: { money: 17 },
      jishaNum: 0,
      highestTowerFloor: 6,
      rewardedTowerFloors: [],
      inventory: [],
      backpackCapacity: 50
    }
  })

const createTower = async (store = createStore()) => {
  const clock = createClock()
  const mounted = []
  const unmounted = []
  const random = Object.create(Math)
  random.random = () => 0.5
  const component = await loadView('src/views/endlessPage.vue', {
    imports: {
      vue: {
        ref,
        computed,
        watch() {},
        onMounted: callback => mounted.push(callback),
        onUnmounted: callback => unmounted.push(callback)
      },
      'vue-router': { useRouter: () => ({ push() {} }) },
      'element-plus': { ElMessageBox: {} },
      '@/components/tag.vue': { default: {} },
      '@/plugins/boss': { default: {} },
      '@/plugins/equip': { default: {} },
      '@/plugins/combat': { default: {} },
      '@/plugins/monster': {
        default: {
          monster_Health: () => 100,
          monster_Names: () => '守护者',
          monster_Criticalhitrate: () => 0,
          monster_Attack: () => 10,
          monster_Defense: () => 10
        }
      },
      '@/plugins/achievementChecker': { checkAchievements: () => [] },
      '@/plugins/store': { useMainStore: () => store },
      '@/plugins/game': {
        smoothScrollToBottom() {},
        formatNumberToChineseUnit: String,
        genre: {},
        levels: {},
        gameNotifys() {}
      }
    },
    globals: {
      Math: random,
      setInterval: clock.setInterval,
      clearInterval: clock.clearInterval
    }
  })
  const tower = component.setup({}, { expose() {} })
  mounted.forEach(callback => callback())
  return {
    tower,
    store,
    clock,
    unmount: () => unmounted.forEach(callback => callback())
  }
}

test('#100: sweeping schedules callable timers at one and thirty seconds', async () => {
  const { tower, clock, store } = await createTower()
  tower.toggleSweep()

  const intervals = [...clock.intervals.values()]
  assert.equal(intervals.length, 2)
  assert.equal(intervals[0].callback, tower.sweep)
  assert.equal(intervals[0].delay, 1000)
  assert.equal(intervals[1].callback, tower.sweepFight)
  assert.equal(intervals[1].delay, 30000)

  clock.tick(29999)
  assert.equal(tower.sweepTime.value, 29)
  assert.equal(store.player.cultivation, 25)
  assert.equal(tower.sweepResults.value.expGain, 0)

  clock.tick(1)
  assert.equal(tower.sweepTime.value, 30)
  assert.equal(store.player.cultivation, 75)
  assert.equal(tower.sweepResults.value.expGain, 50)
})

test('#101: sweep rewards reach the shared player and persist across sessions', async () => {
  const { tower, store, clock, unmount } = await createTower()
  assert.equal(tower.player.value, store.player)
  tower.toggleSweep()
  clock.tick(60000)

  assert.equal(store.player.cultivation, 125)
  assert.equal(store.player.props.money, 117)
  assert.equal(store.player.jishaNum, 2)
  assert.equal(tower.sweepResults.value.expGain, 100)
  assert.equal(tower.sweepResults.value.moneyGain, 100)

  tower.toggleSweep()
  clock.tick(60000)
  assert.equal(store.player.cultivation, 125)
  assert.equal(store.player.props.money, 117)

  tower.toggleSweep()
  assert.equal(tower.sweepResults.value.expGain, 0)
  assert.equal(store.player.cultivation, 125)
  clock.tick(30000)
  assert.equal(tower.sweepResults.value.expGain, 50)
  assert.equal(store.player.cultivation, 175)
  assert.equal(store.player.props.money, 167)
  unmount()

  const reentered = await createTower(store)
  assert.equal(reentered.tower.player.value.cultivation, 175)
  assert.equal(reentered.tower.player.value.props.money, 167)
  assert.equal(reentered.tower.sweepResults.value.expGain, 0)
  reentered.unmount()
})

test('stopping or leaving the tower clears sweep timers and prevents later rewards', async () => {
  const { tower, clock, store, unmount } = await createTower()
  tower.toggleSweep()
  clock.tick(30000)
  tower.toggleSweep()

  assert.equal(tower.isSweeping.value, false)
  assert.equal(tower.sweepInterval.value, null)
  assert.equal(tower.sweepFightInterval.value, null)
  assert.equal(clock.intervals.size, 0)
  clock.tick(60000)
  assert.equal(tower.sweepTime.value, 30)
  assert.equal(store.player.cultivation, 75)

  tower.toggleSweep()
  clock.tick(1000)
  unmount()
  assert.equal(clock.intervals.size, 0)
  clock.tick(60000)
  assert.equal(tower.sweepTime.value, 1)
  assert.equal(store.player.cultivation, 75)
})
