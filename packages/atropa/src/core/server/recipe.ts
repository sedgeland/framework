import { logger } from '../../logger'
import type { RecipeTemplate } from '../../schema/atropa/server/recipe'

/**
 * # Define Recipe
 *
 * Generates a recipe from the given template.
 * @param fn A callback function with function parameters used to define the recipe.
 * @returns A recipe.
 */
export function defineRecipe(
	fn: (template: RecipeTemplate) => void
): Record<string, any> {
	try {
		let template: Record<string, any> = {}

		fn({
			namespace: global.config.namespace,
			shaped: (_template) => {
				template = { [`minecraft:recipe_shaped`]: _template }
			},
			shapeless: (_template) => {
				template = { [`minecraft:recipe_shapeless`]: _template }
			},
			furnace: (_template) => {
				template = { [`minecraft:recipe_furnace`]: _template }
			},
			brewingContainer: (_template) => {
				template = { [`minecraft:recipe_brewing_container`]: _template }
			},
			brewingMix: (_template) => {
				template = { [`minecraft:recipe_brewing_mix`]: _template }
			},
			materialReduction: (_template) => {
				template = {
					[`minecraft:recipe_material_reduction`]: _template
				}
			}
		})

		return { format_version: '1.12.0', ...template }
	} catch (error) {
		logger.error(`Failed to parse recipe:`, error)
		process.exit(1)
	}
}