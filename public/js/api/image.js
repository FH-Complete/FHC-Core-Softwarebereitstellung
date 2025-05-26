export default {
	deleteImage(softwareimage_id) {
		return {
			method: 'post',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Image/deleteImage',
			params: {softwareimage_id: softwareimage_id}
		}
	}
}