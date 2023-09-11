import {CoreRESTClient} from '../../../../../js/RESTClient.js';

export const Lizenzserver = {
	emits: [
		'onSaved'
	],
	data() {
		return {
			lizenzserver_kurzbz: null,
			lizenzserver: {},
			errors: []
		}
	},
	methods: {
		prefill(lizenzserver_kurzbz) {
			this.lizenzserver_kurzbz = lizenzserver_kurzbz;

			if (this.lizenzserver_kurzbz !== null) {
				// Get Softwarelizenzserver
				CoreRESTClient.get('/extensions/FHC-Core-Softwarebereitstellung/components/Lizenzserver/getLizenzserver',
					{
						lizenzserver_kurzbz: lizenzserver_kurzbz
					}
				).then(
					result => {
						if (CoreRESTClient.isError(result.data)) {
							this.errors.push(result.data.retval);
						}
						else {
							if (CoreRESTClient.hasData(result.data)) {
								// Prefill form with softwareimage
								this.lizenzserver = CoreRESTClient.getData(result.data);
							}
						}
					}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						alert('Error when getting Softwarelizenzserver: ' + errorMessage);
					}
				);

			}
		},
		save(){
			// Check form fields
			if (!this.$refs.lizenzserverForm.checkValidity())
			{
				// Display form errors if not ok
				this.$refs.lizenzserverForm.reportValidity();
				return;
			}

			// Decide if create or update lizenzserver
			let method = this.lizenzserver_kurzbz === null ? 'createLizenzserver' : 'updateLizenzserver';

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Lizenzserver/' + method,
				{
					lizenzserver: this.lizenzserver,
				}
			).then(
				result => {
					// On error
					if (CoreRESTClient.isError(result.data))
					{
						this.errors.push(result.data.retval);
					}

					// On success
					this.$emit('onSaved');
				}
			).catch(
				error => {
					let errorMessage = error.message ? error.message : 'Unknown error';
					this.errors.push('Error when saving Lizenzserver: ' + errorMessage);
				}
			);
		},
		reset(){
			this.lizenzserver_kurzbz = null,
			this.lizenzserver = {},
			this.errors = [];
			
		}
	},
	template: `
	<div>
		<form ref="lizenzserverForm" class="row">
			<div class="col-sm-9 mb-6">
				<label :for="lizenzserver_kurzbz" class="form-label">Kurzbezeichnung *</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.lizenzserver_kurzbz" required >
				<label :for="bezeichnung" class="form-label">Bezeichnung</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.bezeichnung">	
				<label :for="macadresse" class="form-label">Mac-Adresse</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.macadresse">
				<label :for="ipadresse" class="form-label">IP-Adresse</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.ipadresse">
				<label :for="ansprechpartner" class="form-label">Ansprechpartner</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.ansprechpartner">
				<label :for="location" class="form-label">Location</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.location">
				<label :for="anmerkung" class="form-label">Anmerkung</label>
				<textarea
					class="form-control mb-3"
					v-model="lizenzserver.anmerkung"
					rows="5">
				</textarea>
			</div>
		</form>
	</div>
	<div v-for="error in errors" class="alert alert-danger" role="alert" v-html="error"></div>
	`
}
