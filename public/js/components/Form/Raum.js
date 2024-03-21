import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import CoreForm from '../../../../../js/components/Form/Form.js';
import CoreFormInput from '../../../../../js/components/Form/Input.js';
import CoreFormValidation from '../../../../../js/components/Form/Validation.js';

export const Raum = {
	components: {
		AutoComplete: primevue.autocomplete,
		"datepicker": VueDatePicker,
		CoreForm,
		CoreFormInput,
		CoreFormValidation
	},
	emits: [
		 'onSaved'
	],
	data() {
		return {
			softwareimageorte_id: null,
			softwareimage_id : Vue.inject('softwareimageId'),
			softwareimage_bezeichnung: Vue.inject('softwareimage_bezeichnung'),
			orte: [],
			ortSuggestions: [],
			verfuegbarkeit_start: null,
			verfuegbarkeit_ende: null
		}
	},
	computed: {
		ortSelectionDisabled() { return this.softwareimageorte_id === null ? false : true; }
	},
	methods: {
		prefill(softwareimageort_id){

			if (Number.isInteger(softwareimageort_id)) {
				this.softwareimageorte_id = [softwareimageort_id];

				// Get softwareimageort
				CoreRESTClient.get('/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getImageort',
					{
						softwareimageort_id: softwareimageort_id,
					}
				).then(
					result => {
						if (CoreRESTClient.isError(result.data)) {
							this.$fhcAlert.alertWarning(CoreRESTClient.getError(result.data));
						}
						else {
							if (CoreRESTClient.hasData(result.data)) {

								// Prefill form with softwareimageort
								let data = CoreRESTClient.getData(result.data);
								this.verfuegbarkeit_start = data.verfuegbarkeit_start;
								this.verfuegbarkeit_ende = data.verfuegbarkeit_ende;

								// Prefill form with Raum assigned to softwareimage
								this.orte = [CoreRESTClient.getData(result.data)];
							}
						}
					}
				).catch(
					error => {this.$fhcAlert.handleSystemError(error);}
				);
			}
		},
		prefillOrte(selectedData){
			if (Array.isArray(selectedData)) {
				this.softwareimageorte_id = selectedData.map(data => data.softwareimageort_id);

				// Prefill form with Raum assigned to softwareimage
				this.orte = selectedData.map(data => ({['ort_kurzbz']: data.ort_kurzbz}));
			}
		},
		save(){
			// Decide if add or update Raumzuordnung
			let method = this.softwareimageorte_id === null ? 'insertImageort' : 'updateImageort';

			if (this.$refs.raumForm)
				this.$refs.raumForm
					.post('/extensions/FHC-Core-Softwarebereitstellung/fhcapi/Ort/' + method,
						method === 'insertImageort' ?
						{
							softwareimage_id: this.softwareimage_id,
							ort_kurzbz: this.orte.map(ort => ort.ort_kurzbz),
							verfuegbarkeit_start: this.verfuegbarkeit_start,
							verfuegbarkeit_ende: this.verfuegbarkeit_ende
						} :
						{
							softwareimageorte_id: this.softwareimageorte_id,
							verfuegbarkeit_start: this.verfuegbarkeit_start,
							verfuegbarkeit_ende: this.verfuegbarkeit_ende
						}
					)
					.then(result => {
						// Store added Räume to update Raumanzahl in Imagetabelle
						let raumanzahlDifferenz = method === 'insertImageort' ? this.orte.length : 0;

						this.$fhcAlert.alertSuccess('Gespeichert!');
						this.$emit('onSaved', raumanzahlDifferenz);
					}
				)
				.catch(error => { this.$fhcAlert.handleSystemError(error); }
			);
		},
		reset(){
			this.$refs.raumForm.clearValidation();
			this.softwareimageorte_id = null;
			this.orte = [];
			this.verfuegbarkeit_start = null;
			this.verfuegbarkeit_ende = null;
		},
		onComplete(event)
		{
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Ort/autofill',
				{
					ort_kurzbz: event.query
				}
			).then(result => {
					if (CoreRESTClient.isError(result.data))
					{
						this.$fhcAlert.alertWarning(CoreRESTClient.getError(result.data));
					}
					else
					{
						this.ortSuggestions = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
		},
		selectAllOrte(){
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getOrte',
				null
			).then(result => {
					if (CoreRESTClient.isError(result.data))
					{
						this.$fhcAlert.alertWarning(CoreRESTClient.getError(result.data));
					}
					else
					{
						this.orte = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
		}
	},
	template: `
	<div>
		<core-form ref="raumForm" class="row gy-3">
			<core-form-validation></core-form-validation>
			<div class="col-sm-6">
				<core-form-input
					v-model="softwareimage_bezeichnung"
					name="softwareimage_bezeichnung"
					label="Softwareimage"
					readonly
				>
				</core-form-input>
			</div>
			<div class="col-sm-12">
				<core-form-input
					type="autocomplete"
					v-model="orte"
					name="ort_kurzbz"
					label="Raum *"
					option-label="ort_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					multiple
					:disabled="ortSelectionDisabled"
					:suggestions="ortSuggestions"
					@complete="onComplete"
					>
					<template #header>
						<button class="w-100 btn btn-secondary" @click="selectAllOrte">Alle wählen</button>
					</template>
				</core-form-input>
			</div>
			<div class="col-sm-3">
				<core-form-input
					type="datepicker"
					v-model="verfuegbarkeit_start"
					name="verfuegbarkeit_start"
					label="Verfügbarkeit Start"
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
			<div class="col-sm-3">
				<core-form-input
					type="datepicker"
					v-model="verfuegbarkeit_ende"
					name="verfuegbarkeit_ende"
					label="Verfügbarkeit Ende"
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
		</core-form>
	</div>
	`
}
