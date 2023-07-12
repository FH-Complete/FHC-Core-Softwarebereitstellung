export const ActionsCmpt = {
	props: {
		softwarestatus: Array
	},
	emits: [
		'setStatus'
	],
	methods: {
		changeStatus (event) {
			this.$emit("setStatus", this.selected);
		}
	},
	data: function() {
		return {
			selected: ''
		}
	},
	template: `
	<div>
		<select class="form-select" v-model="selected" @change="changeStatus">
		  	<option disabled value="">Status setzen</option>
			<option v-for="status in softwarestatus" :key="status.softwarestatus_kurzbz" :value="status.softwarestatus_kurzbz">
				{{status.bezeichnung}}
			</option>
		</select>
	</div>
	`
};
