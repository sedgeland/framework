import fse from 'fs-extra'
import { cyan, magenta, blackBright } from 'colorette'
import { debounce } from '@antfu/utils'
import { watch as chokidarWatch } from 'chokidar'
import { normalize, resolve, extname } from 'pathe'
import { logger } from '../logger'
import { loadModule } from '../loader'
import { changeExt, getPath, scanPaths } from './utils'

export async function build(silent = false): Promise<void> {
	const start = Date.now()

	const { modules, assets } = scanPaths({
		paths: [
			global.config.packs.behaviorPack,
			global.config.packs.resourcePack
		]
	})

	const results = await Promise.allSettled([
		...modules.map(async (path) => {
			const content = await loadModule(path)
			fse.outputJSONSync(getPath(changeExt(path, '.json')), content, {
				spaces: '\t'
			})
		}),
		...assets.map((path) => {
			fse.copySync(path, getPath(path))
		})
	])

	if (silent) return

	const successResults = results.filter(
		(result) => result.status === 'fulfilled'
	)
	logger.success(
		`Compiled ${successResults.length} files in ${Date.now() - start} ms`
	)
}

export async function watch(): Promise<void> {
	await build(true)

	let filesQueue: {
		updated?: string[]
		removed?: string[]
	} = { updated: [], removed: [] }

	const logReload = () => {
		logger.info(
			'Changes in',
			cyan('components'),
			'folder were detected. Reloading...'
		)
	}
	const logQueue = (queue: string[], level: 'Updated' | 'Removed'): void => {
		if (queue.length === 0) return

		logger.info(
			level === 'Updated' ? cyan(level) : magenta(level),
			queue
				.map((path) => {
					return blackBright(`\n- ${path}`)
				})
				.join('')
				.toString()
		)
	}

	const reload = debounce(200, () => {
		console.clear()

		filesQueue.updated?.map(async (path) => {
			// Reload if the file is in the components folder
			if (path.includes('/components/')) {
				logReload()
				return await build(true)
			}

			// Guard for whether the file is a module or an asset
			if (extname(path) === '.ts') {
				const content = await loadModule(path, false)
				fse.outputJSONSync(getPath(changeExt(path, '.json')), content, {
					spaces: '\t'
				})
			} else {
				fse.copySync(path, getPath(path))
			}
		})

		filesQueue.removed?.map(async (path) => {
			// Reload if the file is in the components folder
			if (path.includes('/components/')) {
				logReload()
				return await build(true)
			}

			await fse.remove(
				resolve(
					global.target.path,
					// Guard to ensure that TS files compiled to JSON will be removed
					extname(path) === '.ts'
						? changeExt(getPath(path), '.json')
						: getPath(path)
				)
			)
		})

		logQueue(filesQueue.updated ?? [], 'Updated')
		logQueue(filesQueue.removed ?? [], 'Removed')

		filesQueue = { updated: [], removed: [] }
	})

	const watcher = chokidarWatch(global.config.packs.behaviorPack, {
		ignoreInitial: true
	})

	watcher.on('all', (event, path) => {
		switch (event) {
			case 'add':
			case 'change':
				if (filesQueue.updated?.includes(path)) break
				filesQueue.updated?.push(normalize(path))
				break

			case 'unlink':
				if (filesQueue.removed?.includes(path)) break
				filesQueue.removed?.push(normalize(path))
		}

		reload()
	})
}