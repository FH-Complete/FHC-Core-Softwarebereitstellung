export const OptionsBarCmpt = {
	props: {
		expandHierarchy: Boolean
	},
	data: function() {
	},
	template: `
		<div class="form-check form-switch">
			<input class="form-check-input" type="checkbox" id="expandHierarchy" name="expandHierarchy" :checked="expandHierarchy" @input="handleHierarchyToggle">
			<label class="form-check-label" for="expandHierarchy">Expand hierarchy</label>
		</div>
	`,
	mounted: function() {
	},
	updated: function() {
	},
	methods: {
		handleHierarchyToggle (event) {
			this.$emit("hierarchyToggle", event.target.checked)
		}
	},
	computed: {
	}
};
