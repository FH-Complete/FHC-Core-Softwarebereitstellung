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
							this.$fhcAlert.handleFormErrors(
								CoreRESTClient.getError(result.data), this.$refs.lizenzserverForm
							);
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
						this.$fhcAlert.handleSystemError(error);
					}
				);

			}
		},
		save(){
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
						this.$fhcAlert.handleFormErrors(result.data.retval, this.$refs.lizenzserverForm);
					}
					else
					{
						// On success
						this.$fhcAlert.alertSuccess('Gespeichert');
						this.$emit('onSaved');
					}
				}
			).catch(
				error => {
					this.$fhcAlert.handleSystemError(error);
				}
			);
		},
		reset(){
			this.lizenzserver_kurzbz = null;
			this.lizenzserver = {};
			this.errors = [];
			this.$fhcAlert.resetFormErrors(this.$refs.lizenzserverForm);
			
		}
	},
	template: `
	<div>
		<form ref="lizenzserverForm" class="row gy-3">
			<div class="col-sm-4">
				<label class="form-label">Kurzbezeichnung *</label>
				<input type="text" class="form-control" 
					name="lizenzserver_kurzbz"
					v-model="lizenzserver.lizenzserver_kurzbz"
					:disabled="lizenzserver_kurzbz !== null"
					required >
			</div>
			<div class="col-sm-8">
				<label class="form-label">Bezeichnung</label>
				<input type="text" class="form-control" name="bezeichnung" v-model="lizenzserver.bezeichnung">	
			</div>
			<div class="col-sm-4">
				<label class="form-label">Mac-Adresse</label>
				<input type="text" class="form-control" name="macadresse" v-model="lizenzserver.macadresse">
			</div>
			<div class="col-sm-4">
				<label class="form-label">IP-Adresse</label>
				<input type="text" class="form-control" name="ipadresse" v-model="lizenzserver.ipadresse">
			</div>
			<div class="col-sm-4">
				<label class="form-label">Location</label>
				<input type="text" class="form-control" name="location" v-model="lizenzserver.location">
			</div>
			<div class="col-sm-6">
				<label class="form-label">Ansprechpartner</label>
				<input type="text" class="form-control" name="ansprechpartner" v-model="lizenzserver.ansprechpartner">
			</div>
			<div class="col-sm-6">
				<label class="form-label">Anmerkung</label>
				<textarea
					class="form-control"
					name="anmerkung"
					v-model="lizenzserver.anmerkung"
					rows="5">
				</textarea>
			</div>
		</form>
	</div>
	<div v-for="error in errors" class="alert alert-danger" role="alert" v-html="error"></div>
	`
}
