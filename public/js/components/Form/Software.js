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
	data() {
		return {
			dataPrefill: {},
			softwareId: null,
			software: {},
			errors: []
		}
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
	created() {
		this.software = this.setDefaultSoftware();
	},
	methods: {
		setDefaultSoftware() {
			return {
				softwaretyp_kurzbz: 'software',
				aktiv: true
			}
		},
		prefillSoftware(software_id){
			this.softwareId = software_id;

			if (Number.isInteger(this.softwareId))
			{
				CoreRESTClient.get(
					'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftware/' + software_id
				).then(
					result => {this.software = CoreRESTClient.getData(result.data);}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						alert('Error when getting software: ' + errorMessage); //TODO beautiful alert
					}
				);
			}
		},
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
					'/extensions/FHC-Core-Softwarebereitstellung/components/Software/' + method,
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
		},
		resetSoftware(){
			this.softwareId = null;
			this.software = this.setDefaultSoftware();
		}
	},
	template: `
	<div>
		<form ref="softwareForm" class="row">
			<div class="col-sm-9 mb-6">
				<div v-for="error in errors" class="alert alert-danger" role="alert" v-html="error"></div>
				<label :for="software_kurzbz" class="form-label">Software Kurzbz *</label>
				<input type="text" class="form-control mb-3" :id="software_kurzbz"  v-model="software.software_kurzbz" required>
				<label :for="softwaretyp" class="form-label">Softwaretyp *</label>
				<select
					class="form-select mb-3"
					required
					:id="sofwaretyp_kurzbz"
					v-model="software.softwaretyp_kurzbz">
					<option v-for="(bezeichnung, softwaretyp_kurzbz) in dataPrefill.softwaretyp" :key="index" :value="softwaretyp_kurzbz">
						{{bezeichnung}}
					</option>
				</select>
				<label :for="version" class="form-label">Version</label>
				<input type="text" class="form-control mb-3" :id="version" v-model="software.version">
				<label :for="os" class="form-label">Betriebssystem</label>
				<input type="text" class="form-control mb-3" :id="os" v-model="software.os">
				<div class="form-check mb-3">
				  <input class="form-check-input" type="checkbox" :id="aktiv" v-model="software.aktiv" :true-value="true" :false-value="false" >
				  <label class="form-check-label" for="flexCheckChecked">Aktiv</label>
				</div>
				<label :for="ansprechpartner_intern" class="form-label">Ansprechpartner (intern)</label>
				<input type="text" class="form-control mb-3" :id="ansprechpartner_intern" v-model="software.ansprechpartner_intern">
					<label :for="ansprechpartner_extern" class="form-label">Ansprechpartner (extern)</label>
				<input type="text" class="form-control mb-3" :id="ansprechpartner_extern" v-model="software.ansprechpartner_extern">
				<label :for="anmerkung_extern" class="form-label">Anmerkung</label>
				<textarea
					class="form-control mb-3"
					v-model="software.anmerkung_intern"
					:id="anmerkung_intern"
					rows="5">
				</textarea>
			</div>
		</form>
	</div>
	`
}
