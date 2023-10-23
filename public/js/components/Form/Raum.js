import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import {Alert} from "../SoftwareManagement/Alert.js";

export const Raum = {
	components: {
		AutoComplete: primevue.autocomplete
	},
	emits: [
		 'onSaved'
	],
	mixins: [Alert],
	data() {
		return {
			softwareimageorte_id: null,
			softwareimage_id : Vue.inject('softwareimageId'),
			softwareimage_bezeichnung: Vue.inject('softwareimage_bezeichnung'),
			orte: [],
			ortSuggestions: [],
			verfuegbarkeit_start: null,
			verfuegbarkeit_ende: null,
			errors: []
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
							this.alertSystemMessage(result.data.retval); // TODO Check Backend Fehlermeldung
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
					error => {this.alertSystemError(error);}
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

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Ort/' + method,
				method === 'insertImageort' ?
				{
					softwareimage_id: this.softwareimage_id,
					orte_kurzbz: this.orte.map(ort => ort.ort_kurzbz),
					verfuegbarkeit_start: this.verfuegbarkeit_start,
					verfuegbarkeit_ende: this.verfuegbarkeit_ende
				} :
				{
					softwareimageorte_id: this.softwareimageorte_id,
					verfuegbarkeit_start: this.verfuegbarkeit_start,
					verfuegbarkeit_ende: this.verfuegbarkeit_ende
				},
				{
					timeout: 30000
				}
			).then(
				result => {
					// On error
					if (CoreRESTClient.isError(result.data))
					{
						Object.entries(CoreRESTClient.getError(result.data))
							.forEach(([key, value]) => {
								this.alertSystemMessage(value);
							}); // TODO Check Backend Result

						return;
					}

					// Store added Räume to update Raumanzahl in Imagetabelle
					let raumanzahlDifferenz = method === 'insertImageort' ? this.orte.length : 0;

					// On success
					this.alertSuccess('Gespeichert!');
					this.$emit('onSaved', raumanzahlDifferenz);
				}
			).catch(
				error => {
					this.alertSystemError(error);
				}
			);
		},
		reset(){
			this.softwareimageorte_id = null;
			this.orte = [];
			this.verfuegbarkeit_start = null;
			this.verfuegbarkeit_ende = null;
			this.errors = [];
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
						this.alertSystemMessage(result.data.retval); // TODO Check backend result
					}
					else
					{
						this.ortSuggestions = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => {
					this.alertSystemError(error);
				}
			);
		},
		selectAllOrte(){
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getOrte',
				null
			).then(result => {
					if (CoreRESTClient.isError(result.data))
					{
						this.alertSystemMessage(result.data.retval); // TODO check backend result
					}
					else
					{
						this.orte = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => {
					this.alertSystemError(error);
				}
			);
		}
	},
	template: `
	<div>
		<form ref="raumForm" class="row">
			<div class="col-sm-6">
				<label class="form-label">Softwareimage</label>
				<input type="text" class="form-control mb-3" v-model="softwareimage_bezeichnung" readonly>
			</div>
			<div class="col-sm-12">	
				<label class="form-label">Raum *</label>
				<auto-complete
					class="w-100 mb-3"
					v-model="orte"
					optionLabel="ort_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					multiple
					:disabled="ortSelectionDisabled"
					:suggestions="ortSuggestions"
					@complete="onComplete">
					<template #header>
						<button class="w-100 btn btn-secondary" @click="selectAllOrte">Alle wählen</button>
					</template>
				</auto-complete>
			</div>
			<div class="col-sm-3">
				<label class="form-label">Verfügbarkeit Start</label>
				<input type="date" class="form-control mb-3" v-model="verfuegbarkeit_start">
			</div>
			<div class="col-sm-3">
				<label class="form-label">Verfügbarkeit Ende</label>
				<input type="date" class="form-control mb-3" v-model="verfuegbarkeit_ende">
			</div>
		</form>
	</div>
	<div v-for="error in errors" class="alert alert-danger" role="alert" v-html="error"></div>
	`
}
