import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import ApiSoftware from "../../../api/software.js";
import ApiOrt from "../../../api/ort.js";

export default {
	components: {
		CoreFilterCmpt,
		AutoComplete: primevue.autocomplete
	},
	props: {
		modelValue: {
			type: Object,
			required: false
		}
	},
	data: function() {
		return {
			softwaresucheTabulatorOptions: {
				index: 'software_id',
				layout: 'fitColumns',
				autoResize:false, // prevent auto resizing of table
				resizableColumnFit:true, //maintain the fit of columns when resizing
				selectable: false,
				columns: [
					{title: this.$p.t('global/raum'), field: 'ort_kurzbz', headerFilter: true,
						minWidth: 100,
						maxWidth: 100,
						width: 100,
						frozen: true
					},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true,
						minWidth: 200,
						maxWidth: 200,
						width: 200,
						frozen: true
					},
					{title: 'Software-ID', field: 'software_id', headerFilter: true, visible: false},
					{title: this.$p.t('global/softwaretyp'), field: 'softwaretyp_bezeichnung', headerFilter: true},
					{title: 'Image', field: 'image_bezeichnung', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right'},
					{title: this.$p.t('global/hersteller'), field: 'hersteller', headerFilter: true},
					{title: this.$p.t('global/betriebssystem'), field: 'os', headerFilter: true},
					{title: 'Software-Status', field: 'softwarestatus_bezeichnung', headerFilter: true,
						minWidth: 150,
						maxWidth: 150,
						width: 150,
						frozen: true
					}
				]
			},
			selOrt: null,
			ortSuggestions: [],
			abortController: {
				ortSuggestions: null,
			}
		}
	},
	methods: {
		getSoftwareByOrt(ort_kurzbz){
			this.$api
				.call(ApiSoftware.getSoftwareByOrt(ort_kurzbz))
				.then(result => {this.$refs.softwaresucheTable.tabulator.setData(result.retval);})
				.catch(error => this.$fhcAlert.handleSystemError(error));
		},
		onTableBuilt() {
			if (this.modelValue.ortKurzbz) {
				this.selOrt = {ort_kurzbz: this.modelValue.ortKurzbz};
				this.getSoftwareByOrt(this.modelValue.ortKurzbz);
			}
		},
		searchOrt(event) {
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
						this.$fhcAlert.handleSystemMessage(result.retval);
					}
					else
					{
						this.ortSuggestions = result.retval;
					}
				})
				.catch(error => this.$fhcAlert.handleSystemError(error));
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
	<div class="softwaresuche overflow-hidden">
		<div class="row">
			<div class="col">
				<!-- Softwaresuche Tabelle -->
				<core-filter-cmpt
					ref="softwaresucheTable"
					:side-menu="false"
					table-only
					:tabulator-options="softwaresucheTabulatorOptions"
					:tabulator-events="[{event: 'tableBuilt', handler: onTableBuilt}]"
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
								@complete="searchOrt">
							</auto-complete>		
					</template>	
				</core-filter-cmpt>
			</div>
		</div>
	</div>
	`
};