export const ActionsCmpt = {
	props: {
		softwarestatus: Array
	},
	emits: [
		'setStatus'
	],
	methods: {
		changeStatus(softwarestatus_kurzbz) {
			this.selected = softwarestatus_kurzbz;
			this.$emit("setStatus", softwarestatus_kurzbz);
		}
	},
	data: function() {
		return {
			selected: ''
		}
	},
	template: `
		<div class="dropdown">
			<button class="btn btn-outline-secondary dropdown-toggle" type="button" id="statusDropdown" data-bs-toggle="dropdown" aria-expanded="false">
				{{ selected ? selected : 'Status setzen' }}
			</button>
			 <ul class="dropdown-menu" aria-labelledby="statusDropdown">
				<li v-for="status in softwarestatus" :key="status.softwarestatus_kurzbz">
					<a class="dropdown-item" @click="changeStatus(status.softwarestatus_kurzbz)">{{status.bezeichnung}}</a>
				</li>
			</ul>
		</div>
	`
};
