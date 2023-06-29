export const OptionsBarCmpt = {
	props: {
		includeHierarchy: Boolean
	},
	data: function() {
	},
	template: `
		<div class="form-check form-switch">
			<input class="form-check-input" type="checkbox" id="includeHierarchy" name="includeHierarchy" :value="includeHierarchy" @input="handleChange">
			<label class="form-check-label" for="includeHierarchy">Include hierarchy</label>
		</div>
	`,
	mounted: function() {
	},
	updated: function() {
	},
	methods: {
		handleChange (event) {
			console.log(event.target.checked);
              this.$emit("customChange", event.target.checked)
          }
	},
	computed: {
	}
};

/**
 * 		<div class="form-check form-switch">
			<input class="form-check-input" type="checkbox" id="includeHierarchy" name="includeHierarchy" :value="includeHierarchy" @input="$emit('input', $event.target.value)">
			<label class="form-check-label" for="includeHierarchy">Include hierarchy</label>
		</div>
*/
