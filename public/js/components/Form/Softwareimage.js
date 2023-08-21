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
			orte: [],
			ortSuggestions: [],
			errors: []
		}
	},
	methods: {
		prefill(softwareimage_id) {
			console.log('* in prefill. Implement when editing softwareimage.');
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
					orte_kurzbz: this.orte.map(ort => ort.ort_kurzbz)
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
			console.log('* reset: Softwareimage.js');
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
				<input type="text" class="form-control mb-3" :id="bezeichnung" v-model="softwareimage.bezeichnung" required >
				<label :for="betriebssystem" class="form-label">Betriebssystem</label>
				<input type="text" class="form-control mb-3" :id="betriebssystem"  v-model="softwareimage.betriebssystem">	
				<label :for="verfuegbarkeit_start" class="form-label">Verfügbarkeit Start</label>
				<input type="date" class="form-control mb-3" :id="verfuegbarkeit_start"  v-model="softwareimage.verfuegbarkeit_start">
				<label :for="verfuegbarkeit_ende" class="form-label">Verfügbarkeit Ende</label>
				<input type="date" class="form-control mb-3" :id="verfuegbarkeit_ende"  v-model="softwareimage.verfuegbarkeit_ende">
				<label :for="softwareimage_ort" class="form-label">Raumzuordnung</label>
				<auto-complete
					inputId="softwareimage_ort"
					class="w-100 mb-3"
					v-model="orte"
					optionLabel="ort_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					multiple
					:suggestions="ortSuggestions"
					@complete="onComplete">
				</auto-complete>
				<label :for="anmerkung" class="form-label">Anmerkung</label>
				<textarea
					class="form-control mb-3"
					v-model="softwareimage.anmerkung"
					:id="anmerkung"
					rows="5">
				</textarea>
			</div>
		</form>
	</div>
	<div v-for="error in errors" class="alert alert-danger" role="alert" v-html="error"></div>
	`
}
