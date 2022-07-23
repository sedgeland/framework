import type { Description } from '../common/template'

type BlockDescription<WithProps extends boolean> = WithProps extends true
	? Description & {
			/**
			 * ## Properties
			 * Defines block properties and their possible values.
			 */
			properties?: {
				[key: `${string}:${string}`]: string[] | boolean[] | number[]
			}
	  }
	: Description

interface BlockDescriptionFunction<WithProps extends boolean> {
	/**
	 * # Description
	 * The description sets required block information.
	 */
	description: (template: BlockDescription<WithProps>) => void
}

interface BlockPermutation<Components extends Record<string, any>> {
	/**
	 * ## Condition
	 * A MoLang condition.
	 */
	condition?: string
	/**
	 * ## Components
	 * Components to add when the condition evaluates to `true`.
	 */
	components?: Components
}

interface BlockPermutationsFunction<Components extends Record<string, any>> {
	/**
	 * # Permutations
	 * List of block permutations based on MoLang queries.
	 */
	permutations: (template: BlockPermutation<Components>[]) => void
}

interface BlockComponentsFunction<Components extends Record<string, any>> {
	/**
	 * # Components
	 * Components are used to describe the block's attributes and behavior.
	 */
	components: (template: Components) => void
}

interface BlockEventsFunction<Events extends Record<string, any>> {
	/**
	 * # Events
	 * The events function defines the events that can be triggered by this block.
	 */
	events: (template: Record<string, Events>) => void
}

export type {
	BlockDescriptionFunction,
	BlockPermutationsFunction,
	BlockComponentsFunction,
	BlockEventsFunction
}