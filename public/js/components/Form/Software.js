import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import {CoreFetchCmpt} from '../../../../../js/components/Fetch.js';
//import Phrasen from '../../../mixins/Phrasen.js';

export const SoftwareForm = {
	components: {
		CoreFetchCmpt
	},
	emits: [
		'softwareFormSaved'
	],
	//~ mixins: [
		//~ Phrasen
	//~ ],
	props: {
		softwareId: Number
	},
	data() {
		return {
			dataPrefill: {},
			software: {},
			errors: []
		}
	},
	computed: {
	},
	beforeCreate() {
		CoreRESTClient.get(
			'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getDataPrefill',
			null,
			{
				timeout: 2000
			}
		).then(
			result => {
				this.dataPrefill = CoreRESTClient.getData(result.data);
			}
		).catch(
			error => {
				let errorMessage = error.message ? error.message : 'Unknown error';
				alert('Error when getting data prefill: ' + errorMessage); //TODO beautiful alert
			}
		);
	},
	methods: {
		saveSoftware() {

			// Check form fields
			if (!this.$refs.softwareForm.checkValidity())
			{
				// Display form errors if not ok
				this.$refs.softwareForm.reportValidity();
				return;
			}

			let method = null;

			// if numeric software Id is present
			if (Number.isInteger(this.softwareId))
			{
				// update the software
				method = 'updateSoftware';
			}
			else if (this.softwareId == null)
			{
				// create the software if no Id present
				method = 'createSoftware'
			}

			if (method)
			{
				CoreRESTClient.post(
					'/extensions/FHC-Core-Softwarebereitstellung/components/Software/'+method,
					this.software
				).then(
					result => {
						// display errors
						if (CoreRESTClient.isError(result.data))
						{
							let errs = result.data.retval; // TODO fix get Error in rest client
							for (let idx in errs) this.errors.push(errs[idx]);
						}
						else
						{
							// everything ok - clear errors
							this.errors = [];
							// and emit event
							this.$emit("softwareFormSaved");
						}
					}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						this.errors.push('Error when saving software: ' + errorMessage); //TODO beautiful alert
					}
				);
			}
		}
	},
	template: `
	<div>
		<form ref="softwareForm" class="row justify-content-center">
			<div class="col-sm-9 mb-6">
				<div v-for="error in errors" class="alert alert-danger" role="alert" v-html="error"></div>
				<label :for="software_kurzbz" class="form-label">Software Kurzbz:</label>
				<input type="text" class="form-control" :id="software_kurzbz"  v-model="software.software_kurzbz" required>
				<label :for="softwaretyp" class="form-label">Softwaretyp:</label>
				<select
					class="form-select"
					required
					:id="sofwaretyp_kurzbz"
					v-model="software.softwaretyp_kurzbz">
					<option v-for="(bezeichnung, softwaretyp_kurzbz) in dataPrefill.softwaretyp" :key="index" :value="softwaretyp_kurzbz">
						{{bezeichnung}}
					</option>
				</select>
				<label :for="version" class="form-label">Version:</label>
				<input type="text" class="form-control" :id="version" v-model="software.version">
				<label :for="os" class="form-label">Betriebssystem:</label>
				<input type="text" class="form-control" :id="os" v-model="software.os">
				<label :for="aktiv" class="form-label">Aktiv:</label>
				<select
					class="form-select"
					:id="aktiv"
					v-model="software.aktiv"
					required>
					<option :value="true">
						Ja
					</option>
					<option :value="false">
						Nein
					</option>
				</select>
				<label :for="anmerkung_intern" class="form-label">Anmerkung:</label>
				<textarea
					class="form-control"
					v-model="software.anmerkung_intern"
					:id="anmerkung_intern"
					rows="5">
				</textarea>
			</div>
		</form>
	</div>
	`
}
