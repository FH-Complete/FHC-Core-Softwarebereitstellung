import {CoreRESTClient} from '../../../../../js/RESTClient.js';

export const Raum = {
	components: {
		AutoComplete: primevue.autocomplete
	},
	emits: [
		 'onSaved'
	],
	data() {
		return {
			softwareimageort_id: null,
			softwareimage_id : Vue.inject('softwareimageId'),
			softwareimage_bezeichnung: Vue.inject('softwareimage_bezeichnung'),
			orte: [],
			ortSuggestions: [],
			verfuegbarkeit_start: null,
			verfuegbarkeit_ende: null,
			errors: []
		}
	},
	methods: {
		prefill(softwareimageort_id){
			
			if (Number.isInteger(softwareimageort_id)) {
				this.softwareimageort_id = softwareimageort_id;

				// Get softwareimageort
				CoreRESTClient.get('/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getImageort',
					{
						softwareimageort_id: softwareimageort_id,
					}
				).then(
					result => {
						if (CoreRESTClient.isError(result.data)) {
							this.errors.push(result.data.retval);
						}
						else {
							if (CoreRESTClient.hasData(result.data)) {

								// Prefill form with softwareimageort
								let data = CoreRESTClient.getData(result.data);
								this.verfuegbarkeit_start = data.verfuegbarkeit_start;
								this.verfuegbarkeit_ende = data.verfuegbarkeit_ende;

								// Prefill form with Raum assigned to softwareimage
								this.orte = [CoreRESTClient.getData(result.data)];
							}
						}
					}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						alert('Error when getting softwareimageort: ' + errorMessage);
					}
				);
			}
		},
		save(){
			// Decide if add or update Raumzuordnung
			let method = this.softwareimageort_id == null ? 'insertImageort' : 'updateImageort';

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Ort/' + method,
				method === 'insertImageort' ?
				{
					softwareimage_id: this.softwareimage_id,
					orte_kurzbz: this.orte.map(ort => ort.ort_kurzbz),
					verfuegbarkeit_start: this.verfuegbarkeit_start,
					verfuegbarkeit_ende: this.verfuegbarkeit_ende
				} :
				{
					softwareimageorte_id: [this.softwareimageort_id], // TODO selectedSoftwareimageorte
					verfuegbarkeit_start: this.verfuegbarkeit_start,
					verfuegbarkeit_ende: this.verfuegbarkeit_ende
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
					this.errors.push('Error when saving or updating softwareimageort: ' + errorMessage);
				}
			);
		},
		reset(){
			this.softwareimageort_id = null;
			this.orte = [];
			this.verfuegbarkeit_start = null;
			this.verfuegbarkeit_ende = null;
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
		<form ref="raumForm" class="row">
			<div class="col-sm-9 mb-6">
				<label :for="softwareimage_bezeichnung" class="form-label">Softwareimage</label>
				<input type="text" class="form-control mb-3" v-model="softwareimage_bezeichnung" readonly>	
				<label :for="ort_kurzbz" class="form-label">Raum *</label>
				<auto-complete
					inputId="ort_kurzbz"
					class="w-100 mb-3"
					v-model="orte"
					optionLabel="ort_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					multiple
					:disabled="softwareimageort_id !== null"
					:suggestions="ortSuggestions"
					@complete="onComplete">
				</auto-complete>
				<label :for="verfuegbarkeit_start" class="form-label">Verfügbarkeit Start</label>
				<input type="date" class="form-control mb-3" v-model="verfuegbarkeit_start">
				<label :for="verfuegbarkeit_ende" class="form-label">Verfügbarkeit Ende</label>
				<input type="date" class="form-control mb-3" v-model="verfuegbarkeit_ende">
			</div>
		</form>
	</div>
	<div v-for="error in errors" class="alert alert-danger" role="alert" v-html="error"></div>
	`
}
