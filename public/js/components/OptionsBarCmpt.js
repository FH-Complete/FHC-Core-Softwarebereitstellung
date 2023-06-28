export const OptionsBarCmpt = {
	props: {
		includeHierarchy: {
			type: Boolean,
			default: true
		}
	},
	template: `

		{{includeHierarchy}}
		<div class="form-check form-switch">
			<input class="form-check-input" v-model="includeHierarchy" type="checkbox" id="includeHierarchy" name="includeHierarchy" value="yes">
			<label class="form-check-label" for="includeHierarchy">Include hierarchy</label>
		</div> 
	`,
	mounted: function() {
	},
	updated: function() {
	},
	methods: {
	},
	computed: {
	}
};
