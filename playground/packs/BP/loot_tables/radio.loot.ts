import { defineLootTable } from 'volars'

export default defineLootTable(({ namespace, pools }) => {
	pools([
		{
			rolls: 1,
			entries: {
				type: 'item',
				name: `${namespace}:table`,
				weight: 1
			}
		}
	])
})