import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import CoreFormInput from "../../../../../js/components/Form/Input.js";
import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import SoftwareanforderungForm from "../Form/Softwareanforderung.js";

export default {
	components: {
		CoreFilterCmpt,
		CoreFormInput,
		SoftwareanforderungForm
	},
	data: function() {
		return {
			table: null,
			studiensemester: [],
			selectedStudiensemester: ''
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
					{title: 'STG Kurzbz', field: 'studiengang_kurzbz', headerFilter: true, visible:false},
					{title: 'Studiengang', field: 'stg_bezeichnung', headerFilter: true, width: 250},
					{title: 'Studiengangtyp', field: 'stg_typ_bezeichnung', headerFilter: true, width: 250},
					{title: 'OrgForm', field: 'orgform_kurzbz', headerFilter: true, width: 100},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true, minWidth: 250},
					{title: 'Semester', field: 'semester', headerFilter: true, width: 70},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false, minWidth: 80},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true, minWidth: 200}
				]
			}
		}
	},
	methods: {
		async loadAndSetStudiensemester(){
			const result = await this.$fhcApi
				.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getAllSemester')
				.then( result => {
					this.studiensemester = result.data;
					const now = new Date();

					// Get actual Studiensemester
					const currentSemester = this.studiensemester.find(semester => {
						const startDate = new Date(semester.start);
						const endDate = new Date(semester.ende);
						return startDate <= now && endDate >= now;
					});

					// Preselect Studiensemester
					this.selectedStudiensemester = currentSemester
						? currentSemester.studiensemester_kurzbz
						: '';
				})
				.catch( this.$fhcAlert.handleSystemError );
		},
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
		onChangeStudiensemester(){
			// Reset table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getLehrveranstaltungen' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
			);
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungNachLvTable.tabulator;

			// Await Studiensemester
			await this.loadAndSetStudiensemester();

			// Set table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getLehrveranstaltungen' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
			);

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
		<div class="col-10 h4">{{ $p.t('global/swAnforderungUeberAuswahlVonLvs') }}</div>
		<div class="col-2 ms-auto">
			<core-form-input
				type="select"
				v-model="selectedStudiensemester"
				name="studiensemester"
				@change="onChangeStudiensemester">
				<option 
				v-for="(studSem, index) in studiensemester"
				:key="index" 
				:value="studSem.studiensemester_kurzbz">
					{{studSem.studiensemester_kurzbz}}
				</option>
			</core-form-input>
		</div>
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
