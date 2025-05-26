export default {
	getStatus() {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getStatus'
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
	getLanguageIndex() {
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getLanguageIndex'
		}
	},
}