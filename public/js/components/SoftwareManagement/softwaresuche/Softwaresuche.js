import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';

export default {
	components: {
		CoreFilterCmpt,
		AutoComplete: primevue.autocomplete
	},
	data: function() {
		return {
			softwaresucheTabulatorOptions: {
				index: 'software_id',
				layout: 'fitColumns',
				columns: [
					{title: 'Ort', field: 'ort_kurzbz', headerFilter: true, frozen: true},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true, frozen: true},
					{title: 'Software-ID', field: 'software_id', headerFilter: true, visible: false},
					{title: 'Softwaretyp', field: 'softwaretyp_bezeichnung', headerFilter: true},
					{title: 'Image', field: 'image_bezeichnung', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right'},
					{title: 'Hersteller', field: 'hersteller', headerFilter: true},
					{title: 'Betriebssystem', field: 'os', headerFilter: true},
					{title: 'Softwarestatus Bezeichnung', field: 'softwarestatus_bezeichnung', headerFilter: true, width: 150}
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
				})
				.then(result => result.data)
				.then(result => {this.$refs.softwaresucheTable.tabulator.setData(CoreRESTClient.getData(result));})
				.catch(
				error => { this.$fhcAlert.handleSystemError(error); }
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
						this.$fhcAlert.handleSystemMessage(result.data.retval);
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
						this.$fhcAlert.handleSystemMessage(result.data.retval);
					}
					else
					{
						this.selOrt = CoreRESTClient.getData(result.data);
					}
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
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
	<div class="row">
		<div class="col">
			<!-- Softwaresuche Tabelle -->
			<core-filter-cmpt
				ref="softwaresucheTable"
				:side-menu="false"
				table-only
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
		</div>
	</div>
	`
};