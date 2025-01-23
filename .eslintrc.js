export default {
  parser: 'vue-eslint-parser',
  env: {
    node: true,
    browser: true
  },
  globals: {
    // 你的全局变量（设置为 false 表示它不允许被重新赋值）
    $store: true,
    $isAPP: true,
    $maxLv: true,
    $dropdownTypeObject: true,
    $dropdownType: true,
    $genre: true,
    $levels: true,
    $propItemNames: false,
    $formatNumberToChineseUnit: true,
    $smoothScrollToBottom: true,
    $levelNames: true,
    $notifys: true
  },
  extends: [
    // add more generic rulesets here, such as:
    'eslint:recommended',
    // 'plugin:vue/vue3-recommended',
    'plugin:vue/recommended', // Use this if you are using Vue.js 2.x.
    'prettier'
  ],
  rules: {
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],

    // vue
    'vue/require-default-prop': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': 'off'
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 13
  }
};
