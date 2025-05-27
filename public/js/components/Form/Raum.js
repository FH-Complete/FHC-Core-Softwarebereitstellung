import CoreForm from '../../../../../js/components/Form/Form.js';
import CoreFormInput from '../../../../../js/components/Form/Input.js';
import CoreFormValidation from '../../../../../js/components/Form/Validation.js';
import ApiOrt from "../../api/ort.js";

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
			verfuegbarkeit_ende: null,
			abortController: {
				ortSuggestions: null,
			}
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
				this.$api
					.call(ApiOrt.getImageort(softwareimageort_id))
					.then(result => {
						if (result.error) {
							this.$fhcAlert.alertWarning(result.retval);
						}
						else {
							if (result.retval) {

								// Prefill form with softwareimageort
								let data = result.retval;
								this.verfuegbarkeit_start = data.verfuegbarkeit_start;
								this.verfuegbarkeit_ende = data.verfuegbarkeit_ende;

								// Prefill form with Raum assigned to softwareimage
								this.orte = [result.retval];
							}
						}
					})
					.catch(error => this.$fhcAlert.handleSystemError(error));
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

						this.$fhcAlert.alertSuccess(this.$p.t('global/gespeichert'));
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
		searchOrt(event)
		{
			if (this.abortController.ortSuggestions)
				this.abortController.ortSuggestions.abort();

			this.abortController.ortSuggestions = new AbortController();

			this.$api
				.call(ApiOrt.searchOrt(event.query),
					{
						signal: this.abortController.ortSuggestions.signal
					}
				)
				.then(result => {
					if (result.error)
					{
						this.$fhcAlert.alertWarning(result.retval);
					}
					else
					{
						this.ortSuggestions = result.retval;
					}
				})
				.catch(error => this.$fhcAlert.handleSystemError(error));
		},
		selectAllOrte(){
			this.$api
				.call(ApiOrt.getOrte())
				.then(result => {
					if (result.error)
					{
						this.$fhcAlert.alertWarning(result.retval);
					}
					else
					{
						this.orte = result.retval;
					}
				})
				.catch(error => this.$fhcAlert.handleSystemError(error));
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
			<div class="col-sm-3">
				<core-form-input
					type="datepicker"
					v-model="verfuegbarkeit_start"
					name="verfuegbarkeit_start"
					:label="$p.t('global/verfuegbarkeitStart')"
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
					:label="$p.t('global/verfuegbarkeitEnde')"
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
			<div class="col-sm-12">
				<core-form-input
					type="autocomplete"
					v-model="orte"
					name="ort_kurzbz"
					:label="$p.t('global/raum')"
					option-label="ort_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					multiple
					:disabled="ortSelectionDisabled"
					:suggestions="ortSuggestions"
					@complete="searchOrt"
					>
					<template #header>
						<button class="w-100 btn btn-secondary" @click="selectAllOrte">{{ $p.t('global/alleWaehlen') }}</button>
					</template>
				</core-form-input>
			</div>
		</core-form>
	</div>
	`
}
