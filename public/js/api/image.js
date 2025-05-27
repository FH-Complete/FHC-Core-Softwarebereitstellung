export default {
	searchImage(query){
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Image/getImageSuggestions',
			params: {query: encodeURIComponent(query)}
		}
	},
	getImage(softwareimage_id) {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Image/getImage',
			params: {softwareimage_id: softwareimage_id}
		}
	},
	getImagesBySoftware(software_id) {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Image/getImagesBySoftware',
			params: {software_id: software_id}
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