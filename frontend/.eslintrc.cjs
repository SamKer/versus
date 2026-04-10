const { resolve } = require('path')

module.exports = {
  parserOptions: {
    extraFileExtensions: ['.vue'],
    parser: require.resolve('@typescript-eslint/parser'),
    project: resolve(__dirname, './tsconfig.json'),
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  env: { browser: true, es2022: true, node: true },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-essential'
  ],
  plugins: ['@typescript-eslint', 'vue'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-debugger': process.env.NODE_ENV !== 'production' ? 'off' : 'error'
  }
}
