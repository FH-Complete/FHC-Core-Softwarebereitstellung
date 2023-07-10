import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import {CoreFetchCmpt} from '../../../../../js/components/Fetch.js';
//import Phrasen from '../../../mixins/Phrasen.js';

export const SoftwareForm = {
	components: {
		CoreFetchCmpt
	},
	//~ mixins: [
		//~ Phrasen
	//~ ],
	emits: [
	],
	props: {
		softwareId: Number
	},
	data() {
		return {
			software: {},
			dataPrefill: {},
			saving: false,
			errors: {
				grund: [],
				default: []
			}
		}
	},
	computed: {
	},
	beforeCreate() {
		CoreRESTClient.get(
			'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getDataPrefill'
		).then(
			result => {
					console.log("FEETCHED");
					this.dataPrefill = CoreRESTClient.getData(result.data);
					//~ return result;
				}
		).catch(
			error => {
				let errorMessage = error.message ? error.message : 'Unknown error';
				alert('Error when getting data prefill: ' + errorMessage); //TODO beautiful alert
			}
		);
		//~ axios.get(
				//~ FHC_JS_DATA_STORAGE_OBJECT.app_root +
				//~ FHC_JS_DATA_STORAGE_OBJECT.ci_router +
				//~ '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getDataPrefill'
			//~ ).then(
				//~ result => {
					//~ console.log("FETCHED");
					//~ console.log(result.data);
					//~ this.dataPrefill = result.data.retval;
					//~ return result;
				//~ }
			//~ );
	},
	methods: {
		load() {
			//~ return axios.get(
				//~ FHC_JS_DATA_STORAGE_OBJECT.app_root +
				//~ FHC_JS_DATA_STORAGE_OBJECT.ci_router +
				//~ '/extensions/FHC-Core-Softwarebereitstellung/components/Software/getDataPrefill'
			//~ ).then(
				//~ result => {
					//~ //console.log("FETCHED");
					//~ //console.log(result.data);
					//~ //this.dataPrefill = result.data.retval;
					//~ return null;
				//~ }
			//~ );
		},
		createSoftware() {
			//bootstrap.Modal.getOrCreateInstance(this.$refs.modal).hide();
			this.saving = true;
			//~ for(var k in this.errors)
				//~ this.errors[k] = [];

			let formData = new FormData();

			for (idx in this.data)
				formData.append(idx, data[idx]);

				console.log(formData);

		CoreRESTClient.post(
			'/extensions/FHC-Core-Softwarebereitstellung/components/Software/createSoftware',
			formData
		).then(
			result => {
					console.log("create sw fetched");
				}
		).catch(
			error => {
				let errorMessage = error.message ? error.message : 'Unknown error';
				alert('Error when creating software: ' + errorMessage); //TODO beautiful alert
			}
		);

			//~ axios.post(
				//~ FHC_JS_DATA_STORAGE_OBJECT.app_root +
				//~ FHC_JS_DATA_STORAGE_OBJECT.ci_router +
				//~ '/extensions/FHC-Core-Softwarebereitstellung/components/Software/Software/createSoftware',
				//~ formData
			//~ ).then(
				//~ result => {
					//~ console.log(result.data);
				//~ }
			//~ );
		}
	},
	template: `
	<div>
			<div class="row">
				<div class="col-sm-6 mb-3">
					<label :for="software_kurzbz" class="form-label">Software Kurzbz:</label>
					<input type="text" class="form-control" :id="software_kurzbz"  v-model="software.software_kurzbz" required>
					<label :for="softwaretyp" class="form-label">Softwaretyp:</label>
					<select
						class="form-select"
						required
						:id="sofwaretyp_kurzbz"
						v-model="software.softwaretyp_kurzbz"
						>
						<option v-for="(bezeichnung, softwaretyp_kurzbz) in dataPrefill.softwaretyp" :key="index" :value="index">
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
						required
						>
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
						rows="5"
						>
					</textarea>
				</div>
			</div>
	</div>
	`
}


/**
 *
 * 				<div class="col-12">
		<core-fetch-cmpt :api-function="load">
					<div v-for="error in errors.default" class="alert alert-danger" role="alert" v-html="error">
					</div>
				</div>
 * 			<template v-slot:error="{errorMessage}">
				<div class="alert alert-danger m-0" role="alert">
					{{ errorMessage }}
				</div>
			</template>
			* **/


