export const ActionsCmpt = {
	props: {
		softwarestatus: Array,
		expandHierarchy: Boolean
	},
	emits: [
		'setStatus',
		'hierarchyToggle'
	],
	methods: {
		changeStatus(softwarestatus_kurzbz) {
			this.selected = softwarestatus_kurzbz;
			this.$emit("setStatus", softwarestatus_kurzbz);
		},
		handleHierarchyToggle (event) {
			this.$emit("hierarchyToggle", event.target.checked)
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
		<div class="row">
			<div class="col-12 text-end">
				<div class="form-switch">
					<input class="form-check-input text-end" type="checkbox" id="expandHierarchy" name="expandHierarchy" :checked="expandHierarchy" @input="handleHierarchyToggle">
					&nbsp;
					<label class="form-check-label" for="expandHierarchy">Hierarchie {{ expandHierarchy ? 'aufgeklappt' : 'zugeklappt' }}</label>
				</div>
			</div>
		</div>
	`
};
