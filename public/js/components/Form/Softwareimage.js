import {CoreRESTClient} from '../../../../../js/RESTClient.js';

export const Softwareimage = {
	components: {
		AutoComplete: primevue.autocomplete,
		"datepicker": VueDatePicker
	},
	emits: [
		'onSaved'
	],
	data() {
		return {
			softwareimageId: null,
			softwareimage: {},
			copy: false,
			errors: []
		}
	},
	methods: {
		prefill(softwareimage_id, copy) {
			this.softwareimageId = softwareimage_id;
			this.copy = copy;

			if (Number.isInteger(this.softwareimageId)) {
				// Get softwareimage
				CoreRESTClient.get('/extensions/FHC-Core-Softwarebereitstellung/components/Image/getImage',
					{
						softwareimage_id: softwareimage_id
					}
				).then(
					result => {
						if (CoreRESTClient.isError(result.data)) {
							this.errors.push(result.data.retval);
						}
						else {
							if (CoreRESTClient.hasData(result.data)) {
								// Prefill form with softwareimage
								this.softwareimage = CoreRESTClient.getData(result.data);
							}
						}
					}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						alert('Error when getting softwareimage: ' + errorMessage);
					}
				);

			}
		},
		save(){
			// Check form fields
			if (!this.$refs.softwareimageForm.checkValidity())
			{
				// Display form errors if not ok
				this.$refs.softwareimageForm.reportValidity();
				return;
			}

			// Decide if copy, create or update image
			if (this.copy === true) {
				var method = 'copyImageAndOrte';
			}
			else {
				var method = Number.isInteger(this.softwareimageId) ? 'updateImage' : 'createImage';
			}

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Image/' + method,
				{
					softwareimage: this.softwareimage,
				}
			).then(
				result => {
					// On error
					if (CoreRESTClient.isError(result.data))
					{
						if(typeof result.data.retval === 'string')
						{
							this.errors.push(result.data.retval);
						}

						if(typeof result.data.retval === 'object') {
							Object.entries(CoreRESTClient.getError(result.data))
								.forEach(([key, value]) => {
									this.errors.push(value);
								});
						}

						return;
					}

					// On success
					this.$emit('onSaved');
				}
			).catch(
				error => {
					let errorMessage = error.message ? error.message : 'Unknown error';
					this.errors.push('Error when saving softwareimage: ' + errorMessage);
				}
			);
		},
		reset(){
			this.softwareimageId = null,
			this.softwareimage = {},
			this.copy = false,
			this.errors = [];
		}
	},
	template: `
	<div>
		<form ref="softwareimageForm" class="row">
			<div class="col-sm-6">
				<label class="form-label">Bezeichnung *</label>
				<input type="text" class="form-control mb-3" v-model="softwareimage.bezeichnung" required >
			</div>
			<div class="col-sm-6">
				<label class="form-label">Betriebssystem</label>
				<input type="text" class="form-control mb-3" v-model="softwareimage.betriebssystem">
			</div>
			<div class="col-sm-3">
				<label class="form-label">Verfügbarkeit Start</label>
				<datepicker
					v-model="softwareimage.verfuegbarkeit_start"
					v-bind:enable-time-picker="false"
					v-bind:placeholder="'TT.MM.YY'"
					v-bind:text-input="true"
					v-bind:auto-apply="true"
					locale="de"
					format="dd.MM.yyyy"
					model-type="yyyy-MM-dd">
				</datepicker>
			</div>
			<div class="col-sm-3">
				<label class="form-label">Verfügbarkeit Ende</label>
				<datepicker
					v-model="softwareimage.verfuegbarkeit_ende"
					v-bind:enable-time-picker="false"
					v-bind:placeholder="'TT.MM.YY'"
					v-bind:text-input="true"
					v-bind:auto-apply="true"
					locale="de"
					format="dd.MM.yyyy"
					model-type="yyyy-MM-dd">
				</datepicker>
			</div>
			<div class="col-sm-6">
				<label class="form-label">Anmerkung</label>
				<textarea
					class="form-control mb-3"
					v-model="softwareimage.anmerkung"
					rows="5">
				</textarea>
			</div>
		</form>
	</div>
	<div v-for="error in errors" class="alert alert-danger" role="alert" v-html="error"></div>
	`
}
