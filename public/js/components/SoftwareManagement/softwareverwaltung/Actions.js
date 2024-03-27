export const Actions = {
	props: {
		softwarestatus: Array,
		expandHierarchy: Boolean
	},
	emits: [
		'setStatus',
		'hierarchyViewChanged',
		'hierarchyExpansionChanged',
	],
	data: function() {
		return {
			selected: '',
			hierarchyView: false,
		}
	},
	methods: {
		changeStatus(softwarestatus_kurzbz) {
			this.selected = softwarestatus_kurzbz;
			this.$emit("setStatus", softwarestatus_kurzbz);
		},

		handleHierarchyViewChange (event) {
			this.$emit("hierarchyViewChanged", event.target.checked)
		},
		handleHierarchyExpansion (event) {
			this.$emit("hierarchyExpansionChanged", event.target.checked)
		}
	},
	template: `
		<div class="dropdown">
			<button class="btn btn-outline-secondary dropdown-toggle" type="button" id="statusDropdown" data-bs-toggle="dropdown" aria-expanded="false">
				{{ selected ? selected : $p.t('global/statusSetzen') }}
			</button>
			 <ul class="dropdown-menu" aria-labelledby="statusDropdown">
				<li v-for="status in softwarestatus" :key="status.softwarestatus_kurzbz">
					<a class="dropdown-item" @click="changeStatus(status.softwarestatus_kurzbz)">{{status.bezeichnung}}</a>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-12">
				<div class="form-check form-check-inline">
					<input
						class="form-check-input"
						type="checkbox"
						name="hierarchyView"
						id="hierarchyView"
						v-model="hierarchyView"
						:checked="hierarchyView"
						@change="handleHierarchyViewChange" >
					<label class="form-check-label" for="hierarchyView">{{ $p.t('global/hierarchieAnsicht') }}</label>
				</div>
				<div class="form-check form-check-inline" v-show="hierarchyView">
					<input
						class="form-check-input"
						type="checkbox"
						id="expandHierarchy"
						name="expandHierarchy"
						:checked="expandHierarchy"
						@change="handleHierarchyExpansion">
					<label class="form-check-label" for="expandHierarchy">{{ $p.t('global/aufgeklappt') }}</label>
				</div>
			</div>
		</div>
	`
};
