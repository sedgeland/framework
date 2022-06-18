import consola, { type Consola } from 'consola'
import { type Config, loadVolarsConfig } from '../config'
import type { DeepPartial } from '../types/deepPartial'

export async function createVolars(options: DeepPartial<VolarsInstance>): Promise<VolarsInstance> {
	const config = await loadVolarsConfig()

	const volars: VolarsInstance = {
		config,
		logger: consola.withTag('volars') || options.logger,
		dev: false || options.dev!
	}

	return volars
}

export interface VolarsInstance {
	config: Config
	logger: Consola
	dev: boolean
}