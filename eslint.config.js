import { defineConfig } from 'eslint-define-config';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettier from 'eslint-config-prettier';

export default defineConfig([
	{ ignores: ['dist', 'coverage', 'node_modules'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	prettier,
	{
		files: ['**/*.ts'],
		plugins: {
			'@angular-eslint': angular,
			prettier: prettierPlugin,
		},
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: ['./tsconfig.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			...angular.configs.recommended.rules,
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
		plugins: {
			'@angular-eslint/template': angularTemplate,
			prettier: prettierPlugin,
		},
		rules: {
			...angularTemplate.configs.recommended.rules,
			'prettier/prettier': 'error',
		},
	},
]);
