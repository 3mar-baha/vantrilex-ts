import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['out/**', 'node_modules/**', 'data/**', 'docs/**']
  },
  ...tseslint.configs.recommended
)
