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
			parentSoftwareSuggestions: [], // autocomplete suggestions
			parentSoftware: null, // selected autocomplete values
			softwareImageSuggestions: [], // autocomplete suggestions
			softwareImages: [], // selected autocomplete values
			lizenzserverSuggestions: [], // autocomplete suggestions
			selLizenzserver: null,	// selected autocomplete values
			oeSuggestions: [], // autocomplete suggestions
			selKostentraegerOE: null,	// selected autocomplete values
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
				softwaretyp_kurzbz: 'software'
			}
		},
		getDefaultSoftwarestatus() {
			return {
				softwarestatus_kurzbz: 'inbearbeitung'
			}
		},
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
								this.selLizenzserver = softwareData.software.lizenzserver_kurzbz;
								this.selKostentraegerOE = softwareData.software.kostentraeger_oe_kurzbz;
								if (softwareData.hasOwnProperty('software_parent'))
								{
									// set software_kurzbz_version field for display in autocomplete
									let parent = softwareData.software_parent;
									parent.software_kurzbz_version =
										parent.version != null
										? parent.software_kurzbz + ' (version: '+parent.version+')'
										: parent.software_kurzbz;
									this.parentSoftware = parent;
								}
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
					'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getLastSoftwarestatus',
					{
						software_id: software_id
					},
					{
						timeout: 2000
					}
				).then(
					result => {this.softwarestatus = CoreRESTClient.getData(result.data);}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						alert('Error when getting softwarestatus: ' + errorMessage);
					}
				);

				// Get images of software
				CoreRESTClient.get(
					'/extensions/FHC-Core-Softwarebereitstellung/components/Image/getImagesBySoftware',
					{
						software_id: software_id
					},
					{
						timeout: 2000
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
						}
					}
				).catch(
					error => {
						let errorMessage = error.message ? error.message : 'Unknown error';
						alert('Error when getting software images: ' + errorMessage);
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

			// If Lizenzserver Kurzbz was selected, pass to software object
			this.software.lizenzserver_kurzbz = this.selLizenzserver !== null
				? this.selLizenzserver.lizenzserver_kurzbz
				: null;

			// If Kostentraeger OE Kurzbz was selected, pass to software object
			this.software.kostentraeger_oe_kurzbz = this.selKostentraegerOE !== null
				? this.selKostentraegerOE.oe_kurzbz
				: null;

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

							for (const [key, value] of Object.entries(errs)) {
								this.errors.push (value);
							}
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
			this.selLizenzserver = null;
			this.selKostentraegerOE = null;
			this.errors = [];
		},
		getSoftwareByKurzbz(event) {
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareByKurzbz',
				{
					software_kurzbz: event.query
				},
				{
					timeout: 2000
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
						let softwareList = CoreRESTClient.getData(result.data);

						// set software_kurzbz_version for display of kurzbz and version in autocomple field
						for (let sw of softwareList) {
							sw.software_kurzbz_version = sw.version != null ? sw.software_kurzbz+' (version: '+sw.version+')' : sw.software_kurzbz;
						}
						this.parentSoftwareSuggestions = softwareList;
					}
				}
			).catch(
				error => {
					let errorMessage = error.message ? error.message : 'Unknown error';
					this.errors.push('Error when getting softwareByKurzbz: ' + errorMessage);
				}
			);
		},
		getOeSuggestions(event) {
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getOeSuggestions',
				{
					eventQuery: event.query
				},
				{
					timeout: 2000
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
						this.oeSuggestions = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => {
					let errorMessage = error.message ? error.message : 'Unknown error';
					this.errors.push('Error when getting OeSuggestions: ' + errorMessage);
				}
			);
		},
		getImagesByBezeichnung(event) {
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
		},
		getLizenzserverByKurzbz(event) {
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Lizenzserver/getLizenzserverByKurzbz',
				{
					lizenzserver_kurzbz: event.query
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
						this.lizenzserverSuggestions = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => {
					let errorMessage = error.message ? error.message : 'Unknown error';
					this.errors.push('Error when getting Lizenzserver: ' + errorMessage);
				}
			);
		},
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
				<label class="form-label">Verantwortliche</label>
				<input type="text" class="form-control mb-3" v-model="software.verantwortliche">
				<label :for="beschreibung" class="form-label">Beschreibung</label>
				<textarea
					class="form-control mb-3"
					v-model="software.beschreibung"
					:id="beschreibung"
					rows="5">
				</textarea>
				<label :for="software_id_parent" class="form-label">Übergeordnete Software</label>
				<auto-complete
					inputId="software_id_parent"
					class="w-100 mb-3"
					v-model="parentSoftware"
					optionLabel="software_kurzbz_version"
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
				<label class="form-label">Lizenz-Art</label>
				<input type="text" class="form-control mb-3" v-model="software.lizenzart">
				<label class="form-label">Lizenz-Server Kurzbezeichnung</label>
				<auto-complete
					class="w-100 mb-3"
					v-model="selLizenzserver"
					optionLabel="lizenzserver_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					:suggestions="lizenzserverSuggestions"
					@complete="getLizenzserverByKurzbz">
				</auto-complete>
				<label class="form-label">Lizenz-Anzahl</label>
				<input type="text" class="form-control mb-3" v-model="software.anzahl_lizenzen">
				<label class="form-label">Lizenz-Laufzeit</label>
				<input type="date" class="form-control mb-3" v-model="software.lizenzlaufzeit">
				<label class="form-label">Lizenz-Kosten</label>
				<div class="input-group mb-3">
				  	<input type="text" class="form-control" v-model="software.lizenzkosten">
				  	<span class="input-group-text">€/Jahr</span>
				</div>	
				<label class="form-label">Kostenträger-OE</label>
				<auto-complete
					class="w-100 mb-3"
					v-model="selKostentraegerOE"
					optionLabel="oe_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					:suggestions="oeSuggestions"
					@complete="getOeSuggestions">
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
