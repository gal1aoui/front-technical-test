import { defineConfig } from 'eslint-define-config';
import angularEslint from 'angular-eslint';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettier from 'eslint-config-prettier';

export default defineConfig([
	{ ignores: ['dist', 'coverage', 'node_modules', 'api'] },
	js.configs.recommended,
	...tseslint.configs.recommended.map(config => ({
		...config,
		files: ['**/*.ts'],
	})),
	...angularEslint.configs.tsRecommended.map(config => ({
		...config,
		files: ['**/*.ts'],
	})),
	...angularEslint.configs.templateRecommended.map(config => ({
		...config,
		files: ['**/*.html'],
	})),
	prettier,
	{
		files: ['**/*.ts'],
		plugins: { prettier: prettierPlugin },
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: ['./tsconfig.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
		processor: angularEslint.processInlineTemplates,
		rules: {
			...tseslint.configs.stylistic.rules,
			'prettier/prettier': ['error', { useTabs: true }],
			'@angular-eslint/directive-selector': [
				'error',
				{ type: 'attribute', prefix: 'ic', style: 'camelCase' },
			],
			'@angular-eslint/component-selector': [
				'error',
				{ type: 'element', prefix: 'ic', style: 'kebab-case' },
			],
		},
	},
	{
		files: ['**/*.html'],
		plugins: { prettier: prettierPlugin },
		rules: {
			'prettier/prettier': 'error',
		},
	},
]);
