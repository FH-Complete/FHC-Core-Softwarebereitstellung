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
			modalTitel: '',
			studiensemester: [],
			selectedStudiensemester: '',
			vorrueckStudiensemester: '',
			cbCopyLizenzanzahl: false,
			cbCheckedAndApprovedLizenzanzahl: false,
			formData: [],
			requestModus: '' // 'changeLicense', 'anforderungenVorruecken'
		};
	},
	methods: {
		updateLicenses() {
			// Adapt postData for backend-needs
			const postData = this.formData
				.filter(fd => fd.lizenzanzahl !== '' && (fd.lizenzanzahl !== fd.currLizenzanzahl)) // filter out empty and where new value is same like old value
				.map(({ software_lv_id, software_id, studiensemester_kurzbz, lehrveranstaltung_id, currLizenzanzahl, lizenzanzahl }) => ({
					software_lv_id,
					software_id,
					lehrveranstaltung_id,
					studiensemester_kurzbz,
					lizenzanzahl: lizenzanzahl
			}));

			// Return if nothing to update
			if (postData.length !== this.formData.length){
				let emptyFields = {};
				this.formData.forEach(fd => {
					if (fd.lizenzanzahl === '')
						emptyFields['lizenzanzahl' + fd.software_lv_id] = this.$p.t('global', 'eingabeFehlt');
				});
				if (Object.keys(emptyFields).length > 0) {
					this.$refs.form.setFeedback(false, emptyFields);
				}

				let equalFields = {};
				this.formData.forEach(fd => {
					if (fd.lizenzanzahl === fd.currLizenzanzahl)
						equalFields['lizenzanzahl' + fd.software_lv_id] = this.$p.t('global', 'unveraendert');
				});
				if (Object.keys(equalFields).length > 0) {
					this.$refs.form.setFeedback(false, equalFields);
				}

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
						postData.forEach(pd => { updatedFields['lizenzanzahl' + pd.software_lv_id] = ''; });
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
							if (fd.lizenzanzahl === '')
								emptyFields['lizenzanzahl' + fd.software_lv_id] = this.$p.t('global', 'eingabeFehlt');
						});
						this.$refs.form.setFeedback(false, emptyFields);

					})
					.catch(this.$fhcAlert.handleSystemError);
		},
		saveVorgerrueckteSwLvZuordnungen(){

			// Reduce postData for backend-needs
			const postData = this.formData
				.filter(item => !item.zuordnungExists)
				.map(({software_lv_id,lehrveranstaltung_id, lizenzanzahl, software_id }) =>
				({
					software_lv_id: software_lv_id,
					lehrveranstaltung_id: lehrveranstaltung_id,
					lizenzanzahl: lizenzanzahl,
					software_id: software_id,
					studiensemester_kurzbz : this.vorrueckStudiensemester
				}));

			// Save SW-LV-Zuordnungen
			if (this.$refs.form)
				this.$refs.form
					.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/saveSoftwareLv', postData)
					.then(result => {
						this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert'));

						let updatedFields = {};
						this.formData.forEach(fd => {
							const name = 'lizenzanzahl' + fd.software_lv_id;
							updatedFields[name] = '';

							// Disable updated Lizenzanzahl field
							const formElement = this.$refs.form.$el.querySelector(`[name="${name}"]`);
							if (formElement) {
								formElement.disabled = true;
							}
						});
						this.$refs.form.setFeedback(true, updatedFields);

					})
					.catch(this.$fhcAlert.handleSystemError);
		},
		openModalChangeLicense(selectedData, selectedStudiensemester) {
			this.requestModus = 'changeLicense';

			// Set title
			this.modalTitel = this.$p.t('global', 'lizenzanzahlAendern');

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
					'stg_bezeichnung': data.stg_bezeichnung,
					'lv_oe_bezeichnung': data.lv_oe_bezeichnung,
					'lehrveranstaltung_id': data.lehrveranstaltung_id,
					'lv_bezeichnung': data.lv_bezeichnung,
					'currLizenzanzahl': data.anzahl_lizenzen,
					'lizenzanzahl': ''
				}));
			}

			// Open modal
			this.$refs.modalContainer.show();
		},
		async openModalAnforderungenVorruecken(selectedData, selectedStudiensemester) {
			this.requestModus = 'anforderungenVorruecken';

			// Set title
			this.modalTitel = this.$p.t('global', 'anforderungenVorruecken');

			// Reset form
			this.resetForm();

			// Load studiensemester to populate dropdown
			this.loadAndSetStudiensemester(selectedStudiensemester);

			// Load Vorrückungs-Studiensemester we want to move the Zuordnungen
			await this.setVorrueckStudiensemester(selectedStudiensemester);

			// Prefill with data of table selection
			if (Array.isArray(selectedData)) {
				this.formData = selectedData.map(data => ({
					'studiensemester_kurzbz': selectedStudiensemester,
					'software_lv_id': data.software_lv_id,
					'software_id': data.software_id,
					'software_kurzbz': data.software_kurzbz,
					'stg_bezeichnung': data.stg_bezeichnung,
					'lv_oe_bezeichnung': data.lv_oe_bezeichnung,
					'lehrveranstaltung_id': data.lehrveranstaltung_id,
					'lv_bezeichnung': data.lv_bezeichnung,
					'currLizenzanzahl': data.anzahl_lizenzen,
					'lizenzanzahl': data.anzahl_lizenzen,
					'zuordnungExists': false
				}));
			}

			// Flag if selection already exists
			this.flagAndSortExistingSwLvZuordnungen(this.formData);

			// Open modal
			this.$refs.modalContainer.show();
		},
		loadAndSetStudiensemester(selectedStudiensemester){
			this.$fhcApi
				.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getAktAndFutureSemester')
				.then( result => {
					this.studiensemester = result.data;
					this.selectedStudiensemester = selectedStudiensemester;
				})
				.catch( this.$fhcAlert.handleSystemError );
		},
		async setVorrueckStudiensemester(selectedStudiensemester){
			 const result = await this.$fhcApi
				.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getVorrueckStudiensemester',
					{ studiensemester_kurzbz: selectedStudiensemester })
				.then(result => {
					this.vorrueckStudiensemester = result.data;
				})
				.catch( this.$fhcAlert.handleSystemError );
		},
		flagAndSortExistingSwLvZuordnungen(){
			let postData = this.formData.map(fd => {
				return {
					software_id: fd.software_id,
					lehrveranstaltung_id: fd.lehrveranstaltung_id,
					studiensemester_kurzbz: this.vorrueckStudiensemester
				}
			})

			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/checkAndGetExistingSwLvZuordnungen', postData)
				.then( result => {
					if (result.data.length > 0)
					{
						this.formData.forEach(formItem => {
							result.data.forEach(existingItem => {
								// Flag formData where SW-LV Zuordnung already exists
								if (
									formItem.software_id === existingItem.software_id &&
									formItem.lehrveranstaltung_id === existingItem.lehrveranstaltung_id
								) {
									formItem.lizenzanzahl = existingItem.lizenzanzahl
									formItem.zuordnungExists = true;
								}
							});
						});

						// Sort first where SW-LV Zuordnung does not exist
						this.formData.sort((a, b) => a.zuordnungExists === b.zuordnungExists
							? 0
							: a.zuordnungExists ? 1 : -1
						);
					}
				})
				.catch( this.$fhcAlert.handleSystemError );
		},
		resetForm(){
			this.$refs.form.clearValidation();
			this.formData = [];
			this.selectedStudiensemester = this.studiensemester.length > 0 ? this.studiensemester[0].studiensemester_kurzbz : '';
			this.cbCopyLizenzanzahl = false;
			this.cbCheckedAndApprovedLizenzanzahl = false;
		},
		removeSelection(software_lv_id){
			this.formData = this.formData.filter(selectedSwLv => selectedSwLv.software_lv_id !== software_lv_id);
			this.$refs.form.clearValidation();
		},
		onChangeCbCopyLizenzanzahl(event){
			this.formData.map(fd => fd.lizenzanzahl = event.target.checked && !fd.zuordnungExists ? 0: fd.currLizenzanzahl);
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
						<div class="col-2">
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
						<div class="col-2" v-show="requestModus === 'anforderungenVorruecken'">
							<core-form-input
								type="select"
								v-model="vorrueckStudiensemester"
								name="vorrueckStudiensemester"
								:label="$p.t('global', 'vorrueckenInStudiensemester')"
								class="d-inline-flex">
								<option 
								v-for="(studSem, index) in studiensemester"
								:key="index" 
								:value="studSem.studiensemester_kurzbz"
								:disabled="studSem.studiensemester_kurzbz !== vorrueckStudiensemester">
									{{studSem.studiensemester_kurzbz}}
								</option>
							</core-form-input>
						</div>
						<div class="col-6 align-self-end" v-show="requestModus === 'anforderungenVorruecken'">
							<div class="form-check form-check-inline ms-3">
								<input
									class="form-check-input"
									type="checkbox"
									v-model="cbCopyLizenzanzahl"
									@change="onChangeCbCopyLizenzanzahl">
								<label class="form-check-label">Lizenz-Anzahl für alle auf 0 setzen und ggf. nachbearbeiten</label>
							</div>
						</div>
					</div>

					<div class="fhc-hr"></div>
					<div class="row mb-4" v-for="(fd, index) in formData" :key="index">
						<div class="col-3">
							<core-form-input
								v-model="fd.stg_bezeichnung"
								name="stg_bezeichnung"
								:label="index === 0 ? $p.t('lehre', 'studiengang') : ''"
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
								v-model="fd.currLizenzanzahl"
								name="currLizenzanzahl"
								class="form-control-sm"
								:label="index === 0 ? $p.t('global', 'lizenzAnzahl') : ''"
								disabled>
							</core-form-input>
							<span class="mx-3 align-self-center">=></span>
							<div class="d-flex flex-column">
								<core-form-input
									type="number"
									v-model="fd.lizenzanzahl"
									:name="'lizenzanzahl' + fd.software_lv_id"
									class="form-control-sm flex-fill"
									:label="index === 0 ? $p.t('global', 'lizenzAnzahl') + ' ' + vorrueckStudiensemester : ''"
									:tabindex="index + 1"
									:disabled="fd.zuordnungExists">
								</core-form-input>
								<div class="form-text text-danger" v-if="fd.zuordnungExists">{{ $p.t('global/bereitsAngefordert') }}</div>
							</div>
							<button class="btn btn-sm btn-outline-secondary ms-3 align-self-center" 
								@click.prevent="removeSelection(fd.software_lv_id)">
								<i class="fa fa-xmark"></i>
							</button>
						</div>
			</template>
				<template #footer>
					<div class="form-check form-check-inline ms-3" v-show="requestModus === 'anforderungenVorruecken'">
						<input
							class="form-check-input"
							type="checkbox"
							v-model="cbCheckedAndApprovedLizenzanzahl">
						<label class="form-check-label fw-bold me-3">Ich habe alle Softwareanforderungen und Lizenzangaben überprüft und wo erforderlich für das Studiensemester {{ vorrueckStudiensemester }} angepasst.</label>
					</div>
					<button type="button" class="btn btn-primary" v-if="requestModus === 'changeLicense'"
						@click="updateLicenses">
						{{ $p.t('global', 'lizenzanzahlAendern') }}
					</button>
					<button type="button" class="btn btn-primary" v-if="requestModus === 'anforderungenVorruecken'"
						:disabled="!cbCheckedAndApprovedLizenzanzahl"
						@click="saveVorgerrueckteSwLvZuordnungen">
						{{ $p.t('global', 'anforderungenVorruecken') }}
					</button>
				</template>
			</core-bs-modal>
		</core-form>
	</div>`
}