/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-refresh'],
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.html', 'vite.config.ts'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // Prohibición explícita de `any` en producción (la spec lo exige).
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
    ],
    // La UI nunca debe tocar el almacenamiento directamente: sólo la capa
    // `src/data/repositories/localStorage/` tiene permiso (ver overrides).
    'no-restricted-globals': [
      'error',
      {
        name: 'localStorage',
        message: 'Usa la capa de repositorios (src/data), no localStorage directo.',
      },
    ],
  },
  overrides: [
    {
      // Única excepción: la implementación concreta del repositorio.
      files: ['src/data/repositories/localStorage/**/*.ts', 'src/test/**/*.ts'],
      rules: { 'no-restricted-globals': 'off' },
    },
    {
      // La biblioteca de componentes exporta también variantes y hooks junto a
      // los componentes; Fast Refresh no aplica a estos módulos.
      files: ['src/components/ui/**/*.tsx'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
    {
      // Las pruebas sí necesitan limpiar el almacenamiento entre casos.
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-restricted-globals': 'off',
      },
    },
  ],
};
