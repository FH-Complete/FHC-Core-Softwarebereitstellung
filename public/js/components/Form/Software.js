import {CoreRESTClient} from '../../../../../js/RESTClient.js';
//import Phrasen from '../../../mixins/Phrasen.js';

export const SoftwareForm = {
	components: {
		AutoComplete: primevue.autocomplete
	},
	emits: [
		'softwareFormSaved'
	],
	//~ mixins: [
		//~ Phrasen
	//~ ],
	data() {
		return {
			softwareMetadata: {},
			softwareId: null,
			software: {},
			softwarestatus: {},
			parentSoftwareSuggestions: [],
			parentSoftware: null,
			softwareImageSuggestions: [],
			softwareImages: [],
			errors: []
		}
	},
	computed: {
		extendedSoftware() {
			let parent_software_id = this.parentSoftware ? this.parentSoftware.software_id : null;
			return {...this.software, ...{software_id_parent: parent_software_id}}
		}
	},
	beforeCreate() {
		CoreRESTClient.get(
			'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareMetadata',
			null,
			{
				timeout: 2000
			}
		).then(
			result => {
				// display errors
				if (CoreRESTClient.isError(result.data))
				{
					alert('Error when getting software metadata: ' + result.data.retval); //TODO beautiful alert
				}
				else
				{
					this.softwareMetadata = CoreRESTClient.getData(result.data);
				}
			}
		).catch(
			error => {
				let errorMessage = error.message ? error.message : 'Unknown error';
				alert('Error when getting software metadata: ' + errorMessage); //TODO beautiful alert
			}
		);
	},
	created() {
		// Prefill form with default values
		this.software = this.getDefaultSoftware();
		this.softwarestatus = this.getDefaultSoftwarestatus();
	},
	methods: {
		getDefaultSoftware() {
			return {
				softwaretyp_kurzbz: 'software',
				aktiv: true
			}
		},
		getDefaultSoftwarestatus() {
			return {
				softwarestatus_kurzbz: 'neu'
			}
		},
		// Prefill form with software values
		prefillSoftware(software_id) {
			this.softwareId = software_id;

			if (Number.isInteger(this.softwareId))
			{
				// Get software data
				CoreRESTClient.get(
					'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftware',
					{
						software_id: software_id
					}
				).then(
					result => {
						if (CoreRESTClient.isError(result.data))
						{
							this.errors.push(result.data.retval);
						}
						else
						{
							if (CoreRESTClient.hasData(result.data)) {
								let softwareData = CoreRESTClient.getData(result.data);
								this.software = softwareData.software;
								if (softwareData.hasOwnProperty('software_kurzbz_parent'))
									this.parentSoftware = {software_id: softwareData.software_id_parent, software_kurzbz: softwareData.software_kurzbz_parent};
							}
						}
					}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						alert('Error when getting software: ' + errorMessage); //TODO beautiful alert
					}
				);

				// Get last softwarestatus data
				CoreRESTClient.get(
					'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getLastSoftwarestatus/' + software_id
				).then(
					result => {this.softwarestatus = CoreRESTClient.getData(result.data);}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						alert('Error when getting softwarestatus: ' + errorMessage);
					}
				);

				// Get images and orte of software
				CoreRESTClient.get(
					'/extensions/FHC-Core-Softwarebereitstellung/components/Image/getImagesBySoftware',
					{
						software_id: software_id
					}
				).then(
					result => {
						if (CoreRESTClient.isError(result.data))
						{
							this.errors.push(result.data.retval);
						}
						else if(CoreRESTClient.hasData(result.data))
						{
							this.softwareImages = CoreRESTClient.getData(result.data);

							// display images
							//~ for (let imageOrt of imageOrte)
							//~ {
								//~ let found = false;
								//~ for (let softwareImage of this.softwareImages) {
									//~ if (imageOrt.softwareimage_id == softwareImage.softwareimage_id) {
										//~ found = true;
										//~ break;
									//~ }
								//~ }

								//~ if (!found)
									//~ this.softwareImages.push({softwareimage_id: imageOrt.softwareimage_id, image_bezeichnung: imageOrt.image});
							//}
						}
					}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						alert('Error when getting softwarestatus: ' + errorMessage);
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
					{
						software: this.extendedSoftware,
						softwarestatus: this.softwarestatus,
						softwareImageIds: [...new Set(this.softwareImages.map(softwareImage => softwareImage.softwareimage_id))]
					}
				).then(
					result => {
						// display errors
						if (CoreRESTClient.isError(result.data))
						{
							let errs = result.data.retval; // TODO fix get Error in rest client
							for (let err of errs) this.errors.push(err);
						}
						else
						{
							// everything ok
							// emit event
							this.$emit("softwareFormSaved");
						}
					}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						this.errors.push('Error when saving software: ' + errorMessage);
					}
				);
			}
		},
		resetSoftware(){
			this.softwareId = null;
			this.software = this.getDefaultSoftware();
			this.softwarestatus = this.getDefaultSoftwarestatus();
			this.parentSoftware = null;
			this.softwareImages = [];
			this.errors = [];
		},
		getSoftwareByKurzbz(event)
		{
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareByKurzbz',
				{
					software_kurzbz: event.query
				}
			).then(
				result => {
					// display errors
					if (CoreRESTClient.isError(result.data))
					{
						this.errors.push(result.data.retval);
					}
					else
					{
						this.parentSoftwareSuggestions = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => {
					let errorMessage = error.message ? error.message : 'Unknown error';
					this.errors.push('Error when getting software: ' + errorMessage);
				}
			);
		},
		getImagesByBezeichnung(event)
		{
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Image/getImagesByBezeichnung',
				{
					image_bezeichnung: event.query
				}
			).then(
				result => {
					// display errors
					if (CoreRESTClient.isError(result.data))
					{
						this.errors.push(result.data.retval);
					}
					else
					{
						this.softwareImageSuggestions = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => {
					let errorMessage = error.message ? error.message : 'Unknown error';
					this.errors.push('Error when getting images: ' + errorMessage);
				}
			);
		}
	},
	template: `
	<div>
		<form ref="softwareForm" class="row">
			<div class="col-sm-9 mb-6">
				<label :for="software_kurzbz" class="form-label">Software Kurzbz *</label>
				<input type="text" class="form-control mb-3" :id="software_kurzbz"  v-model="software.software_kurzbz" required>
				<label :for="softwaretyp" class="form-label">Softwaretyp *</label>
				<select
					class="form-select mb-3"
					required
					:id="sofwaretyp_kurzbz"
					v-model="software.softwaretyp_kurzbz">
					<option v-for="(bezeichnung, softwaretyp_kurzbz) in softwareMetadata.softwaretyp" :key="index" :value="softwaretyp_kurzbz">
						{{bezeichnung}}
					</option>
				</select>
				<label :for="softwarestatus_kurzbz" class="form-label">Softwarestatus *</label>
				<select
					class="form-select mb-3"
					required
					:id="sofwarestatus_kurzbz"
					v-model="softwarestatus.softwarestatus_kurzbz">
					<option v-for="(bezeichnung, softwarestatus_kurzbz) in softwareMetadata.softwarestatus" :key="index" :value="softwarestatus_kurzbz">
						{{bezeichnung}}
					</option>
				</select>
				<label :for="version" class="form-label">Version</label>
				<input type="text" class="form-control mb-3" :id="version" v-model="software.version">
				<label :for="hersteller" class="form-label">Hersteller</label>
				<input type="text" class="form-control mb-3" :id="hersteller" v-model="software.hersteller">
				<label :for="os" class="form-label">Betriebssystem</label>
				<input type="text" class="form-control mb-3" :id="os" v-model="software.os">
				<label :for="beschreibung" class="form-label">Beschreibung</label>
				<textarea
					class="form-control mb-3"
					v-model="software.beschreibung"
					:id="beschreibung"
					rows="5">
				</textarea>
				<div class="form-check mb-3">
				  <input class="form-check-input" type="checkbox" :id="aktiv" v-model="software.aktiv" :true-value="true" :false-value="false" >
				  <label class="form-check-label" for="flexCheckChecked">Aktiv</label>
				</div>
				<label :for="software_id_parent" class="form-label">Übergeordnete Software</label>
				<auto-complete
					inputId="software_id_parent"
					class="w-100 mb-3"
					v-model="parentSoftware"
					optionLabel="software_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					:suggestions="parentSoftwareSuggestions"
					@complete="getSoftwareByKurzbz">
				</auto-complete>
				<label :for="software_image" class="form-label">Image</label>
				<auto-complete
					inputId="software_image"
					class="w-100 mb-3"
					v-model="softwareImages"
					optionLabel="image_bezeichnung"
					dropdown
					dropdown-current
					forceSelection
					multiple
					:suggestions="softwareImageSuggestions"
					@complete="getImagesByBezeichnung">
				</auto-complete>
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
	<div v-for="error in errors" class="alert alert-danger" role="alert" v-html="error"></div>
	`
}