// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import tsdoceslint from 'eslint-plugin-tsdoc'

export default tseslint.config({
  files: ['**/*.ts'],
  extends: [eslint.configs.recommended, ...tseslint.configs.strict, ...tseslint.configs.stylistic],
  plugins: {
    tsdoc: tsdoceslint,
  },
  rules: {
    'tsdoc/syntax': 'error',
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
  },
})
