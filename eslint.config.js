import js from '@eslint/js';
import angular from 'angular-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'api/**'],
	},
	{
		files: ['**/*.ts'],
		extends: [
			js.configs.recommended,
			...tseslint.configs.recommended,
			...angular.configs.tsRecommended,
		],
		processor: angular.processInlineTemplates,
		rules: {
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
		extends: [
			...angular.configs.templateRecommended,
			...angular.configs.templateAccessibility,
		],
	},
	prettierConfig,
	{
		files: ['**/*.{ts,html,css,scss,json}'],
		plugins: { prettier: prettierPlugin },
		rules: {
			'prettier/prettier': 'error',
		},
	}
);
