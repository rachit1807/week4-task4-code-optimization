import js from '@eslint/js';
import globals from 'globals';
export default [{ ignores: ['node_modules/**', 'work/**', 'test-results/**'] }, js.configs.recommended, { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node, ...globals.browser, ...globals.worker } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], 'eqeqeq': 'error', 'prefer-const': 'error', 'no-var': 'error' } }];
