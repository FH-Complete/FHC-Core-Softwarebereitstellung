export default {
	deleteLizenzserver(lizenzserver_kurzbz) {
		return {
			method: 'post',
			url: '/extensions/FHC-Core-Softwarebereitstellung/components/Lizenzserver/deleteLizenzserver',
			params: {lizenzserver_kurzbz: lizenzserver_kurzbz}
		}
	}
}