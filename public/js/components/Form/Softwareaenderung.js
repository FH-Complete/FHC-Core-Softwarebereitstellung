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
		'selectedStudienjahr',
	],
	emit: [
		'onSaved'
	],
	data() {
		return {
			modalTitel: this.$p.t('global', 'swFuerLvAendern'),
			autocompleteAbortController: null,
			swSuggestions: [],
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

			// Update Software for Quellkurs swlv and its assigend swlvs
			if (this.requestModus === 'tpl') {
				if (this.$refs.form) {
					this.$refs.form
						.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/updateSoftwareByTpl',
							{
								tpl_software_lv_id: this.selectedTemplate.software_lv_id,
								software_id: this.selectedSw.software_id,
								studienjahr_kurzbz: this.selectedStudienjahr
							}
						)
						.then(result => {
							this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert'));
							this.$refs.modalContainer.hide();
							this.$emit('onSaved');
						})
						.then(() => {
							this.$fhcApi.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/sendMailSoftwareUpdated',
							{
								tpl_software_lv_id: this.selectedTemplate.software_lv_id,
								software_id: this.selectedSw.software_id,
							})
						})
						.catch(error => this.$fhcAlert.handleSystemError(error));
				}
			}
			// Update Software for single swlv
			else {
				if (this.$refs.form) {
					this.$refs.form
						.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/updateSoftwareByLv',
							{
								software_lv_id: this.selectedLvs[0].software_lv_id,
								software_id: this.selectedSw.software_id,
								studienjahr_kurzbz: this.selectedStudienjahr
							}
						)
						.then(result => {
							this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert'));
							this.$refs.modalContainer.hide();
							this.$emit('onSaved');
						})
						.catch(error => this.$fhcAlert.handleSystemError(error));
				}
			}
		},
		openModalUpdateSwByLv(selectedData) {
			this.resetForm();

			// Prefill Lehrveranstaltung with selected row data
			this.selectedLvs = [
				{
				'software_lv_id': selectedData.software_lv_id,
				'lehrveranstaltung_id': selectedData.lehrveranstaltung_id,
				'studiensemester_kurzbz': selectedData.studiensemester_kurzbz,
				'lv_bezeichnung': selectedData.lv_bezeichnung + ' [ ' + selectedData.orgform_kurzbz + ' ]',
				'stg_bezeichnung': selectedData.stg_bezeichnung
				}
			];	// must be array for autoselect

			// Prefill software with selected row data
			this.selectedSw = {
				'software_id': selectedData.software_id,
				'software_kurzbz': selectedData.software_kurzbz
			};

			// Open modal
			this.$refs.modalContainer.show();
		},
		openModalUpdateSwByTemplate(selectedData) {
			this.resetForm();

			this.requestModus = 'tpl';

			// Get LV Template from selected row
			this.selectedTemplate = {
				'software_lv_id': selectedData.software_lv_id,
				'lehrveranstaltung_id': selectedData.lehrveranstaltung_id,
				'studiensemester_kurzbz': selectedData.studiensemester_kurzbz,
				'lv_bezeichnung': selectedData.lv_bezeichnung
			};

			// Prefill Lehrveranstaltungen dropdown
			if (Array.isArray(selectedData._children) && selectedData._children.length > 0)
			{
				this.selectedLvs = selectedData._children.map(data => (
					{
						'software_lv_id': data.software_lv_id,
						'lehrveranstaltung_id': data.lehrveranstaltung_id,
						'studiensemester_kurzbz': data.studiensemester_kurzbz,
						'lv_bezeichnung': data.lv_bezeichnung + ' [ ' + data.orgform_kurzbz + ' ]',
						'stg_bezeichnung': data.stg_bezeichnung,
					}
				));
			}

			// Prefill software dropdown
			this.selectedSw = {
				'software_id': selectedData.software_id,
				'software_kurzbz': selectedData.software_kurzbz
			};

			// Open modal
			this.$refs.modalContainer.show();
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
		resetForm(){
			this.$refs.form.clearValidation();
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
						<div class="col-4 mb-3 align-self-start" v-if="requestModus == 'tpl'">
						 	<core-form-input
								v-model="selectedTemplate.lv_bezeichnung"
								name="selectedTemplate"
								:label="$p.t('global/quellkurs')"
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
								:option-label="getSwOptionLabel"
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