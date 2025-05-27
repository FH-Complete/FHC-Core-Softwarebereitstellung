export default {
	searchSoftware(query){
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareSuggestions',
			params: {query: encodeURIComponent(query)}
		}
	},
	searchOe(query){
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getOeSuggestions',
			params: {query: encodeURIComponent(query)}
		}
	},
	getSoftware(software_id) {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftware',
			params: {software_id: software_id}
		}
	},
	getStatus() {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getStatus'
		}
	},
	getLastSoftwarestatus(software_id) {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getLastSoftwarestatus',
			params: {software_id: software_id}
		}
	},
	getSoftwareByOrt(ort_kurzbz) {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareByOrt',
			params: {ort_kurzbz: ort_kurzbz}
		}
	},
	getSoftwareByImage(softwareimage_id) {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareByImage',
			params: {softwareimage_id: softwareimage_id}
		}
	},
	getSoftwareMetadata() {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareMetadata'
		}
	},
	getSoftwarelizenztypen() {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwarelizenztypen'
		}
	},
	getSoftwarelizenzkategorien() {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwarelizenzkategorien'
		}
	},
	changeSoftwarestatus(software_ids, softwarestatus_kurzbz) {
		return {
			method: 'post',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/changeSoftwarestatus',
			params: {
				software_ids: software_ids,
				softwarestatus_kurzbz: softwarestatus_kurzbz
			}
		}
	},
	deleteSoftware(software_id) {
		return {
			method: 'post',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/deleteSoftware',
			params: {
				software_id: software_id,
			}
		}
	},
	getSwLizenzenSumAndPercentageShareByOeAndStudienjahr(software_id, studienjahr_kurzbz) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Software/getSwLizenzenSumAndPercentageShareByOeAndStudienjahr',
			params: {
				software_id: software_id,
				studienjahr_kurzbz: studienjahr_kurzbz
			}
		}
	},
	getLanguageIndex() {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getLanguageIndex'
		}
	},
	getStudienjahre() {
		return {
			method: 'get',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Software/getStudienjahre'
		}
	},

}