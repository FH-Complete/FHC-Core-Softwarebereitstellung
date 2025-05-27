export default {
	searchOrt(query){
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getOrtSuggestions',
			params: {query: encodeURIComponent(query)}
		}
	},
	getOrte(){
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getOrte'
		}
	},
	getOrteBySoftware(software_id) {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getOrteBySoftware',
			params: {software_id: software_id}
		}
	},
	getOrteByImage(softwareimage_id) {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getOrteByImage',
			params: {softwareimage_id: softwareimage_id}
		}
	},
	getImageort(softwareimageort_id) {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getImageort',
			params: {softwareimageort_id: softwareimageort_id}
		}
	},
	deleteImageort(softwareimageort_id) {
		return {
			method: 'post',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Ort/deleteImageort',
			params: {softwareimageort_id: softwareimageort_id}
		}
	}
}