export const maxLv = 144;

export const levels: {
    info: '黄阶',
    pink: '仙阶',
    danger: '神阶',
    purple: '天阶',
    primary: '地阶',
    success: '玄阶',
    warning: '帝阶',
} = {
    info: '黄阶',
    pink: '仙阶',
    danger: '神阶',
    purple: '天阶',
    primary: '地阶',
    success: '玄阶',
    warning: '帝阶',
}
export const levelNames = new Map<keyof typeof levels, string>([
    ['info', '黄阶'],
    ['pink', '仙阶'],
    ['danger', '神阶'],
    ['purple', '天阶'],
    ['primary', '地阶'],
    ['success', '玄阶'],
    ['warning', '帝阶'],
]);

export const propItemNames = {
    money: { name: '灵石', desc: '可以通过分解获得装备获得' },
    flying: { name: '传送符', desc: '可以通过赠送礼物给NPC获得' },
    rootBone: { name: '悟性丹', desc: '可以通过击败世界BOSS获得' },
    qingyuan: { name: '情缘', desc: '可以通过赠送礼物给NPC获得' },
    currency: { name: '鸿蒙石', desc: '可以通过击败世界BOSS获得' },
    cultivateDan: { name: '培养丹', desc: '可以通过探索获得' },
    strengtheningStone: { name: '炼器石', desc: '可以通过分解装备获得' }
};
export const genre: {
    sutra: '法器',
    armor: '护甲',
    weapon: '神兵',
    accessory: '灵宝'
} = {
    sutra: '法器',
    armor: '护甲',
    weapon: '神兵',
    accessory: '灵宝'
};
export const dropdownTypeObject = {
    id: '时间',
    level: '境界',
    score: '评分',
    health: '气血',
    attack: '攻击',
    defense: '防御',
    critical: '暴击',
    dodge: '闪避'
};
export const qualityMultiplier = {
	info: 1.2,
	success: 2,
	primary: 3,
	purple: 5,
	warning: 7,
	danger: 10,
	pink: 15,
}
