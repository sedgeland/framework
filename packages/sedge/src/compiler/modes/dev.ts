import { debounce } from '@antfu/utils'
import { watch } from 'chokidar'
import { blackBright, cyan, green, magenta } from 'colorette'
import { randomUUID } from 'node:crypto'
import { normalize } from 'pathe'
import WebSocket from 'ws'
import { logger } from '../../logger'
import { copyFileToTarget, removeFileFromTarget } from '../fs'
import { compileModule, compileScripts } from '../module'
import { isModule } from '../path'
import { build } from './build'

export async function dev(options?: {
	enableWebSocket?: boolean
}): Promise<void> {
	const { enableWebSocket = false } = options || {}

	await build()

	const updatedFiles = new Set<string>()
	const removedFiles = new Set<string>()

	let wsServer: WebSocket.Server | undefined

	if (enableWebSocket) {
		const port = 1570

		wsServer = new WebSocket.Server({ port })

		logger.success(`WebSocket server started`)
		logger.info(`Run ${cyan(`/connect localhost:${port}`)} in Minecraft`)
	}

	const reload = debounce(200, async () => {
		console.clear()

		const scripts = await compileScripts({
			incremental: true
		})

		updatedFiles.forEach(async (path) => {
			if (path.includes('components')) {
				clearSets(updatedFiles, removedFiles)
				forceReload('components')
				return
			}
			if (path.includes('collections')) {
				clearSets(updatedFiles, removedFiles)
				forceReload('collections')
				return
			}
			if (path.includes('scripts')) {
				await scripts?.rebuild!()
				return
			}

			if (isModule(path)) {
				await compileModule(path, { enableHMR: true })
			} else {
				copyFileToTarget(path)
			}
		})
		removedFiles.forEach(async (path) => {
			if (path.includes('components')) {
				clearSets(updatedFiles, removedFiles)
				forceReload('components')
				return
			}
			if (path.includes('collections')) {
				clearSets(updatedFiles, removedFiles)
				forceReload('collections')
				return
			}
			if (path.includes('scripts')) {
				await scripts?.rebuild!()
				return
			}

			removeFileFromTarget(path)
		})
		if (wsServer) {
			wsServer.clients.forEach(async (ws) => {
				await runCommand('reload', ws)
				await runCommand(
					'tellraw @s {"rawtext": [{"text": "§d[Sedge]§r Reload complete!"}]}',
					ws
				)
			})
		}

		logChanges(Array.from(updatedFiles), 'Updated', 'cyan')
		logChanges(Array.from(removedFiles), 'Removed', 'magenta')
		clearSets(updatedFiles, removedFiles)
	})

	const watcher = watch(
		[sedge.config.packs.behaviorPack, sedge.config.packs.resourcePack],
		{ ignoreInitial: true }
	)

	watcher.on('all', (event, path) => {
		switch (event) {
			case 'add':
			case 'change':
				if (updatedFiles.has(path)) break
				updatedFiles.add(normalize(path))
				break

			case 'unlink':
				if (removedFiles.has(path)) break
				removedFiles.add(normalize(path))
		}
		reload()
	})
}

function runCommand(command: string, ws: WebSocket) {
	const requestId = randomUUID()
	const data = {
		header: {
			version: 1,
			requestId,
			messageType: 'commandRequest',
			messagePurpose: 'commandRequest'
		},
		body: { commandLine: command }
	}
	ws.send(JSON.stringify(data))

	return new Promise<{
		body: Record<string, any>
	}>((resolve) => {
		ws.on('message', (event) => {
			const response = JSON.parse(event.toString())
			if (response.header?.requestId === requestId) {
				resolve(response.body)
			}
		})
	})
}

async function forceReload(dir: string): Promise<void> {
	logger.info(`Changes in ${green(dir)} directory, reloading...`)
	await build({ enableHMR: true })
	logger.info(`Reload complete`)
}

function clearSets(...sets: Set<string>[]): void {
	sets.forEach((set) => set.clear())
}

function logChanges(
	paths: string[],
	level: string,
	color: 'cyan' | 'magenta'
): void {
	if (paths.length === 0) return

	logger.success(
		color === 'cyan' ? cyan(level) : magenta(level),
		paths
			.map((path) => {
				return blackBright(`\n- ${path}`)
			})
			.join('')
			.toString()
	)
}