import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import SoftwareanforderungForm from "../Form/Softwareanforderung.js";

export default {
	components: {
		CoreFilterCmpt,
		SoftwareanforderungForm
	},
	inject: [
		'selectedStudiensemester',
		'currentTab'
	],
	data: function() {
		return {
			table: null,
		}
	},
	watch: {
		selectedStudiensemester(newVal) {
			if(newVal && this.currentTab === "softwareanforderungNachLv" && this.table) {
				this.setTableData();
			}
		},
		currentTab(newVal) {
			if (newVal === 'softwareanforderungNachLv' && this.selectedStudiensemester && this.table) {
				this.setTableData();
			}
		}
	},
	computed: {
		tabulatorOptions() {
			return {
				// NOTE: data is set on table built to await preselected actual Studiensemester
				ajaxResponse(url, params, response){ return response.data },
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
					{title: 'STG Kurzbz', field: 'stg_typ_kurzbz', headerFilter: true, visible:true, width: 70},
					{title: 'Studiengang', field: 'stg_bezeichnung', headerFilter: true, width: 250},
					{title: 'Studiengangtyp', field: 'stg_typ_bezeichnung', headerFilter: true, width: 250},
					{title: 'OrgForm', field: 'orgform_kurzbz', headerFilter: true, width: 70},
					{title: 'Semester', field: 'semester', headerFilter: true, width: 50},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true, minWidth: 250},
					{title: 'LE-Gruppen', field: 'lehreinheitgruppen_bezeichnung', headerFilter: true, width: 200},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false, minWidth: 80},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true, minWidth: 200},
					{
						title: 'Quellkurs-LV',
						field: 'lehrveranstaltung_template_id',
						formatter: function(cell) {
							const value = cell.getValue();
							return value !== null && value !== undefined && value !== ""
								? '<i class="fa fa-check text-success"></i>'
								: '<i class="fa fa-xmark text-danger"></i>';
						},
						headerFilter: 'tickCross',
						headerFilterParams:{ tristate: true },
						headerFilterFunc: function(headerValue, rowValue) {
							return headerValue === ""
								? true // Show all
								: headerValue === true
									? (rowValue !== null && rowValue !== undefined && rowValue !== "") // Show numbers
									: (rowValue === null || rowValue === ""); // Show null
						},
						width: 70,
						hozAlign: 'center'
					}
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

			this.$refs.softwareanforderungForm.openModalLvToSw(selectedData, this.selectedStudiensemester);
		},
		onFormClosed(){
			// Deselect all rows
			this.table.deselectRow();
		},
		setTableData(){
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getLvsByStgOe' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
			)
		},
		replaceTableData(){
			this.table.replaceData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getLvsByStgOe' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
			)
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungNachLvTable.tabulator;

			this.setTableData();
			// Await phrases categories
			await this.$p.loadCategory(['lehre']);

			// Replace column titles with phrasen
			this.table.updateColumnDefinition('lv_bezeichnung', {title: this.$p.t('lehre', 'lehrveranstaltung')});
			this.table.updateColumnDefinition('stg_bezeichnung', {title: this.$p.t('lehre', 'studiengang')});

		},
	},
	template: `
<div class="softwareanforderungNachLv overflow-hidden">
	<div class="row d-flex my-3">
		<div class="col-12 h4">Software bestellen für einzelne LVs {{ selectedStudiensemester }} </div>
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
