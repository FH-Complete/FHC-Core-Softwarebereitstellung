export default {
	Studienjahr: {
		getAll(studienjahr_kurzbz){
			return {
				method: 'get',
				url: 'api/frontend/v1/organisation/Studienjahr/getAll',
				params: {studienjahr_kurzbz: studienjahr_kurzbz}
			}
		},
		getNext(){
			return {
				method: 'get',
				url: 'api/frontend/v1/organisation/Studienjahr/getNext'
			}
		},
	}
}