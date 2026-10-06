import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
  // src/engine, src/shared y engine-golden.json son una copia generada desde el backend: se vigilan con engine:check, no con lint
  { ignores: ['node_modules/**', 'dist/**', 'referencia/**', 'src/engine/**', 'src/shared/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'], sourceType: 'module' } }
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'vue/multi-word-component-names': 'off', // PageHead, ModalDialog… ya tienen varias palabras; vistas como «Equipo» no
      'no-console': ['error', { allow: ['error'] }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }]
    }
  },
  // Los scripts de línea de comandos sí imprimen; la declaración estándar de componentes .vue usa {} a propósito
  { files: ['scripts/**'], rules: { 'no-console': 'off' } },
  { files: ['src/env.d.ts'], rules: { '@typescript-eslint/no-empty-object-type': 'off' } }
);
