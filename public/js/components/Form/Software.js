import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import CoreForm from '../../../../../js/components/Form/Form.js';
import CoreFormInput from '../../../../../js/components/Form/Input.js';
import CoreFormValidation from '../../../../../js/components/Form/Validation.js';

export const SoftwareForm = {
	components: {
		AutoComplete: primevue.autocomplete,
		"datepicker": VueDatePicker,
		CoreForm,
		CoreFormInput,
		CoreFormValidation
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
			softwarelizenztypen: {},
			softwarelizenzkategorien: {},
			parentSoftwareSuggestions: [], // autocomplete suggestions
			parentSoftware: null, // selected autocomplete value
			softwareImageSuggestions: [], // autocomplete suggestions
			softwareImages: [], // selected autocomplete values
			lizenzserverSuggestions: [], // autocomplete suggestions
			selLizenzserver: null,	// selected autocomplete values
			oeSuggestions: [], // autocomplete suggestions
			selKostentraegerOE: null,	// selected autocomplete values
			studienjahre: [],
			selStudienjahr: null,
			lizenzenSumAndPercentageShareByOeAndStudienjahr: [],
			lizenzenSumByStudienjahr: ''
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
			'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareMetadata', null)
			.then(result => result.data)
			.then(
			result => {
				// display errors
				if (CoreRESTClient.isError(result))
				{
					this.$fhcAlert.handleSystemMessage(result.retval);
				}
				else
				{
					this.softwareMetadata = CoreRESTClient.getData(result);
				}
			}
		).catch(error => this.$fhcAlert.handleSystemError(error));

		// Get Softwarelizenztypen
		CoreRESTClient
			.get('/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwarelizenztypen')
			.then(result => result.data)
			.then(result => {
				this.softwarelizenztypen = CoreRESTClient.hasData(result) ? CoreRESTClient.getData(result) : {};
			})
			.catch(error => { this.$fhcAlert.handleSystemError(error); });

		// Get Softwarelizenzkategorien
		CoreRESTClient
			.get('/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwarelizenzkategorien')
			.then(result => result.data)
			.then(result => {
				this.softwarelizenzkategorien = CoreRESTClient.hasData(result) ? CoreRESTClient.getData(result) : {};
			})
			.catch(error => { this.$fhcAlert.handleSystemError(error); });
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
				anzahl_lizenzen: 0
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
							this.$fhcAlert.alertWarning(CoreRESTClient.getError(result.data));
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
				).catch(error => this.$fhcAlert.handleSystemError(error));

				// Get last softwarestatus data
				CoreRESTClient.get(
					'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getLastSoftwarestatus',
					{
						software_id: software_id
					})
					.then(result => result.data)
					.then(result => {this.softwarestatus = CoreRESTClient.getData(result);})
					.catch(error => { this.$fhcAlert.handleSystemError(error); });

				// Get images of software
				CoreRESTClient.get(
					'/extensions/FHC-Core-Softwarebereitstellung/components/Image/getImagesBySoftware',
					{
						software_id: software_id
					})
					.then(result => result.data)
					.then(result => {
						if (CoreRESTClient.isError(result))
						{
							this.$fhcAlert.alertWarning(CoreRESTClient.getError(result));
						}
						else if(CoreRESTClient.hasData(result))
						{
							this.softwareImages = CoreRESTClient.getData(result);
						}
					}
				).catch(error => this.$fhcAlert.handleSystemError(error));

				// Get Studienjahre for Dropdown
				this.$api
					.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Software/getStudienjahre')
					.then(result => this.studienjahre = result.data )
					.catch(error => this.$fhcAlert.handleSystemError(error) );

				// Get current Studienjahr
				this.$api
					.get('api/frontend/v1/organisation/Studienjahr/getNext')
					.then(result => this.selStudienjahr = result.data.studienjahr_kurzbz)
					.then(() => this.getSwLizenzenSumAndPercentageShareByOeAndStudienjahr(
						this.softwareId,
						this.selStudienjahr
					))
					.catch(error => this.$fhcAlert.handleSystemError(error) );
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
				if (this.$refs.softwareForm)
					this.$refs.softwareForm
						.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Software/' + method, {
							software: this.extendedSoftware,
							softwarestatus: this.softwarestatus,
							softwareImageIds: [...new Set(this.softwareImages.map(softwareImage => softwareImage.softwareimage_id))]
						})
						.then(result => {
							if (result.data.parentArray !== undefined)
							{
								if (result.data.parentArray.length > 0)
								{
									// Sticky success msg
									this.$fhcAlert.alertDefault('success', 'Info', this.$p.t('global/gespeichert'), true);

									// Sticky info msg
									this.$fhcAlert.alertDefault(
										'info',
										this.$p.t('global/statusErfolgreichUebertragen'),
										this.$p.t('global/statusUebertragenMsg', {
											status: this.softwarestatus.softwarestatus_kurzbz,
											parentSoftware: result.data.parentArray.join(', ')
										}),
										true
									);
								}
							}
							else
							{
								this.$fhcAlert.alertSuccess(this.$p.t('global/gespeichert'));
							}
							this.$emit("softwareFormSaved");
						})
						.catch(error => this.$fhcAlert.handleSystemError(error));
			}
		},
		resetSoftware(){
			this.$refs.softwareForm.clearValidation();
			this.softwareId = null;
			this.software = this.getDefaultSoftware();
			this.softwarestatus = this.getDefaultSoftwarestatus();
			this.parentSoftware = null;
			this.softwareImages = [];
			this.selLizenzserver = null;
			this.selKostentraegerOE = null;
			this.selStudienjahr = null;
			this.lizenzenSumAndPercentageShareByOeAndStudienjahr = [],
			this.lizenzenSumByStudienjahr = ''
		},
		getSoftwareByKurzbz(event) {
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareByKurzbz',
				{
					software_kurzbz: event.query
				})
				.then(result => result.data)
				.then(result => {
					// display errors
					if (CoreRESTClient.isError(result))
					{
						this.$fhcAlert.alertWarning(CoreRESTClient.getError(result));
					}
					else
					{
						let softwareList = CoreRESTClient.hasData(result) ? CoreRESTClient.getData(result) : [];

						// set software_kurzbz_version for display of kurzbz and version in autocomple field
						for (let sw of softwareList) {
							sw.software_kurzbz_version = sw.version != null ? sw.software_kurzbz+' (version: '+sw.version+')' : sw.software_kurzbz;
						}
						this.parentSoftwareSuggestions = softwareList;
					}
				}
			).catch(error => this.$fhcAlert.handleSystemError(error));
		},
		getOeSuggestions(event) {
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getOeSuggestions',
				{
					eventQuery: event.query
				})
				.then(result => result.data)
				.then(result => {
					// display errors
					if (CoreRESTClient.isError(result))
					{
						this.$fhcAlert.alertWarning(CoreRESTClient.getError(result));
					}
					else
					{
						let data = CoreRESTClient.getData(result);

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
			).catch(error => this.$fhcAlert.handleSystemError(error));
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
						this.$fhcAlert.alertWarning(CoreRESTClient.getError(result.data));
					}
					else
					{
						this.softwareImageSuggestions = CoreRESTClient.getData(result.data);
					}
				}
			).catch(error => this.$fhcAlert.handleSystemError(error));
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
						this.$fhcAlert.alertWarning(CoreRESTClient.getError(result.data));
					}
					else
					{
						this.lizenzserverSuggestions = CoreRESTClient.getData(result.data);
					}
				}
			).catch(error => this.$fhcAlert.handleSystemError(error));
		},
		onChangeStudienjahr(){
			this.getSwLizenzenSumAndPercentageShareByOeAndStudienjahr(this.softwareId, this.selStudienjahr);
		},
		getSwLizenzenSumAndPercentageShareByOeAndStudienjahr(software_id, studienjahr_kurzbz) {
			this.$api
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Software/getSwLizenzenSumAndPercentageShareByOeAndStudienjahr', {
					software_id: software_id,
					studienjahr_kurzbz: studienjahr_kurzbz
				})
				.then( result => {
					this.lizenzenSumAndPercentageShareByOeAndStudienjahr = result.data;
					this.lizenzenSumByStudienjahr =
						this.lizenzenSumAndPercentageShareByOeAndStudienjahr.reduce((totalSum, item) =>
							totalSum + item.sum_lizenzen, 0
						);
					this.lizenzenSumByStudienjahr = this.lizenzenSumByStudienjahr === 0 ? '' : this.lizenzenSumByStudienjahr;
				})
				.catch(error => this.$fhcAlert.handleSystemError(error) );

		},
		setLizenzanzahl(){
			this.software.anzahl_lizenzen = this.lizenzenSumByStudienjahr;
		},
		onChangeLizenzart(){
			if (this.software.lizenzart === 'opensource')
			{
				this.software.anzahl_lizenzen = 0;
				this.selKostentraegerOE = null;
				this.software.lizenzkosten = null;
				this.software.lizenzkategorie_kurzbz = 'opensource';
			}
			else {
				if (this.software.lizenzkategorie_kurzbz === 'opensource') {
					this.software.lizenzkategorie_kurzbz = '';
				}
			}
		},
		onChangeLizenzkategorie(e){
	 		if (e.target.value === 'opensource'){
				this.software.anzahl_lizenzen = 0;
				this.selKostentraegerOE = null;
				this.software.lizenzkosten = null;
				this.software.lizenzart = 'opensource';
			}
		 	else {
				 if (this.software.lizenzart === 'opensource'){
					 this.software.lizenzart = '';
				 }
			}
		}
	},
	template: `
	<div>
		<core-form ref="softwareForm" class="row gy-3">
			<core-form-validation></core-form-validation>
			<div class="col-sm-3">
				<core-form-input
					type="select"
					v-model="software.softwaretyp_kurzbz"
					name="softwaretyp_kurzbz"
					:label="$p.t('global/softwaretyp')"
					>
					<option v-for="(bezeichnung, softwaretyp_kurzbz) in softwareMetadata.softwaretyp" :key="index" :value="softwaretyp_kurzbz">
						{{bezeichnung}}
					</option>
				</core-form-input>		
			</div>
			<div class="col-sm-5">
				<core-form-input
					v-model="software.software_kurzbz"
					name="software_kurzbz"
					:label="$p.t('global/softwareKurzbz')"
				>
				</core-form-input>
			</div>
			<div class="col-sm-4">
				<core-form-input
					type="select"
					v-model="softwarestatus.softwarestatus_kurzbz"
					name="softwarestatus_kurzbz"
					label="Softwarestatus *"
					>
					<option v-for="(bezeichnung, softwarestatus_kurzbz) in softwareMetadata.softwarestatus" :key="index" :value="softwarestatus_kurzbz">
						{{bezeichnung}}
					</option>
				</core-form-input>
			</div>
			<div class="col-sm-1">
				<core-form-input
					v-model="software.version"
					name="version"
					label="Version"
				>
				</core-form-input>
			</div>
			<div class="col-sm-5">
				<core-form-input
					v-model="software.os"
					name="os"
					:label="$p.t('global/betriebssystem')"
				>
				</core-form-input>
			</div>
			<div class="col-sm-6">
				<core-form-input
					v-model="software.hersteller"
					name="hersteller"
					:label="$p.t('global/hersteller')"
				>
				</core-form-input>
			</div>
			<div class="col-sm-6">
				<core-form-input
					v-model="software.verantwortliche"
					name="verantwortliche"
					:label="$p.t('global/verantwortliche')"
				>
				</core-form-input>
			</div>
			<div class="col-sm-6">
				<core-form-input
					type="autocomplete"
					v-model="parentSoftware"
					name="parentSoftware"
					:label="$p.t('global/uebergeordneteSoftware')"
					option-label="software_kurzbz_version"
					dropdown
					dropdown-current
					forceSelection
					:suggestions="parentSoftwareSuggestions"
					@complete="getSoftwareByKurzbz"
				>
				</core-form-input>
			</div>
			<div class="col-sm-6">
				<core-form-input
					v-model="software.ansprechpartner_intern"
					name="ansprechpartner_intern"
					:label="$p.t('global/ansprechpartnerIntern')"
				>
				</core-form-input>
			</div>
			<div class="col-sm-6">
				<core-form-input
					v-model="software.ansprechpartner_extern"
					name="ansprechpartner_extern"
					:label="$p.t('global/ansprechpartnerExtern')"
				>
				</core-form-input>
			</div>
			<div class="col-sm-6">
				<core-form-input
					type="textarea"
					v-model="software.beschreibung"
					name="beschreibung"
					:label="$p.t('global/beschreibung')"
					rows="3"
				>
				</core-form-input>
			</div>
			<div class="col-sm-6">
				<core-form-input
					type="textarea"
					v-model="software.anmerkung_intern"
					name="anmerkung_intern"
					:label="$p.t('global/anmerkungIntern')"
					rows="3"
				>
				</core-form-input>
			</div>
			<div class="col-sm-12">
				<core-form-input
					type="autocomplete"
					v-model="softwareImages"
					name="softwareImages"
					:label="$p.t('global/zugeordneteImages')"
					option-label="image_bezeichnung"
					dropdown
					dropdown-current
					forceSelection
					multiple
					:suggestions="softwareImageSuggestions"
					@complete="getImagesByBezeichnung"
				>
				</core-form-input>
			</div>
			<div class="col-sm-4">
		 		<core-form-input
		 			type="select"
					v-model="software.lizenzkategorie_kurzbz"
					name="lizenzkategorie_kurzbz"
					:label="$p.t('global/lizenzkategorie')"
					@change="onChangeLizenzkategorie"
				>
				<option v-for="softwarelizenzkategorie in softwarelizenzkategorien" 
					:key="softwarelizenzkategorie.lizenzkategorie_kurzbz"
					:value="softwarelizenzkategorie.lizenzkategorie_kurzbz">
					{{ softwarelizenzkategorie.bezeichnung }}
				</option>
				</core-form-input>
			</div>
		 	<div class="col-sm-3">
		 		<core-form-input
		 			type="select"
					v-model="software.lizenzart"
					name="lizenzart"
					:label="$p.t('global/lizenzart')"
					@change="onChangeLizenzart"
				>
				<option v-for="softwarelizenztyp in softwarelizenztypen" 
					:key="softwarelizenztyp.softwarelizenztyp_kurzbz"
					:value="softwarelizenztyp.softwarelizenztyp_kurzbz">
					{{ softwarelizenztyp.bezeichnung }}
				</option>
				</core-form-input>
			</div>
			<div class="col-sm-3">
				<core-form-input
					type="autocomplete"
					v-model="selLizenzserver"
					name="lizenzserver_kurzbz"
					:label="$p.t('global/lizenzserverKurzbz')"
					option-label="lizenzserver_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					:suggestions="lizenzserverSuggestions"
					@complete="getLizenzserverByKurzbz"
				>
				</core-form-input>
			</div>
			<div class="col-sm-2">
				<core-form-input
					v-model="software.lizenzserver_port"
					name="lizenzserver_port"
					:label="$p.t('global/lizenzserverPort')"
					>
				</core-form-input>
			</div>
			<div class="col-sm-2">
				<label class="form-label">{{ $p.t('global/lizenzAnzahl') }}</label>
				<div class="input-group">
					<core-form-input
						type="number"
						v-model="software.anzahl_lizenzen"
						name="anzahl_lizenzen"
						input-group
						:disabled="software.lizenzart === 'opensource'"
						>
					</core-form-input>
				</div>
			</div>
			<div class="col-sm-2">
				<core-form-input
					type="datepicker"
					v-model="software.lizenzlaufzeit"
					name="verfuegbarkeit_ende"
					:label="$p.t('global/lizenzLaufzeit')"
					locale="de"
					format="dd.MM.yyyy"
					model-type="yyyy-MM-dd"
					:enable-time-picker="false"
					:placeholder="'TT.MM.YY'"
					:text-input="true"
					:auto-apply="true"
					>
				</core-form-input>
			</div>
			<div class="col-sm-5">
				<core-form-input
					type="autocomplete"
					v-model="selKostentraegerOE"
					name="selKostentraegerOE"
					:label="$p.t('global/kostentraegerOe')"
					option-label="bezeichnung"
					option-group-label="organisationseinheittyp_kurzbz"
					option-group-children="oes"
					:optionDisabled="option => !option.aktiv"
					dropdown
					dropdown-current
					forceSelection
					:disabled="software.lizenzart === 'opensource'"
					:suggestions="oeSuggestions"
					@complete="getOeSuggestions"
				>
				</core-form-input>
			</div>
			<div class="col-sm-3">
				<label class="form-label">{{ $p.t('global/lizenzKosten') }}</label>
				<div class="input-group">
					<core-form-input
						v-model="software.lizenzkosten"
						name="lizenzkosten"
						placeholder="0.00"
						input-group
						:disabled="software.lizenzart === 'opensource'"
					>
					</core-form-input>
					<span class="input-group-text">{{ $p.t('global/euroProJahr') }}</span>
				</div>
			</div>
			<div :hidden="typeof(softwareId) === 'undefined'">
				<div class="fhc-hr"></div>
				<div class="row d-flex mb-3">
					<div class="col-8 align-self-center"><span class="h6">Useranzahl-Aufschlüsselung nach Anforderung pro Organisationseinheit {{ selStudienjahr }}</span></div>
					<div class="col-2 ms-auto">
						<label class="form-label">{{ $p.t('global/userAnzahl') }} Total</label>
						<div class="input-group">			
							<core-form-input
								v-model="lizenzenSumByStudienjahr"
								input-group
								readonly
								>
							</core-form-input>
							<button class="btn btn-secondary" type="button" @click="setLizenzanzahl" :disabled="lizenzenSumByStudienjahr === '' || software.lizenzart === 'opensource'"
							 data-bs-toggle="tooltip" title="In SW Lizenz-Anzahl übernehmen">
								<small><i class="fa fa-angles-up"></i></small>
							</button>
							<span class="text-muted" v-show="lizenzenSumByStudienjahr === ''"><small>Noch keine Anforderung</small></span>
						</div>
					</div>
					<div class="col-2 ms-auto">
						<core-form-input
							type="select"
							v-model="selStudienjahr"
							name="studienjahre"
							:label="$p.t('lehre/studienjahr')"
							@change="onChangeStudienjahr">
							<option 
								v-for="(studJahr, index) in studienjahre"
								:key="index" 
								:value="studJahr.studienjahr_kurzbz">
								{{ studJahr.studienjahr_kurzbz }}
							</option>
						</core-form-input>
					</div>
				</div>
				<div class="row mb-2" v-for="(item, index) in lizenzenSumAndPercentageShareByOeAndStudienjahr" :key="index">
					<div class="col-sm-3">
						<core-form-input
							v-model="item.studiensemester_kurzbz"
							:label="index === 0 ? $p.t('lehre/studiensemester') : ''"
							class="form-control-sm"
							readonly
							>
						</core-form-input>
					</div>
					<div class="col-sm-5">
						<core-form-input
							v-model="item.lv_oe_bezeichnung"
							:label="index === 0 ? $p.t('global/kostentraegerOe') : ''"
							class="form-control-sm"
							readonly
							>
						</core-form-input>
					</div>
					<div class="col-sm-2">
						<core-form-input
							v-model="item.sum_lizenzen"
							:label="index === 0 ? $p.t('global/userAnzahl') + '/OE' : ''"
							class="form-control-sm"
							readonly
							>
						</core-form-input>
					</div>
					<div class="col-sm-2">
						<core-form-input
							v-model="item.percentage_share"
							:label="index === 0 ? $p.t('global/anteiligInProzent') : ''"
							class="form-control-sm"
							readonly
							>
						</core-form-input>
					</div>
				</div>
			</div>
			</div>
		</form>
	</div>
	`
}
