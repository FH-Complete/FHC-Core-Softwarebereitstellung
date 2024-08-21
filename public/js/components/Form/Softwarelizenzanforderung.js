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
	inject: ['STUDIENSEMESTER_DROPDOWN_STARTDATE'],
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
				.map(({ software_lv_id, lizenzanzahl }) => ({
					software_lv_id,
					lizenzanzahl: lizenzanzahl
			}));

			// Update SW-LV-Zuordnungen
			if (this.$refs.form)
				this.$refs.form
					.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/updateSoftwareLv', postData)
					.then(result => {

						this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert'));

						// Set form feedback for updated fields
						let updatedFields = {};
						postData.forEach((pd, index) => { updatedFields['lizenzanzahl' + index] = ''; });
						this.$refs.form.setFeedback(true, updatedFields);

						// Set form feedback where neue Lizenzanzahl is equal to Lizenzanzahl
						let equalFields = {};
						this.formData.forEach((fd, index) => {
							if (fd.lizenzanzahl === fd.currLizenzanzahl)
								equalFields['lizenzanzahl' + index] = this.$p.t('global', 'unveraendert');
						});
						this.$refs.form.setFeedback(false, equalFields);

					})
					.catch(error => this.$fhcAlert.handleSystemError(error));
		},
		saveVorgerrueckteSwLvZuordnungen(){

			// Reduce postData for backend-needs
			const postData = this.formData
				.filter(item => !item.zuordnungExists) // ...Zuordnungen that do not already exist
				.filter(item => item.lvIdExistInVorrueckSemester) // ...and where LV-ID is available in Vorrück-Studiensemester
				.map(({software_lv_id, lehrveranstaltung_id, lizenzanzahl, software_id }) =>
				({
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
						postData.forEach((fd, index) => {
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
					'lv_bezeichnung': data.lv_bezeichnung + ' [ ' + data.orgform_kurzbz + ' ]',
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
					'lv_bezeichnung': data.lv_bezeichnung + ' [ ' + data.orgform_kurzbz + ' ]',
					'currLizenzanzahl': data.anzahl_lizenzen,
					'lizenzanzahl': data.anzahl_lizenzen,
					'zuordnungExists': false,
					'lvIdExistInVorrueckSemester': true
				}));
			}

			// Flag LVs that do not exist in Vorrueck-Studiensemester
			this.flagLvsNotExistingInVorrueckStudiensemester(this.formData);

			// Flag if selection already exists
			this.flagAndSortExistingSwLvZuordnungen(this.formData);

			// Open modal
			this.$refs.modalContainer.show();
		},
		loadAndSetStudiensemester(selectedStudiensemester){
			this.$fhcApi
				.get('api/frontend/v1/organisation/Studiensemester/getAll', {start: this.STUDIENSEMESTER_DROPDOWN_STARTDATE})
				.then(result => this.studiensemester = result.data)
				.then(() => this.selectedStudiensemester = selectedStudiensemester)
				.catch(error => this.$fhcAlert.handleSystemError(error) );
		},
		async setVorrueckStudiensemester(selectedStudiensemester){
			 const result = await this.$fhcApi
				.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getVorrueckStudiensemester',
					{ studiensemester_kurzbz: selectedStudiensemester })
				.then(result => {
					this.vorrueckStudiensemester = result.data;
				})
				.catch(error => this.$fhcAlert.handleSystemError(error) );
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
				.catch(error => this.$fhcAlert.handleSystemError(error) );
		},
		flagLvsNotExistingInVorrueckStudiensemester(){
			let postData = {
				lv_ids: this.formData.map(fd => fd.lehrveranstaltung_id),
				studiensemester_kurzbz: this.vorrueckStudiensemester
			}

			this.$fhcApi
				.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getLehrveranstaltungenByLvs', postData)
				.then( result => result.data)
				.then (data =>
				{
					this.formData.forEach(fd => {
						// Flag formData where lv_id does not exist in vorrück-Semester yet
						if (!data.includes(fd.lehrveranstaltung_id)) {
							fd.lvIdExistInVorrueckSemester = false;
						}
					});
				})
				.catch(error => this.$fhcAlert.handleSystemError(error) );
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
					<core-form-validation></core-form-validation>
					<!-- Modal: Lizenzanzahl ändern -->
					<div v-if="requestModus === 'changeLicense'" class="row">
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
						<div class="fhc-hr"></div>
						<!-- LVs und Eingabefeld für neue Lizenzanzahl im neuen Studiensemester -->		
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
										:name="'lizenzanzahl' + index"
										class="form-control-sm flex-fill"
										:label="index === 0 ? $p.t('global', 'lizenzAnzahlNeu') : ''"
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
						</div>
					</div>
					<!-- Modal: Anforderungen in neues Studiensemester vorrücken -->
					<div v-if="requestModus === 'anforderungenVorruecken'" class="row">
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
						<div class="col-2">
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
						<div class="col-6 align-self-end">
							<div class="form-check form-check-inline ms-3">
								<input
									class="form-check-input"
									type="checkbox"
									v-model="cbCopyLizenzanzahl"
									@change="onChangeCbCopyLizenzanzahl">
								<label class="form-check-label">Lizenz-Anzahl für alle auf 0 setzen und ggf. nachbearbeiten</label>
							</div>
						</div>
						<div class="fhc-hr"></div>
						<!-- LV-Ids, die im neuen Studiensemester nicht existieren (-> Vorrücken nicht möglich)-->
						<div v-if="formData.some(fd => !fd.lvIdExistInVorrueckSemester)">
							<div class="accordion mb-5" id="accordionExample">
								<div class="accordion-item">
									<h2 class="accordion-header" id="flush-headingOne">
										<button class="accordion-button collapsed text-danger bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
											<i class="fa fa-chevron-down me-3"></i>
											Einige Lehrveranstaltungen können nicht vorgerrückt werden. Sie wurden für {{ vorrueckStudiensemester }} (noch) nicht angelegt oder haben eine neue LV-ID.
										</button>
									</h2>
									<div id="collapseOne" class="accordion-collapse collapse" aria-labelledby="flush-headingOne" data-bs-parent="#accordionExample">
										<div class="accordion-body mt-3"> 
											<template v-for="(fd, index) in formData" :key="index">
												<div v-if="!fd.lvIdExistInVorrueckSemester" class="row mb-3" >
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
													<div class="col-3 align-self-end">
														<span class="text-danger"><small>LV-ID {{ fd.lehrveranstaltung_id }} existiert nicht</small></span>
													</div>
												</div>
											</template>	
										</div>
									</div>
								</div>
							</div>
						</div>		
						<!-- LVs und Eingabefeld für neue Lizenzanzahl im neuen Studiensemester -->		
						<template v-for="(fd, index) in formData" :key="index">
							<div v-if="fd.lvIdExistInVorrueckSemester" class="row mb-3">
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
										:name="'lizenzanzahl' + index"
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
							</div>
						</template>
					</div>	
				</template>
				<template #footer>
					<div class="form-check form-check-inline ms-3" v-if="requestModus === 'anforderungenVorruecken'">
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