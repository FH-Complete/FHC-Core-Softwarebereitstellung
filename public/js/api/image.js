export default {
	getImage(softwareimage_id) {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Image/getImage',
			params: {softwareimage_id: softwareimage_id}
		}
	},
	deleteImage(softwareimage_id) {
		return {
			method: 'post',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Image/deleteImage',
			params: {softwareimage_id: softwareimage_id}
		}
	}
}