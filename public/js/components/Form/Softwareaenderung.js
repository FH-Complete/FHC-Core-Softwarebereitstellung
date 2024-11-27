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
	emit: [
		'onSaved'
	],
	data() {
		return {
			modalTitel: this.$p.t('global', 'swFuerLvAendern'),
			autocompleteAbortController: null,
			swSuggestions: [],
			studiensemester: [],
			selectedStudiensemester: '',
			selectedRow: {},
			selectedLvs: [],
			selectedSw: {},
			selectedTemplate: {},
			requestModus: '', // if Aenderung for Quellkurs, then set to 'tpl',
			errorMsg: null
		};
	},
	methods: {
		updateSwLvs() {

			// Return if no SW is selected
			this.errorMsg = null;
			if (this.selectedSw === null) return this.errorMsg = this.$p.t('global', 'softwareAuswaehlen');

			// Prepare data for backend
			const postData = {
				...this.selectedRow,
				...this.selectedSw,
				studiensemester_kurzbz: this.selectedStudiensemester
			};

			// Update Software
			if (this.$refs.form) {
				let apiUrl = 'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/updateSwLvs';

				this.$refs.form
					.post(apiUrl, postData)
					.then(result => {
						this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert'));
						this.$emit('onSaved');
					})
					.catch(error => this.$fhcAlert.handleSystemError(error));
			}
		},
		openModalUpdateSwByLv(selectedRow, selectedStudiensemester) {
			this.resetForm();

			// Store selected row data
			this.selectedRow = {
				'software_lv_id': selectedRow.software_lv_id,
				'lv_oe_bezeichnung': selectedRow.lv_oe_bezeichnung,
				'lehrveranstaltung_id': selectedRow.lehrveranstaltung_id,
				'lehrveranstaltung_template_id': selectedRow.lehrveranstaltung_template_id,
				'lv_bezeichnung': selectedRow.lv_bezeichnung + ' [ ' + selectedRow.orgform_kurzbz + ' ]',
				'studiengang_kz': selectedRow.studiengang_kz,
				'stg_bezeichnung': selectedRow.stg_bezeichnung
			};

			// Prefill Lehrveranstaltung with selected row data
			this.selectedLvs = [this.selectedRow]; // must be array for autoselect

			// Prefill software with selected row data
			this.selectedSw = {
				'software_id': selectedRow.software_id,
				'software_kurzbz': selectedRow.software_kurzbz
			};

			// Load Studiensemester to populate dropdown
			this.loadAndSetStudiensemester(selectedStudiensemester);

			// Open modal
			this.$refs.modalContainer.show();
		},
		openModalUpdateSwByTemplate(selectedRow, selectedStudiensemester) {
			this.resetForm();

			this.requestModus = 'tpl';

			// Get LV Template from selected row
			this.selectedTemplate = selectedRow;

			// Store selected row data
			this.selectedRow = {
				'software_lv_id': selectedRow.software_lv_id,
				'lv_oe_bezeichnung': selectedRow.lv_oe_bezeichnung,
				'lehrveranstaltung_id': selectedRow.lehrveranstaltung_id,
				'lehrveranstaltung_template_id': selectedRow.lehrveranstaltung_template_id,
				'lv_bezeichnung': selectedRow.lv_bezeichnung + ' [ ' + selectedRow.orgform_kurzbz + ' ]',
				'studiengang_kz': selectedRow.studiengang_kz,
				'stg_bezeichnung': selectedRow.stg_bezeichnung
			};

			// Prefill Lehrveranstaltungen dropdown
			if (Array.isArray(selectedRow._children) && selectedRow._children.length > 0)
			{
				this.selectedLvs = selectedRow._children.map(data => ({
					'software_lv_id': selectedRow.software_lv_id,
					'lv_oe_bezeichnung': data.lv_oe_bezeichnung,
					'lehrveranstaltung_id': data.lehrveranstaltung_id,
					'lehrveranstaltung_template_id': data.lehrveranstaltung_template_id,
					'lv_bezeichnung': data.lv_bezeichnung + ' [ ' + data.orgform_kurzbz + ' ]',
					'studiengang_kz': data.studiengang_kz,
					'stg_bezeichnung': data.stg_bezeichnung
				}));
			}

			// Prefill software dropdown
			this.selectedSw = {
				'software_id': selectedRow.software_id,
				'software_kurzbz': selectedRow.software_kurzbz
			};

			// Load Studiensemester to populate dropdown
			this.loadAndSetStudiensemester(selectedStudiensemester);

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
		resetForm(){
			this.$refs.form.clearValidation();
			this.selectedStudiensemester = this.studiensemester.length > 0 ? this.studiensemester[0].studiensemester_kurzbz : '';
			this.selectedRow = {};
			this.selectedLvs = [];
			this.selectedSw = {};
			this.selectedTemplate = {};
			this.requestModus = '';
			this.errorMsg = null;
		}
	},
	template: `
	<div class="app-example-form-1">
		<core-form ref="form" @submit.prevent="sendForm">
			<core-bs-modal ref="modalContainer" dialog-class="modal-xl" class="bootstrap-prompt" @hidden-bs-modal="$emit('formClosed')">
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
								disabled>
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
								readonly>
							</core-form-input>
						</div>
						<div class="col-8 mb-3">
							<core-form-input
								type="autocomplete"
								v-model="selectedLvs"
								name="selectedLvs"
								label="Lehrveranstaltungen"
								option-group-label="stg_bezeichnung"
								option-group-children="lvs"
								option-label="lv_bezeichnung"
								dropdown
								multiple
								disabled>
							</core-form-input>
						</div>
						<div class="col-12 mb-3">
							<core-form-input
								type="autocomplete"
								v-model="selectedSw"
								name="selectedSw"
								label="Software *"
								option-label="software_kurzbz"
								dropdown
								forceSelection
								required
								@complete="searchSw"
								:suggestions="swSuggestions">
							</core-form-input>
							<div class="form-text text-danger" v-if="errorMsg">{{ errorMsg }}</div>						</div>
				</template>
				<template #footer>
					<button type="button" class="btn btn-primary" 
						@click="updateSwLvs">
						{{ modalTitel }}
					</button>
				</template>
			</core-bs-modal>
		</core-form>
	</div>`
}