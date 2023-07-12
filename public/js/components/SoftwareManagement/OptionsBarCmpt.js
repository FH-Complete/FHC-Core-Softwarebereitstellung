export const OptionsBarCmpt = {
	emits: [
		'hierarchyToggle'
	],
	props: {
		expandHierarchy: Boolean
	},
	methods: {
		handleHierarchyToggle (event) {
			this.$emit("hierarchyToggle", event.target.checked)
		}
	},
	template: `
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
