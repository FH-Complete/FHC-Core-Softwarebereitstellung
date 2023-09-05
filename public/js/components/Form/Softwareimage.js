import {CoreRESTClient} from '../../../../../js/RESTClient.js';

export const Softwareimage = {
	components: {
		AutoComplete: primevue.autocomplete
	},
	emits: [
		'onSaved'
	],
	data() {
		return {
			softwareimageId: null,
			softwareimage: {},
			errors: []
		}
	},
	methods: {
		prefill(softwareimage_id) {
			this.softwareimageId = softwareimage_id;

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

			// Decide if create or update image
			let method = Number.isInteger(this.softwareimageId) ? 'updateImage' : 'createImage';

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
						Object.entries(CoreRESTClient.getError(result.data))
							.forEach(([key, value]) => {
								this.errors.push(value);
							});

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
			this.errors = [];
			
		},
		onComplete(event)
		{
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Ort/autofill',
				{
					ort_kurzbz: event.query
				}
			).then(result => {
				if (CoreRESTClient.isError(result.data))
				{
					this.errors.push(result.data.retval);
				}
				else
				{
					this.ortSuggestions = CoreRESTClient.getData(result.data);
				}
			}
			).catch(
				error => {
					let errorMessage = error.message ? error.message : 'Unknown error';
					this.errors.push('Error when autofilling Orte: ' + errorMessage);
				}
			);
		}
	},
	template: `
	<div>
		<form ref="softwareimageForm" class="row">
			<div class="col-sm-9 mb-6">
				<label :for="bezeichnung" class="form-label">Bezeichnung *</label>
				<input type="text" class="form-control mb-3" v-model="softwareimage.bezeichnung" required >
				<label :for="betriebssystem" class="form-label">Betriebssystem</label>
				<input type="text" class="form-control mb-3" v-model="softwareimage.betriebssystem">	
				<label :for="verfuegbarkeit_start" class="form-label">Verfügbarkeit Start</label>
				<input type="date" class="form-control mb-3" v-model="softwareimage.verfuegbarkeit_start">
				<label :for="verfuegbarkeit_ende" class="form-label">Verfügbarkeit Ende</label>
				<input type="date" class="form-control mb-3" v-model="softwareimage.verfuegbarkeit_ende">
				<label :for="anmerkung" class="form-label">Anmerkung</label>
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
