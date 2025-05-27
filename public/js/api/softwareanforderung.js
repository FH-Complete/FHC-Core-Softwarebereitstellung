export default {
	getOtoboUrl() {
		return {
			method: 'get',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getOtoboUrl'
		}
	},
	getVorrueckStudienjahr(studienjahr_kurzbz) {
		return {
			method: 'get',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getVorrueckStudienjahr',
			params: {studienjahr_kurzbz: studienjahr_kurzbz}
		}
	},
	autocompleteSwSuggestions(query) {
		return {
			method: 'get',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/autocompleteSwSuggestions/',
			params: {query: encodeURIComponent(query)}
		}
	},
	autocompleteLvSuggestionsByStudjahr(query, studienjahr_kurzbz) {
		return {
			method: 'get',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/autocompleteLvSuggestionsByStudjahr/',
			params: {
				query: encodeURIComponent(query),
				studienjahr_kurzbz: studienjahr_kurzbz
			}
		}
	},
	isPlanningDeadlinePast(studienjahr_kurzbz) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/isPlanningDeadlinePast',
			params: {studienjahr_kurzbz: studienjahr_kurzbz}
		}
	},
	updateLizenzanzahl(objectArray) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/updateLizenzanzahl',
			params: objectArray	// NOTE: Do NOT add object literals.
		}
	},
	deleteSwLvsByTpl(software_lv_id, studienjahr_kurzbz) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/deleteSwLvsByTpl',
			params: {
				software_lv_id: software_lv_id,
				studienjahr_kurzbz: studienjahr_kurzbz
			}
		}
	},
	deleteSwLvsByLv(software_lv_id, studienjahr_kurzbz) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/deleteSwLvsByLv',
			params: {
				software_lv_id: software_lv_id,
				studienjahr_kurzbz: studienjahr_kurzbz
			}
		}
	},
	abbestellenSwLvs(software_lv_ids) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/abbestellenSwLvs',
			params: {software_lv_ids: software_lv_ids}
		}
	},
	vorrueckSwLvsByTpl(software_lv_ids, studienjahr_kurzbz) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/vorrueckSwLvsByTpl',
			params: {
				software_lv_ids: software_lv_ids,
				studienjahr_kurzbz: studienjahr_kurzbz
			}
		}
	},
	vorrueckSwLvsByLvs(software_lv_ids, studienjahr_kurzbz) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/vorrueckSwLvsByLvs',
			params: {
				software_lv_ids: software_lv_ids,
				studienjahr_kurzbz: studienjahr_kurzbz
			}
		}
	},
	sendMailSoftwareAbbestellt(software_lv_ids) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/sendMailSoftwareAbbestellt',
			params: {software_lv_ids: software_lv_ids}
		}
	},
	validateVorrueckSwLvsForTpl(software_lv_ids, studienjahr_kurzbz) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/validateVorrueckSwLvsForTpl',
			params: {
				software_lv_ids: software_lv_ids,
				studienjahr_kurzbz: studienjahr_kurzbz
			}
		}
	},
	validateVorrueckSwLvsForLvs(software_lv_ids, studienjahr_kurzbz) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/validateVorrueckSwLvsForLvs',
			params: {
				software_lv_ids: software_lv_ids,
				studienjahr_kurzbz: studienjahr_kurzbz
			}
		}
	},
	checkAndGetExistingSwLvs(formData) {
		return {
			method: 'post',
			url: 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/checkAndGetExistingSwLvs',
			params: formData
		}
	},
}