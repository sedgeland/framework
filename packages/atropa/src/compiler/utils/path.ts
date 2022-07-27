import glob from 'fast-glob'
import { extname, join, resolve } from 'pathe'

export function replaceExt(path: string, newExt: string | undefined): string {
	if (!newExt) return path
	return path.replace(extname(path), newExt)
}

export function scanForPaths(options: {
	paths: string[]
	ignorePaths?: string[]
}): {
	modules: string[]
	scripts: string[]
	assets: string[]
} {
	const addPatternToPaths = (pattern: string): string[] => {
		return options.paths.map((path) => join(path, pattern))
	}

	const behaviorPack = atropa.config.packs.behaviorPack
	const componentsGlob = `${behaviorPack}/components/**/*.ts`
	const scriptsGlob = `${behaviorPack}/scripts/**/*.ts`

	const modules = glob.sync(addPatternToPaths('**/*.ts'), {
		ignore: [componentsGlob, scriptsGlob, ...(options.ignorePaths || [])]
	})
	const scripts = glob.sync(scriptsGlob)
	const assets = glob.sync(addPatternToPaths('**/*'), {
		ignore: ['**/*.ts', ...(options.ignorePaths || [])]
	})

	return { modules, assets, scripts }
}

export function resolveToTargetPath(path: string): string {
	if (atropa.isComMojang) {
		const pathToBP = makePathAbsolute(atropa.config.packs.behaviorPack)
		const pathToRP = makePathAbsolute(atropa.config.packs.resourcePack)
		const isBP = path.includes(pathToBP)
		const isRP = path.includes(pathToRP)

		if (isBP) return path.replace(pathToBP, getComMojangPathByPack('BP'))
		if (isRP) return path.replace(pathToRP, getComMojangPathByPack('RP'))
	}

	return resolve(atropa.target.path, path)
}

export function getComMojangPathByPack(packType: 'BP' | 'RP'): string {
	return join(
		atropa.target.path,
		`development_${packType === 'BP' ? 'behavior' : 'resource'}_packs`,
		`${atropa.config.name} ${packType}`
	)
}

export function isModule(path: string): boolean {
	return extname(path) === '.ts'
}

function makePathAbsolute(path: string): string {
	return path.replace(/^\.\//, '')
}
