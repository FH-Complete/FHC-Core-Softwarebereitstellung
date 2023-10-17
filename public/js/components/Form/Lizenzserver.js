import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import {Alert} from "../SoftwareManagement/Alert"

export const Lizenzserver = {
	emits: [
		'onSaved'
	],
	mixins: [Alert],
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
							this.alertSystemMessage(result.data.retval);  // TODO Check Result from Backend
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
						this.alertSystemError(error);
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
						this.alertSystemMessage(result.data.retval); // TODO Check RESULT from Backend
					}

					// On success
					this.alertSuccess('Gespeichert');
					this.$emit('onSaved');
				}
			).catch(
				error => {
					this.alertSystemError(error);
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
			<div class="col-sm-4">
				<label class="form-label">Kurzbezeichnung *</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.lizenzserver_kurzbz" required >
			</div>
			<div class="col-sm-8">
				<label class="form-label">Bezeichnung</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.bezeichnung">	
			</div>
			<div class="col-sm-4">
				<label class="form-label">Mac-Adresse</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.macadresse">
			</div>
			<div class="col-sm-4">
				<label class="form-label">IP-Adresse</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.ipadresse">
			</div>
			<div class="col-sm-4">
				<label class="form-label">Location</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.location">
			</div>
			<div class="col-sm-6">
				<label class="form-label">Ansprechpartner</label>
				<input type="text" class="form-control mb-3" v-model="lizenzserver.ansprechpartner">
			</div>
			<div class="col-sm-6">
				<label class="form-label">Anmerkung</label>
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
