import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import SoftwareanforderungForm from "../Form/Softwareanforderung.js";

export default {
	components: {
		CoreFilterCmpt,
		SoftwareanforderungForm
	},
	inject: [
		'selectedStudienjahr',
		'currentTab'
	],
	data: function() {
		return {
			table: null,
		}
	},
	watch: {
		selectedStudienjahr(newVal) {
			if(newVal && this.currentTab === "softwareanforderungNachLv" && this.table) {
				this.table.replaceData();
			}
		},
		currentTab(newVal) {
			if (newVal === 'softwareanforderungNachLv' && this.selectedStudienjahr && this.table) {
				this.table.replaceData();
			}
		}
	},
	computed: {
		tabulatorOptions() {
		const self = this;
			return {
				ajaxURL: self.$fhcApi.getUri(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getNonQuellkursLvs'
				),
				ajaxParams: () => {
					return {
						studienjahr_kurzbz: self.selectedStudienjahr
					}
				},
				ajaxResponse(url, params, response){
					return response.data
				},
				layout: 'fitColumns',
				autoResize:false, // prevent auto resizing of table
				resizableColumnFit:true, //maintain the fit of columns when resizing
				index: 'lehrveranstaltung_id',
				selectable: true,
				selectableRangeMode: 'click',
				persistence:{
					filter: false, //persist filter sorting
				},
				columns: [
					{
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						titleFormatterParams: { rowRange: "active"},
						width: 70
					},
					{title: 'LV-ID', field: 'lehrveranstaltung_id', headerFilter: true, visible: false},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true, minWidth: 350},
					{title: 'Studiensemester', field: 'studiensemester_kurzbz', headerFilter: true, visible:true, width: 90},
					{title: 'STG Kurzbz', field: 'stg_typ_kurzbz', headerFilter: true, visible:true, width: 70},
					{title: 'OrgForm', field: 'orgform_kurzbz', headerFilter: true, width: 70},
					{title: 'Semester', field: 'semester', headerFilter: true, width: 50},
					{title: 'Studiengang', field: 'stg_bezeichnung', headerFilter: true, width: 250, visible:false},
					{title: 'Studiengangtyp', field: 'stg_typ_bezeichnung', headerFilter: true, width: 250, visible: false},
					{title: 'Studienplan', field: 'studienplan_bezeichnung', headerFilter: true, visible:true, width: 220},
					{title: 'LE-Gruppen', field: 'lehreinheitgruppen_bezeichnung', headerFilter: true, width: 200},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false, minWidth: 80},
					{title: 'LV-OE', field: 'lv_oe_bezeichnung', headerFilter: true, minWidth: 200}
				]
			}
		}
	},
	methods: {
		openSoftwareanforderungForm(){
			let selectedData = this.table.getSelectedData();

			if (selectedData.length == 0)
			{
				this.$fhcAlert.alertWarning( this.$p.t('global/zeilenAuswaehlen'));
				return;
			}

			this.$refs.softwareanforderungForm.openModalLvToSw(selectedData);
		},
		onFormClosed(){
			// Deselect all rows
			this.table.deselectRow();
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungNachLvTable.tabulator;

			// Replace column titles with phrasen
			await this.$p.loadCategory(['lehre']);
			this.table.updateColumnDefinition('lv_bezeichnung', {title: this.$p.t('lehre', 'lehrveranstaltung')});
			this.table.updateColumnDefinition('stg_bezeichnung', {title: this.$p.t('lehre', 'studiengang')});
		},
	},
	template: `
<div class="softwareanforderungNachLv overflow-hidden">
	<div class="row d-flex my-3">
		<div class="col-12 h4">Software bestellen für einzelne LVs {{ selectedStudienjahr }} </div>
	</div>
	<div class="row mb-5">
		<div class="col">
			<core-filter-cmpt
				ref="softwareanforderungNachLvTable"
				uniqueId="softwareanforderungNachLvTable"
				table-only
				:side-menu="false"
				:tabulator-options="tabulatorOptions"
				:tabulator-events="[{event: 'tableBuilt', handler: onTableBuilt}]">
				<template v-slot:actions>
					<button class="btn btn-primary" @click="openSoftwareanforderungForm()">{{ $p.t('global/swFuerLvAnfordern') }}</button>
				</template>
			</core-filter-cmpt>						
		</div>
	</div>
	
	<!-- Form -->
	<softwareanforderung-form ref="softwareanforderungForm" @form-closed="onFormClosed"></softwareanforderung-form>

</div>
`
};
