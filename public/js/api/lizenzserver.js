export default {
	searchLizenzserver(query){
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Lizenzserver/getLizenzserverSuggestions',
			params: {query: encodeURIComponent(query)}
		}
	},
	getLizenzserver(lizenzserver_kurzbz){
		return {
			method: 'get',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Lizenzserver/getLizenzserver',
			params: {lizenzserver_kurzbz: lizenzserver_kurzbz}
		}
	},
	deleteLizenzserver(lizenzserver_kurzbz) {
		return {
			method: 'post',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Lizenzserver/deleteLizenzserver',
			params: {lizenzserver_kurzbz: lizenzserver_kurzbz}
		}
	}
}