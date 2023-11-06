import {CoreRESTClient} from '../../../../../js/RESTClient.js';
//import Phrasen from '../../../mixins/Phrasen.js';

export const SoftwareForm = {
	components: {
		AutoComplete: primevue.autocomplete,
		"datepicker": VueDatePicker
	},
	emits: [
		'softwareFormSaved'
	],
	data() {
		return {
			softwareMetadata: {},
			softwareId: null,
			software: {},
			softwarestatus: {},
			parentSoftwareSuggestions: [], // autocomplete suggestions
			parentSoftware: null, // selected autocomplete value
			softwareImageSuggestions: [], // autocomplete suggestions
			softwareImages: [], // selected autocomplete values
			lizenzserverSuggestions: [], // autocomplete suggestions
			selLizenzserver: null,	// selected autocomplete values
			oeSuggestions: [], // autocomplete suggestions
			selKostentraegerOE: null	// selected autocomplete values
		}
	},
	computed: {
		extendedSoftware() {
			let parent_software_id = this.parentSoftware ? this.parentSoftware.software_id : null;
			let lizenzserver_kurzbz = this.selLizenzserver ? this.selLizenzserver.lizenzserver_kurzbz : null;
			return {...this.software, ...{software_id_parent: parent_software_id, lizenzserver_kurzbz: lizenzserver_kurzbz}}
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
					this.$fhcAlert.handleSystemMessage(result.data.retval);
				}
				else
				{
					this.softwareMetadata = CoreRESTClient.getData(result.data);
				}
			}
		).catch(
			error => { this.$fhcAlert.handleSystemError(error); }
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
							this.$fhcAlert.handleFormErrors(
								CoreRESTClient.getError(result.data), this.$refs.softwareForm
							);
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
					error => { this.$fhcAlert.handleSystemError(error); }
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
					error => { this.$fhcAlert.handleSystemError(error); }
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
							this.$fhcAlert.handleFormErrors(
								CoreRESTClient.getError(result.data), this.$refs.softwareForm
							);
						}
						else if(CoreRESTClient.hasData(result.data))
						{
							this.softwareImages = CoreRESTClient.getData(result.data);
						}
					}
				).catch(
					error => { this.$fhcAlert.handleSystemError(error); }
				);
			}
		},
		saveSoftware() {
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
							this.$fhcAlert.handleFormErrors(
								CoreRESTClient.getError(result.data), this.$refs.softwareForm
							);
						}
						else
						{
							this.$fhcAlert.alertSuccess('Gespeichert');
							this.$emit("softwareFormSaved");
						}
					}
				).catch(
					error => { this.$fhcAlert.handleSystemError(error); }
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
			this.$fhcAlert.resetFormErrors(this.$refs.softwareForm);
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
						this.$fhcAlert.handleFormErrors(CoreRESTClient.getError(result.data), this.$refs.softwareForm);
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
				error => { this.$fhcAlert.handleSystemError(error); }
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
						this.$fhcAlert.handleFormErrors(CoreRESTClient.getError(result.data), this.$refs.softwareForm);
					}
					else
					{
						let data = CoreRESTClient.getData(result.data);

						let groupedData = {};

						// Group data by 'organisationseinheittyp_kurzbz'
						if (data !== null && data.length > 0){
							data.forEach(oe => {
								let { organisationseinheittyp_kurzbz, oe_kurzbz, bezeichnung, aktiv } = oe;

								if (!groupedData[organisationseinheittyp_kurzbz]) {
									groupedData[organisationseinheittyp_kurzbz] = {
										organisationseinheittyp_kurzbz,
										oes: []
									};
								}

								groupedData[organisationseinheittyp_kurzbz].oes.push({
									oe_kurzbz,
									bezeichnung,
									aktiv
								});
							});

							// Convert object to an array of grouped items
							this.oeSuggestions = Object.values(groupedData);
						}
					}
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
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
						this.$fhcAlert.handleFormErrors(CoreRESTClient.getError(result.data), this.$refs.softwareForm);
					}
					else
					{
						this.softwareImageSuggestions = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
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
						this.$fhcAlert.handleFormErrors(CoreRESTClient.getError(result.data), this.$refs.softwareForm);
					}
					else
					{
						this.lizenzserverSuggestions = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
		},
	},
	template: `
	<div>
		<form ref="softwareForm" class="row gy-3">
			<div class="col-sm-3">
				<label class="form-label">Softwaretyp *</label>
				<select
					class="form-select"
					name="softwaretyp_kurzbz"
					required
					v-model="software.softwaretyp_kurzbz">
					<option v-for="(bezeichnung, softwaretyp_kurzbz) in softwareMetadata.softwaretyp" :key="index" :value="softwaretyp_kurzbz">
						{{bezeichnung}}
					</option>
				</select>
			</div>
			<div class="col-sm-5">
				<label class="form-label">Software Kurzbz *</label>
				<input type="text" class="form-control" name="software_kurzbz" v-model="software.software_kurzbz">
			</div>
			<div class="col-sm-4">
				<label class="form-label">Softwarestatus *</label>
				<select
					class="form-select"
					name="softwarestatus_kurzbz"
					required
					v-model="softwarestatus.softwarestatus_kurzbz">
					<option v-for="(bezeichnung, softwarestatus_kurzbz) in softwareMetadata.softwarestatus" :key="index" :value="softwarestatus_kurzbz">
						{{bezeichnung}}
					</option>
				</select>
			</div>
			<div class="col-sm-1">
				<label class="form-label">Version</label>
				<input type="text" class="form-control" name="version" v-model="software.version">
			</div>
			<div class="col-sm-5">
				<label class="form-label">Betriebssystem</label>
				<input type="text" class="form-control" name="os" v-model="software.os">
			</div>
			<div class="col-sm-6">
				<label class="form-label">Hersteller</label>
				<input type="text" class="form-control" name="hersteller" v-model="software.hersteller">
			</div>
			<div class="col-sm-6">
				<label class="form-label">Verantwortliche</label>
				<input type="text" class="form-control" name="verantwortliche" v-model="software.verantwortliche">
			</div>
			<div class="col-sm-6">
				<label class="form-label">Übergeordnete Software</label>
				<auto-complete
					class="w-100"
					v-model="parentSoftware"
					optionLabel="software_kurzbz_version"
					dropdown
					dropdown-current
					forceSelection
					:suggestions="parentSoftwareSuggestions"
					@complete="getSoftwareByKurzbz">
				</auto-complete>
			</div>
			<div class="col-sm-6">
				<label class="form-label">Ansprechpartner (intern)</label>
				<input type="text" class="form-control" name="ansprechpartner_intern" v-model="software.ansprechpartner_intern">
			</div>
			<div class="col-sm-6">
				<label class="form-label">Ansprechpartner (extern)</label>
				<input type="text" class="form-control" name="ansprechpartner_extern" v-model="software.ansprechpartner_extern">
			</div>
			<div class="col-sm-6">
				<label class="form-label">Beschreibung</label>
				<textarea
					class="form-control"
					name="beschreibung"
					v-model="software.beschreibung"
					rows="3">
				</textarea>
			</div>
			<div class="col-sm-6">
				<label class="form-label">Anmerkung (intern)</label>
				<textarea
					class="form-control"
					name="anmerkung_intern"
					v-model="software.anmerkung_intern"
					rows="3">
				</textarea>
			</div>
			<div class="col-sm-12">
				<label class="form-label">Zugeordnete Images</label>
				<auto-complete
					class="w-100"
					v-model="softwareImages"
					optionLabel="image_bezeichnung"
					dropdown
					dropdown-current
					forceSelection
					multiple
					:suggestions="softwareImageSuggestions"
					@complete="getImagesByBezeichnung">
				</auto-complete>
			</div>
			<!-- Lizenz -->
			<div class="fhc-hr"></div>
		 	<div class="col-sm-4">
				<label class="form-label">Lizenz-Art</label>
				<input type="text" class="form-control" name="lizenzart" v-model="software.lizenzart">
			</div>
			<div class="col-sm-8">
				<label class="form-label">Lizenz-Server Kurzbezeichnung</label>
				<auto-complete
					class="w-100"
					name="lizenzserver_kurzbz"
					v-model="selLizenzserver"
					optionLabel="lizenzserver_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					:suggestions="lizenzserverSuggestions"
					@complete="getLizenzserverByKurzbz">
				</auto-complete>
			</div>
			<div class="col-sm-2">
				<label class="form-label">Lizenz-Anzahl</label>
				<input type="text" class="form-control" name="anzahl_lizenzen" v-model="software.anzahl_lizenzen">
			</div>
			<div class="col-sm-2">
				<label class="form-label">Lizenz-Laufzeit</label>
				<datepicker
					v-model="software.lizenzlaufzeit"
					v-bind:enable-time-picker="false"
					v-bind:placeholder="'TT.MM.YY'"
					v-bind:text-input="true"
					v-bind:auto-apply="true"
					name="verfuegbarkeit_ende"
					locale="de"
					format="dd.MM.yyyy"
					model-type="yyyy-MM-dd">
				</datepicker>
			</div>
			<div class="col-sm-5">
				<label class="form-label">Kostenträger-OE</label>
				<auto-complete
					class="w-100"
					v-model="selKostentraegerOE"
					optionLabel="bezeichnung"
					optionGroupLabel="organisationseinheittyp_kurzbz"
					optionGroupChildren="oes"
					:optionDisabled="option => !option.aktiv"
					dropdown
					dropdown-current
					forceSelection
					:suggestions="oeSuggestions"
					@complete="getOeSuggestions">
				</auto-complete>
			</div>
			<div class="col-sm-3">
				<label class="form-label">Lizenz-Kosten</label>
				<div class="input-group">
					<input type="text" class="form-control" name="lizenzkosten" v-model="software.lizenzkosten">
					<span class="input-group-text">€/Jahr</span>
				</div>
			</div>
		</form>
	</div>
	`
}
