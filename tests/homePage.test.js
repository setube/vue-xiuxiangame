import assert from 'node:assert/strict'
import test from 'node:test'
import * as vue from 'vue'
import equip from '../src/plugins/equip.js'
import { loadView } from './helpers/load-view.js'

const equipmentTypes = ['weapon', 'armor', 'accessory', 'sutra']

const makeEquipment = (id, type, strengthen = 0) => ({
  id,
  type,
  name: `equipment-${id}`,
  level: 1,
  strengthen,
  dodge: 0,
  attack: 100,
  health: 100,
  critical: 0,
  defense: 100,
  initial: { attack: 100, health: 100, defense: 100 }
})

const createHome = async (equipment, inventory = []) => {
  const player = {
    level: 1,
    reincarnation: 0,
    attack: 110,
    health: 200,
    maxHealth: 200,
    defense: 110,
    critical: 0,
    dodge: 0,
    props: { strengtheningStone: 10000 },
    equipment: Object.fromEntries(equipmentTypes.map(type => [type, {}])),
    inventory
  }
  Object.assign(player.equipment, equipment)
  const notifications = []
  const component = await loadView('src/views/homePage.vue', {
    imports: {
      vue: { ...vue, watch() {}, onMounted() {} },
      'vue-router': { useRouter: () => ({ push() {} }) },
      'element-plus': { ElMessageBox: { confirm: () => Promise.resolve() } },
      'file-saver': { saveAs() {} },
      '@/components/tag.vue': { default: {} },
      '@/components/equipTooltip.vue': { default: {} },
      '@/plugins/shop': { default: {} },
      '@/plugins/equip': { default: equip },
      '@/plugins/equipAll': { default: {} },
      '@/plugins/achievement': { default: {} },
      '@/plugins/store': { useMainStore: () => ({ player, boss: {} }) },
      '@/plugins/game': { gameNotifys: notification => notifications.push(notification) }
    },
    globals: {
      Math: Object.assign(Object.create(Math), { random: () => 0 }),
      console: { log() {} }
    }
  })
  return { ...component.setup({}, { expose() {} }), notifications }
}

for (const type of equipmentTypes) {
  test(`#92: ${type} keeps its enhancement after previewing and swapping equipment`, async () => {
    const equipped = makeEquipment(1, type)
    const replacement = makeEquipment(2, type)
    const home = await createHome({ [type]: equipped }, [replacement])
    home.getEquipmentInfo(equipped.id, type)
    home.enhance(home.strengthenInfo.value)
    await Promise.resolve()
    await Promise.resolve()
    assert.equal(equipped.strengthen, 1)
    assert.equal(home.player.value.props.strengtheningStone, 9995)
    const enhancedAttributes = { attack: equipped.attack, health: equipped.health, defense: equipped.defense }

    home.getEquipmentInfo(replacement.id, type)
    assert.equal(equipped.strengthen, 1)
    assert.equal(home.strengthenInfo.value.id, replacement.id)
    assert.equal(replacement.strengthen, 0)

    home.equipItem(replacement.id, type)
    const unequipped = home.player.value.inventory.find(item => item.id === equipped.id)
    assert.equal(unequipped.strengthen, 1)
    assert.equal(unequipped.attack, enhancedAttributes.attack)
    assert.equal(unequipped.health, enhancedAttributes.health)
    assert.equal(unequipped.defense, enhancedAttributes.defense)
    assert.equal(home.player.value.equipment[type].strengthen, 0)

    home.equipItem(equipped.id, type)
    assert.equal(home.player.value.equipment[type].strengthen, 1)
    assert.equal(home.player.value.inventory[0].strengthen, 0)
  })
}

test('#92: preview initializes only the selected legacy equipment', async () => {
  const equipped = makeEquipment(1, 'weapon', 5)
  const legacy = makeEquipment(2, 'weapon')
  delete legacy.strengthen
  const home = await createHome({ weapon: equipped }, [legacy])

  home.getEquipmentInfo(legacy.id, legacy.type)

  assert.equal(legacy.strengthen, 0)
  assert.equal(equipped.strengthen, 5)
})

test('#92: inventory previews do not copy enhancement into legacy equipped items', async () => {
  const equipped = makeEquipment(1, 'weapon')
  delete equipped.strengthen
  const inventoryItem = makeEquipment(2, 'weapon', 5)
  const home = await createHome({ weapon: equipped }, [inventoryItem])

  home.getEquipmentInfo(inventoryItem.id, inventoryItem.type)

  assert.equal(Object.hasOwn(equipped, 'strengthen'), false)
  assert.equal(inventoryItem.strengthen, 5)

  home.getEquipmentInfo(equipped.id, equipped.type)
  assert.equal(equipped.strengthen, 0)
})

test('#92: inventory previews leave empty equipment slots empty', async () => {
  const inventoryItem = makeEquipment(2, 'armor', 5)
  const home = await createHome({}, [inventoryItem])

  home.getEquipmentInfo(inventoryItem.id, inventoryItem.type)

  assert.deepEqual(Object.keys(home.player.value.equipment.armor), [])
  assert.equal(home.strengthenInfo.value.strengthen, 5)
})
