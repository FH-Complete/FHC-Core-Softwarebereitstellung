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
			if (this.$refs.form)
				this.$refs.form
					.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/saveSoftwareLv', postData)
					.then(result => {
						this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert'));
						this.requestModus == 'sw' ? this.resetFormButKeepSelectedSw() : this.resetFormButKeepSelectedLv();
					})
					.catch(this.$fhcAlert.handleSystemError);
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
					'lv_bezeichnung': data.lv_bezeichnung
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
				.catch( this.$fhcAlert.handleSystemError );
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
					.catch(this.$fhcAlert.handleSystemError);
			}
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
							const key = item.lv_oe_bezeichnung;

							if (!groupedData[key]) {
								groupedData[key] = {
									stg_bezeichnung: item.stg_bezeichnung,
									lvs: []
								};
							}

							const lv = {
								lehrveranstaltung_id: item.lehrveranstaltung_id,
								lv_bezeichnung: item.lv_bezeichnung,
								lv_oe_kurzbz: item.lv_oe_kurzbz,
								lv_oe_bezeichnung: item.lv_oe_bezeichnung
							};

							groupedData[key].lvs.push(lv);

						})
						this.lvSuggestions = Object.values(groupedData);
					})
					.catch(this.$fhcAlert.handleSystemError);
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
			this.isLvSwRowsVisible = false;
		},
		resetFormButKeepSelectedSw(){
			this.formData = [];
			this.selectedLvs = [];
			this.isLvSwRowsVisible = false;
		},
		resetFormButKeepSelectedLv(){
			this.formData = [];
			this.selectedSw = [];
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
						lv_bezeichnung: lv.lv_bezeichnung,
						software_id: sw.software_id,
						software_kurzbz: sw.software_kurzbz,
						lizenzanzahl: 0,  // Default
						zuordnungExists: false // Default
					})
				}
			}

			// Flag if selection already exists
			this.flagExistingSwLvZuordnungen(this.formData);

			// Display formData as rows
			this.isLvSwRowsVisible = true;

		},
		flagExistingSwLvZuordnungen(){
			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/checkAndGetExistingSwLvZuordnungen', this.formData)
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
				.catch( this.$fhcAlert.handleSystemError );
		},
		onClickChangeTab(tab){
			this.$refs.modalContainer.hide();
			this.changeTab(tab);
		}
	},
	template: `
	<div class="app-example-form-1">
		<core-form ref="form" @submit.prevent="sendForm">
			<core-bs-modal ref="modalContainer" class="bootstrap-prompt" dialog-class="modal-xl" @hidden-bs-modal="$emit('formClosed')">
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
								:disabled="requestModus === 'lv'"
								@change="onStudiensemesterChange">
								<option 
								v-for="(studSem, index) in studiensemester"
								:key="index" 
								:value="studSem.studiensemester_kurzbz">
									{{studSem.studiensemester_kurzbz}}
								</option>
							</core-form-input>
						</div>
						<div class="col-10 mb-3">
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
								@complete="searchLv">
							</core-form-input>
						</div>
						<div class="col-12 mb-3">
							<core-form-input
								type="autocomplete"
								v-model="selectedSw"
								name="selectedSw"
								label="Software *"
								option-label="software_kurzbz"
								:option-disabled="isSwSelected"
								dropdown
								multiple
								@complete="searchSw"
								:suggestions="swSuggestions">
							</core-form-input>
							<div class="form-text" v-show="requestModus === 'lv'">
								<a class="link link-secondary"  @click="onClickChangeTab('softwareanforderungNachSw')">
									<small>SW nicht gefunden? Über 'Anforderung nach Software' suchen</small>
								</a>
							</div>
						</div>
					</div>
					<div class="fhc-hr mt-n-3" v-if="isLvSwRowsVisible"></div>
					<div class="row" v-if="isLvSwRowsVisible" v-for="(fd, index) in formData" :key="index">
							<div class="col-2 mb-2">
								<core-form-input
									v-model="fd.lv_oe_bezeichnung"
									name="lv_oe_bezeichnung"
									:label="$p.t('lehre', 'organisationseinheit')"
									class="form-control-sm"
									readonly>
								</core-form-input>
							</div>
							<div class="col-4 mb-2">
								<core-form-input
									v-model="fd.lv_bezeichnung"
									name="lv_bezeichnung"
									:label="$p.t('lehre', 'lehrveranstaltung')"
									class="form-control-sm"
									readonly>
								</core-form-input>
							</div>
							<div class="col-4 mb-2">
								<core-form-input
									v-model="fd.software_kurzbz"
									name="software_kurzbz"
									label="Software"
									class="form-control-sm"
									readonly>
								</core-form-input>
							</div>
							<div class="col-2 mb-2">
							<core-form-input
								type="number"
								v-model="fd.lizenzanzahl"
								name="lizenzanzahl"
								class="form-control-sm"
								:label="$p.t('global', 'lizenzAnzahl')"
								:disabled="fd.zuordnungExists">
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