import CoreForm from "../../../../../js/components/Form/Form.js";
import CoreFormInput from "../../../../../js/components/Form/Input.js";
import CoreFormValidation from "../../../../../js/components/Form/Validation.js";
import CoreBsModal from '../../../../../js/components/Bootstrap/Modal.js';

export default {
	components: {
		CoreForm,
		CoreFormInput,
		CoreFormValidation,
		CoreBsModal
	},
	inject: [
		'changeTab'
	],
	emit: [
		'formClosed'
	],
	data() {
		return {
			modalTitel: this.$p.t('global', 'swFuerLvAnfordern'),
			autocompleteAbortController: null,
			lvSuggestions: [],
			swSuggestions: [],
			studiensemester: [],
			selectedStudiensemester: '',
			selectedLvs: [],
			selectedSw: [],
			selectedTemplate: {},
			formData: [],
			requestModus: '' // 'sw' if request by software, 'lv' if request by lv
		};
	},
	watch: {
		selectedSw(){
			this.selectedLvs.length > 0 && this.selectedSw.length > 0
				? this.generateSwLvRows()
				: this.isLvSwRowsVisible = false;

		},
		selectedLvs(){
			this.selectedLvs.length > 0 && this.selectedSw.length > 0
				? this.generateSwLvRows()
				: this.isLvSwRowsVisible = false;
		}
	},
	methods: {
		sendForm() {
			// Reduce postData for backend-needs
			const postData = this.formData
				.filter(item => !item.zuordnungExists)	// Keep only new SW-LV-Zuordnungen, that do not already exist
				.map(({ software_id, lehrveranstaltung_id, studiensemester_kurzbz, lizenzanzahl }) => ({
					software_id,
					lehrveranstaltung_id,
					studiensemester_kurzbz,
					lizenzanzahl
			}));

			// Return if no new SW-LV-Zuordnungen found
			if (postData.length === 0){
				this.$fhcAlert.alertWarning(this.$p.t('global', 'swWurdeBereitsAngefordert'));
				return;
			}

			// Save SW-LV-Zuordnungen
			if (this.$refs.form) {
				let apiUrl = '';
				let payload = {};

				if (this.requestModus === 'tpl') {
					apiUrl = 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/saveSwRequestByTpl';
					payload = {
						postData: postData,
						template: this.selectedTemplate // Additionally add template data
					};
				}
				else {
					apiUrl = 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/saveSwRequestByLvs';
					payload = postData;
				}

				this.$refs.form
					.post(apiUrl, payload)
					.then(result => {
						this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert'));

						let updatedFields = {};
						postData.forEach((pd, index) => {
							const name = 'lizenzanzahl' + index;
							updatedFields[name] = '';

							// Disable updated Lizenzanzahl field
							const formElement = this.$refs.form.$el.querySelector(`[name="${name}"]`);
							if (formElement) {
								formElement.disabled = true;
							}
						});
						this.$refs.form.setFeedback(true, updatedFields);

					})
					.catch(error => this.$fhcAlert.handleSystemError(error));
			}
		},
		openModalLvTemplateToSw(selectedData, selectedStudiensemester) {
			this.requestModus = 'tpl';

			// Reset form
			this.resetForm();

			// Prefill software select with data of table selection
			if (Array.isArray(selectedData)) {
				// Get LV Templates from selected data
				this.selectedTemplate = selectedData.find(data => data.lehrtyp_kurzbz == 'tpl');

				// Get LVs from selected data
				this.selectedLvs = selectedData
					.filter(data => data.lehrtyp_kurzbz != 'tpl')
					.map(data => ({
						'lv_oe_bezeichnung': data.lv_oe_bezeichnung,
						'lehrveranstaltung_id': data.lehrveranstaltung_id,
						'lehrveranstaltung_template_id': data.lehrveranstaltung_template_id,
						'lv_bezeichnung': data.lv_bezeichnung + ' [ ' + data.orgform_kurzbz + ' ]',
						'studiengang_kz': data.studiengang_kz,
						'stg_bezeichnung': data.stg_bezeichnung
					}));
			}

			// Load Studiensemester to populate dropdown
			this.loadAndSetStudiensemester(selectedStudiensemester);

			// Open modal
			this.$refs.modalContainer.show();
		},
		openModalLvToSw(selectedData, selectedStudiensemester) {
			this.requestModus = 'lv';

			// Reset form
			this.resetForm();

			// Prefill software select with data of table selection
			if (Array.isArray(selectedData)) {
				this.selectedLvs = selectedData.map(data => ({
					'lv_oe_bezeichnung': data.lv_oe_bezeichnung,
					'lehrveranstaltung_id': data.lehrveranstaltung_id,
					'lehrveranstaltung_template_id': data.lehrveranstaltung_template_id,
					'lv_bezeichnung': data.lv_bezeichnung + ' [ ' + data.orgform_kurzbz + ' ]',
					'studiengang_kz': data.studiengang_kz,
					'stg_bezeichnung': data.stg_bezeichnung
				}));
			}

			// Load Studiensemester to populate dropdown
			this.loadAndSetStudiensemester(selectedStudiensemester);

			// Open modal
			this.$refs.modalContainer.show();
		},
		openModalSwToLv(selectedData) {
			this.requestModus = 'sw';

			// Reset form
			this.resetForm();

			// Prefill software select with data of table selection
			if (Array.isArray(selectedData)) {
				this.selectedSw = selectedData.map(data => ({
					'software_id': data.software_id,
					'software_kurzbz': data.software_kurzbz
				}));
			}

			// Load studiensemester to populate dropdown
			this.loadAndSetStudiensemester();

			// Open modal
			this.$refs.modalContainer.show();
		},
		loadAndSetStudiensemester(selectedStudiensemester = null){
			this.$fhcApi
				.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getAktAndFutureSemester')
				.then( result => {
					this.studiensemester = result.data;

					this.selectedStudiensemester = selectedStudiensemester !== null
						? selectedStudiensemester
						: this.studiensemester[0].studiensemester_kurzbz
				})
				.catch(error => this.$fhcAlert.handleSystemError(error) );
		},
		onStudiensemesterChange(event){
			// Empty lehrveranstaltungen dropdown
			this.selectedLvs = [];

			// Hide section with SW-LV-Zuordnungen
			this.isLvSwRowsVisible = false;
		},
		searchSw(event) {
			if (event.query || !this.swSuggestions.length) {
				if (this.autocompleteAbortController)
					this.autocompleteAbortController.abort();
				this.autocompleteAbortController = new AbortController();

				this.$fhcApi
					.get(
						'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/autocompleteSwSuggestions/' + encodeURIComponent(event.query),
						null,
						{
							signal: this.autocompleteAbortController.signal
						}
					)
					.then(result => {this.swSuggestions = result.data})
					.catch(error => this.$fhcAlert.handleSystemError(error));
			}
		},
		getSwOptionLabel(sw){
			const version = sw.version ? sw.version : '-';
			return `${sw.software_kurzbz} [Version: ${version}]`;
		},
		searchLv(event) {
			if (event.query || !this.lvSuggestions.length) {
				if (this.autocompleteAbortController)
					this.autocompleteAbortController.abort();
				this.autocompleteAbortController = new AbortController();
				this.$fhcApi
					.get(
						'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/autocompleteLvSuggestionsByStudsem/' + encodeURIComponent(event.query),
						{
							studiensemester_kurzbz: this.selectedStudiensemester
						},
						{
							signal: this.autocompleteAbortController.signal,
						}
					)
					.then(result => {
						let data = result.data;
						let groupedData = {};
						data.forEach(item => {
							const key = item.stg_bezeichnung;

							if (!groupedData[key]) {
								groupedData[key] = {
									stg_bezeichnung: item.stg_bezeichnung,
									lvs: []
								};
							}

							const lv = {
								lehrveranstaltung_id: item.lehrveranstaltung_id,
								lv_bezeichnung: item.lv_bezeichnung + ' [ ' + item.orgform_kurzbz + ' ]',
								lv_oe_kurzbz: item.lv_oe_kurzbz,
								lv_oe_bezeichnung: item.lv_oe_bezeichnung,
								stg_bezeichnung: item.stg_bezeichnung
							};

							groupedData[key].lvs.push(lv);

						})
						this.lvSuggestions = Object.values(groupedData);
					})
					.catch(error => this.$fhcAlert.handleSystemError(error));
			}
		},
		isLvSelected(option){
			// Disable option if lv is selected
			return this.selectedLvs.some(item => item.lehrveranstaltung_id === option.lehrveranstaltung_id);
		},
		isSwSelected(option){
			// Disable option if sw is selected
			return this.selectedSw.some(item => item.software_kurzbz === option.software_kurzbz);
		},
		resetForm(){
			this.formData = [];
			this.selectedStudiensemester = this.studiensemester.length > 0 ? this.studiensemester[0].studiensemester_kurzbz : '';
			this.selectedLvs = [];
			this.selectedSw = [];
			this.selectedTemplate = {};
			this.isLvSwRowsVisible = false;
		},
		generateSwLvRows(){
			// Reset formData
			this.formData = [];

			// Push selected data to formData
			for(const lv of this.selectedLvs){
				for (const sw of this.selectedSw){
					this.formData.push({
						studiensemester_kurzbz: this.selectedStudiensemester,
						lv_oe_bezeichnung: lv.lv_oe_bezeichnung,
						lehrveranstaltung_id: lv.lehrveranstaltung_id,
						lehrveranstaltung_template_id: lv.lehrveranstaltung_template_id,
						lv_bezeichnung: lv.lv_bezeichnung,
						studiengang_kz: lv.studiengang_kz,
						stg_bezeichnung: lv.stg_bezeichnung,
						software_id: sw.software_id,
						software_kurzbz: sw.software_kurzbz,
						lizenzanzahl: 0,  // Default
						zuordnungExists: false, // Default,
						stgOeBerechtigt: true
					})
				}
			}

			// Flag if selection already exists
			this.flagExistingSwLvZuordnungen();

			if (this.requestModus === 'tpl')
			{
				this.flagBerechtigtOnStgOe();
			}

			// Sort formData
			this.sortFormData();

			// Display formData as rows
			this.isLvSwRowsVisible = true;

		},
		flagExistingSwLvZuordnungen(){
			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/checkAndGetExistingSwLvs', this.formData)
				.then( result => {
					if (result.data.length > 0)
					{
						this.formData.forEach(formItem => {
							result.data.forEach(existingItem => {
								// Flag formData where SW-LV Zuordnung already exists
								if (
									formItem.software_id === existingItem.software_id &&
									formItem.lehrveranstaltung_id === existingItem.lehrveranstaltung_id &&
									formItem.studiensemester_kurzbz === existingItem.studiensemester_kurzbz
								) {
									formItem.lizenzanzahl = existingItem.lizenzanzahl
									formItem.zuordnungExists = true;
								}
							});
						});
					}
				})
				.catch(error => this.$fhcAlert.handleSystemError(error) );
		},
		flagBerechtigtOnStgOe(){
			let postData = {
				studiensemester_kurzbz: this.selectedStudiensemester,
				lv_ids: this.formData.map(fd => fd.lehrveranstaltung_id)
			}

			this.$fhcApi
				.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getLvsByStgOe', postData)
				.then( result => result.data)
				.then (data =>
				{
					this.formData.forEach(fd => {
						const match = data.find(item => item.studiengang_kz === fd.studiengang_kz);

						if (!match) {
							fd.stgOeBerechtigt = false;
						}
					});
				})
				.catch(error => this.$fhcAlert.handleSystemError(error) );
		},
		sortFormData(){
			this.formData.sort((a, b) => {

				// Sort by zuordnungExists first
				if (a.zuordnungExists !== b.zuordnungExists) {
					return a.zuordnungExists ? -1 : 1;
				}

				// Sort by software_kurzbz second (case insensitive)
				const softwareA = a.software_kurzbz.toUpperCase();
				const softwareB = b.software_kurzbz.toUpperCase();
				if (softwareA < softwareB) return -1;
				if (softwareA > softwareB) return 1;

				// Sort by stgOeBerechtigt third (false should be last)
				if (a.stgOeBerechtigt !== b.stgOeBerechtigt) {
					return a.stgOeBerechtigt === false ? -1 : 1;
				}

				return 0; // In case all comparisons are equal
			});
		},
		onClickChangeTab(tab){
			this.$refs.modalContainer.hide();
			this.changeTab(tab);
		}
	},
	template: `
	<div class="app-example-form-1">
		<core-form ref="form" @submit.prevent="sendForm">
			<core-bs-modal ref="modalContainer" class="bootstrap-prompt" dialog-class="modal-fullscreen" @hidden-bs-modal="$emit('formClosed')">
				<template #title>{{ modalTitel }}</template>
				<template #default>
					<!-- Formular -->
					<core-form-validation></core-form-validation>
					<div class="row">
						<div class="col-2 mb-3">
							<core-form-input
								type="select"
								v-model="selectedStudiensemester"
								name="studiensemester"
								:label="$p.t('lehre', 'studiensemester')"
								:disabled="requestModus === 'lv' || requestModus === 'tpl'"
								@change="onStudiensemesterChange">
								<option 
								v-for="(studSem, index) in studiensemester"
								:key="index" 
								:value="studSem.studiensemester_kurzbz">
									{{studSem.studiensemester_kurzbz}}
								</option>
							</core-form-input>
						</div>
						<div class="col-2 mb-3 align-self-start" v-if="requestModus == 'tpl'">
						 	<core-form-input
								v-model="selectedTemplate.lv_bezeichnung"
								name="selectedTemplate"
								:label="$p.t('global/standardLvTemplate')"
								readonly
								>
							</core-form-input>
						</div>
						<div class="col-8 mb-3">
							<core-form-input
								type="autocomplete"
								v-model="selectedLvs"
								name="selectedLvs"
								label="Lehrveranstaltungen *"
								option-group-label="stg_bezeichnung"
								option-group-children="lvs"
								option-label="lv_bezeichnung"
								:option-disabled="isLvSelected"
								dropdown
								multiple
								:suggestions="lvSuggestions"
								:disabled="requestModus == 'tpl'"
								@complete="searchLv">
							</core-form-input>
						</div>
						<div class="col-12 mb-3">
							<core-form-input
								type="autocomplete"
								v-model="selectedSw"
								name="selectedSw"
								label="Software *"
								:option-label="getSwOptionLabel"
								:option-disabled="isSwSelected"
								dropdown
								multiple
								@complete="searchSw"
								:suggestions="swSuggestions">
							</core-form-input>
							<div v-show="requestModus === 'lv' || requestModus === 'tpl'">
								<a class="link-secondary" href="#" @click="onClickChangeTab('softwareanforderungNachSw')">
									<small>SW nicht gefunden? Über 'Anforderung nach Software' suchen</small>
								</a>
							</div>
						</div>
					</div>
					<div class="fhc-hr mt-n-3" v-if="isLvSwRowsVisible"></div>
					<!-- // NOTE: Keep in case of later necessity. -->
					<!--<div class="row-col" v-if="isLvSwRowsVisible && requestModus == 'tpl'">
						<div class="alert alert-info" role="alert">
							Bitte geben Sie die User-Anzahl an; für Lehrveranstaltungen außerhalb Ihres Kompetenzbereichs wird die User-Anzahl auf 0 gesetzt, und die Softwarebeauftragten werden informiert, um diese anzupassen.	
						</div>
					</div>-->
					<div class="row" v-if="isLvSwRowsVisible" v-for="(fd, index) in formData" :key="index">
							<div class="col-2 mb-2">
								<core-form-input
									v-model="fd.stg_bezeichnung"
									name="stg_bezeichnung"
									:label="index === 0 ? $p.t('lehre', 'studiengang') : ''"
									class="form-control-sm"
									readonly>
								</core-form-input>
								<!--<div class="form-text text-danger" v-if="!fd.stgOeBerechtigt">{{ $p.t('ui/nurLeseberechtigung') }}</div>-->
								<div class="form-text text-primary" v-if="!fd.stgOeBerechtigt">
									 <i class="fa fa-info-circle" aria-hidden="true"></i>
									 STG anderer Fakultät
								 </div>
							</div>
							<div class="col-4 mb-2">
								<core-form-input
									v-model="fd.lv_bezeichnung"
									name="lv_bezeichnung"
									:label="index === 0 ? $p.t('lehre', 'lehrveranstaltung') : ''"
									class="form-control-sm"
									readonly>
								</core-form-input>
							</div>
							<div class="col-4 mb-2">
								<core-form-input
									v-model="fd.software_kurzbz"
									name="software_kurzbz"
									:label="index === 0 ? 'Software' : ''"
									class="form-control-sm"
									readonly>
								</core-form-input>
							</div>
							<div class="col-2 mb-2">
							<!-- // NOTE: Keep and change below in case of later necessity. -->
							<!--:disabled="fd.zuordnungExists || !fd.stgOeBerechtigt"-->
							<core-form-input
								type="number"
								v-model="fd.lizenzanzahl"
								:name="'lizenzanzahl' + index"
								class="form-control-sm"
								:label="index === 0 ? $p.t('global', 'userAnzahl') : ''"
								:disabled="fd.zuordnungExists"
								:tabindex="index + 1">
							</core-form-input>
							<div class="form-text text-danger" v-if="fd.zuordnungExists">{{ $p.t('global/bereitsAngefordert') }}</div>
						</div>
					</div>
				</template>
				<template #footer>
					<button type="button" class="btn btn-primary" 
						:disabled="!isLvSwRowsVisible" 
						@click="sendForm">
						{{ $p.t('global', 'swFuerLvAnfordern') }}
					</button>
				</template>
			</core-bs-modal>
		</core-form>
	</div>`
}