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
			softwareimageId: null,
			ort_kurzbz: null,
			softwareimageort: {},
			errors: []
		}
	},
	methods: {
		prefill(ort_kurzbz, softwareimage_id){
			this.ort_kurzbz = ort_kurzbz;
			this.softwareimageId = softwareimage_id;

			if (Number.isInteger(this.softwareimageId) && this.ort_kurzbz != null) {
				// Get softwareimageort
				CoreRESTClient.get('/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getImageort',
					{
						ort_kurzbz: ort_kurzbz,
						softwareimage_id: softwareimage_id
					}
				).then(
					result => {
						if (CoreRESTClient.isError(result.data)) {
							this.errors.push(result.data.retval);
						}
						else {
							if (CoreRESTClient.hasData(result.data)) {
								// Prefill form with softwareimageort
								this.softwareimageort = CoreRESTClient.getData(result.data);
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
			// Check form fields
			if (!this.$refs.raumForm.checkValidity())
			{
				// Display form errors if not ok
				this.$refs.raumForm.reportValidity();
				return;
			}
			console.log('* in save');
			console.log(this.softwareimageId);
			console.log(this.softwareimageort);

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Ort/updateImageort',
				{
					softwareimage_id: this.softwareimageId,
					softwareimageort: this.softwareimageort
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
					this.errors.push('Error when saving softwareimageort: ' + errorMessage);
				}
			);
		},
		reset(){
			this.softwareimageId = null,
			this.ort_kurzbz = null,
			this.softwareimageort = {},
			this.errors = [];
			
		}
	},
	template: `
	<div>
		<form ref="raumForm" class="row">
			<div class="col-sm-9 mb-6">
				<label :for="ort_kurzbz" class="form-label">Ort Kurzbezeichnung</label>
				<input type="text" class="form-control mb-3" :id="ort_kurzbz"  v-model="softwareimageort.ort_kurzbz" readonly>	
				<label :for="verfuegbarkeit_start" class="form-label">Verfügbarkeit Start</label>
				<input type="date" class="form-control mb-3" :id="verfuegbarkeit_start"  v-model="softwareimageort.verfuegbarkeit_start">
				<label :for="verfuegbarkeit_ende" class="form-label">Verfügbarkeit Ende</label>
				<input type="date" class="form-control mb-3" :id="verfuegbarkeit_ende"  v-model="softwareimageort.verfuegbarkeit_ende">
			</div>
		</form>
	</div>
	<div v-for="error in errors" class="alert alert-danger" role="alert" v-html="error"></div>
	`
}
