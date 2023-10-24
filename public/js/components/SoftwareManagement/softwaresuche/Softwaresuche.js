import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import {Alert} from "../Alert";

export const Softwaresuche = {
	components: {
		CoreFilterCmpt,
		AutoComplete: primevue.autocomplete
	},
	mixins:[Alert],
	data: function() {
		return {
			softwaresucheTabulatorOptions: {
				index: 'software_id',
				maxHeight: "100%",
				minHeight: 30,
				layout: 'fitColumns',
				columnDefaults:{
					tooltip:true,
				},
				columns: [
					{title: 'Ort', field: 'ort_kurzbz', headerFilter: true, frozen:true, visible: true},
					{title: 'Software-ID', field: 'software_id', headerFilter: true, frozen:true, visible: false},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true, frozen: true},
					{title: 'Softwaretyp', field: 'softwaretyp_bezeichnung', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right'},
					{title: 'Beschreibung', field: 'beschreibung', headerFilter: true},
					{title: 'Hersteller', field: 'hersteller', headerFilter: true},
					{title: 'Betriebssystem', field: 'os', headerFilter: true},
					{title: 'Verantwortliche', field: 'verantwortliche', headerFilter: true},
					{title: 'Anmerkung intern', field: 'anmerkung_intern', headerFilter: true},
					{title: 'Softwarestatus Bezeichnung', field: 'softwarestatus_bezeichnung', headerFilter: true}
				]
			},
			selOrt: null,
			ortSuggestions: [],
		}
	},
	methods: {
		getSoftwareByOrt(ort_kurzbz){
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareByOrt',
				{
					ort_kurzbz: ort_kurzbz
				},
				{
					timeout: 2000
				}
			).then(
				result => {
					this.$refs.softwaresucheTable.tabulator.setData(CoreRESTClient.getData(result.data));
				}
			).catch(
				error => {
					this.alertSystemError(error);
				}
			);
		},
		onComplete(event) {
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
						this.selOrt = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => {
					this.alertSystemError(error);
				}
			);
		}
	},
	watch: {
		selOrt(newVal, oldVal){
			if (this.selOrt === null) return;

			if (typeof this.selOrt === 'object' && this.selOrt.hasOwnProperty('ort_kurzbz'))
			{
				this.getSoftwareByOrt(this.selOrt.ort_kurzbz);
			}
		}
	},
	template: `
	<!-- Softwaresuche Tabelle -->
	<core-filter-cmpt
		ref="softwaresucheTable"
		:side-menu="false"
		:table-only=true
		:tabulator-options="softwaresucheTabulatorOptions"
		@click:new="openModal">
		<template v-slot:search>
				<auto-complete
					class="w-100"
					v-model="selOrt"
					optionLabel="ort_kurzbz"
					dropdown
					dropdown-current
					forceSelection
					:suggestions="ortSuggestions"
					placeholder="Suche nach Raum..."
					@complete="onComplete">
				</auto-complete>		
		</template>	
	</core-filter-cmpt>
	`
};