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
		'formClosed'
	],
	data() {
		return {
			modalTitel: this.$p.t('global', 'lizenzanzahlAendern'),
			studiensemester: [],
			selectedStudiensemester: '',
			formData: [],
			requestModus: '' // 'changeLicense'
		};
	},
	methods: {
		sendForm() {

			let test = this.formData.filter(fd => {
				console.log(fd.lizenzanzahl_neu);
				console.log(fd.lizenzanzahl);
				console.log(fd.lizenzanzahl_neu === fd.lizenzanzahl);
			})
			// Adapt postData for backend-needs
			const postData = this.formData
				.filter(fd => fd.lizenzanzahl_neu !== '' && (fd.lizenzanzahl_neu !== fd.lizenzanzahl)) // filter out empty and where new value is same like old value
				.map(({ software_lv_id, software_id, studiensemester_kurzbz, lehrveranstaltung_id, lizenzanzahl, lizenzanzahl_neu }) => ({
					software_lv_id,
					software_id,
					lehrveranstaltung_id,
					studiensemester_kurzbz,
					lizenzanzahl: lizenzanzahl_neu
			}));

			// Return if nothing to update
			if (postData.length === 0){
				this.$fhcAlert.alertWarning(this.$p.t('global', 'eingabeFehlt'));
				return;
			}

			// Update SW-LV-Zuordnungen
			if (this.$refs.form)
				this.$refs.form
					.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/updateSoftwareLv', postData)
					.then(result => {

						this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert'));

						// Set form feedback for updated fields
						let updatedFields = {};
						postData.forEach(pd => { updatedFields['lizenzanzahl_neu' + pd.software_lv_id] = ''; });
						this.$refs.form.setFeedback(true, updatedFields);

						// Set form feedback where neue Lizenzanzahl is equal to Lizenzanzahl
						let equalFields = {};
						this.formData.forEach(fd => {
							if (fd.lizenzanzahl_neu === fd.lizenzanzahl)
								equalFields['lizenzanzahl_neu' + fd.software_lv_id] = this.$p.t('global', 'unveraendert');
						});
						this.$refs.form.setFeedback(false, equalFields);

						// Set form feedback for where neue Lizenzanzahl is empty
						let emptyFields = {};
						this.formData.forEach(fd => {
							if (fd.lizenzanzahl_neu === '')
								emptyFields['lizenzanzahl_neu' + fd.software_lv_id] = this.$p.t('global', 'eingabeFehlt');
						});
						this.$refs.form.setFeedback(false, emptyFields);

					})
					.catch(this.$fhcAlert.handleSystemError);
		},
		openModalChangeLicense(selectedData, selectedStudiensemester) {
			this.requestModus = 'changeLicense';

			// Reset form
			this.resetForm();

			// Load studiensemester to populate dropdown
			this.loadAndSetStudiensemester(selectedStudiensemester);

			// Prefill with data of table selection
			if (Array.isArray(selectedData)) {
				this.formData = selectedData.map(data => ({
					'studiensemester_kurzbz': selectedStudiensemester,
					'software_lv_id': data.software_lv_id,
					'software_id': data.software_id,
					'software_kurzbz': data.software_kurzbz,
					'lv_oe_bezeichnung': data.lv_oe_bezeichnung,
					'lehrveranstaltung_id': data.lehrveranstaltung_id,
					'lv_bezeichnung': data.lv_bezeichnung,
					'lizenzanzahl': data.anzahl_lizenzen,
					'lizenzanzahl_neu': ''
				}));
			}

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
		resetForm(){
			this.$refs.form.clearValidation();
			this.formData = [];
			this.selectedStudiensemester = this.studiensemester.length > 0 ? this.studiensemester[0].studiensemester_kurzbz : '';
		},
		removeSelection(software_lv_id){
			this.formData = this.formData.filter(selectedSwLv => selectedSwLv.software_lv_id !== software_lv_id);
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
								:disabled>
								<option 
								v-for="(studSem, index) in studiensemester"
								:key="index" 
								:value="studSem.studiensemester_kurzbz">
									{{studSem.studiensemester_kurzbz}}
								</option>
							</core-form-input>
						</div>
					</div>
					<div class="fhc-hr"></div>
					<div class="row mb-4" v-for="(fd, index) in formData" :key="index">
						<div class="col-3">
							<core-form-input
								v-model="fd.lv_oe_bezeichnung"
								name="lv_oe_bezeichnung"
								:label="index === 0 ? $p.t('lehre', 'organisationseinheit') : ''"
								class="form-control-sm"
								readonly>
							</core-form-input>
						</div>
						<div class="col-3">
							<core-form-input
								v-model="fd.lv_bezeichnung"
								name="lv_bezeichnung"
								:label="index === 0 ? $p.t('lehre', 'lehrveranstaltung') : ''"
								class="form-control-sm"
								readonly>
							</core-form-input>
						</div>
						<div class="col-3">
							<core-form-input
								v-model="fd.software_kurzbz"
								name="software_kurzbz"
								:label="index === 0 ? 'Software' : ''"
								class="form-control-sm"
								readonly>
							</core-form-input>
						</div>
						<div class="col-3 d-inline-flex justify-content-evenly">
							<core-form-input
								type="number"
								v-model="fd.lizenzanzahl"
								name="lizenzanzahl"
								class="form-control-sm"
								:label="index === 0 ? $p.t('global', 'lizenzAnzahl') : ''"
								:disabled>
							</core-form-input>
							<span class="mx-3 align-self-end">=></span>
							<core-form-input
								type="number"
								v-model="fd.lizenzanzahl_neu"
								:name="'lizenzanzahl_neu' + fd.software_lv_id"
								class="form-control-sm flex-fill"
								:label="index === 0 ? $p.t('global', 'lizenzAnzahlNeu') : ''"
								:tabindex="index + 1">
							</core-form-input>
							<button class="btn btn-sm btn-outline-secondary align-self-end ms-3" 
								@click.prevent="removeSelection(fd.software_lv_id)">
								<i class="fa fa-xmark"></i>
							</button>
						</div>
			</template>
				<template #footer>
					<button type="button" class="btn btn-primary" 
						@click="sendForm">
						{{ $p.t('global', 'lizenzanzahlAendern') }}
					</button>
				</template>
			</core-bs-modal>
		</core-form>
	</div>`
}