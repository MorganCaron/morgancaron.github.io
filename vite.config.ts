import { resolve } from 'path'
import { defineConfig } from 'vite'
import rawPlugin from 'vite-raw-plugin'

export default defineConfig({
	plugins: [
		rawPlugin({
			fileRegex: /\.html\\?raw$/
		})
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		}
	}
})
