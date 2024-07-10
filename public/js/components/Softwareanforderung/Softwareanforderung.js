import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import CoreFormInput from "../../../../../js/components/Form/Input.js";
import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import SoftwarelizenzanforderungForm from "../Form/Softwarelizenzanforderung.js";

export default {
	components: {
		CoreFilterCmpt,
		CoreFormInput,
		SoftwarelizenzanforderungForm
	},
	data: function() {
		return {
			table: null,	// tabulator instance
			studiensemester: [],
			selectedStudiensemester: '',
			totalLizenzanzahl: 0,
			cbGroupStartOpen: true,	// checkbox group organisationseinheit start open
		}
	},
	watch: {
		cbGroupStartOpen(newVal){
			this.table.setGroupStartOpen(newVal);
			this.table.setData();
		}
	},
	computed: {
		tabulatorOptions() {
			const self = this;
			return {
				// NOTE: data is set on table built to await preselected actual Studiensemester
				ajaxResponse(url, params, response){
					self.setTotalLizenzanzahl(response.data);
					return response.data
				},
				layout: 'fitColumns',
				index: 'software_lv_id',
				groupBy: "lv_oe_bezeichnung",
				groupToggleElement:"header", //toggle group on click anywhere in the group header
				groupClosedShowCalcs:true, //show column calculations when a group is closed
				groupStartOpen: self.cbGroupStartOpen,
				groupHeader: (value, count, data, group) => {
					return self.calculateByGroupHeader(value, count, data, group);
				},
				selectable: true,
				selectableRangeMode: 'click',
				columns: [
					{
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						titleFormatterParams: { rowRange: "active"},
						width: 70
					},
					{title: 'SW-LV-ID', field: 'software_lv_id', headerFilter: true, visible: false},
					{title: 'SW-ID', field: 'software_id', headerFilter: true, visible: false},
					{title: 'LV-ID', field: 'lehrveranstaltung_id', headerFilter: true, visible: false},
					{title: 'Studiensemester', field: 'studiensemester_kurzbz', headerFilter: true, visible:false},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false},
					{title: 'STG Kurzbz', field: 'studiengang_kurzbz', headerFilter: true, visible:false},
					{title: 'SW-Typ Kurzbz', field: 'softwaretyp_kurzbz', headerFilter: true, visible: false},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true, visible: false, },
					{title: 'Studiengang', field: 'stg_bezeichnung', headerFilter: true},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true},
					{title: 'Semester', field: 'semester', headerFilter: true, hozAlign: 'right', width: 70},
					{title: 'SW-Typ', field: 'softwaretyp_bezeichnung', headerFilter: true},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right', width: 70},
					{title: 'Software-Status', field: 'softwarestatus_bezeichnung', headerFilter: true},
					{title: 'Lizenzanzahl', field: 'anzahl_lizenzen', headerFilter: true,
						hozAlign: 'right', frozen: true}
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
		setTotalLizenzanzahl(data){
			this.totalLizenzanzahl = data.reduce((sum, row) => sum + row.anzahl_lizenzen, 0);
			
		},
		calculateByGroupHeader(value, count, data, calcParams){
			// Extract the values for the current group
			const values = data.map(item => item.anzahl_lizenzen);

			// Sum Lizenzanzahl of all Lehrveranstaltungen to get total sum by OE
			let oeLizenzanzahl = values.reduce((sum, value) => sum + value, 0);

			// Calculate OE percentage share of allover total Lizenzanzahl
			let percentageShare = (oeLizenzanzahl / this.totalLizenzanzahl * 100).toFixed(2);
			percentageShare = isNaN(percentageShare) ? '0' : percentageShare;

			// Return Bootstrap 5 div
			return `
				<div class="d-flex w-100 justify-content-between align-items-center">
				  <div>${value}</div>
				  <div class="ms-auto">Anteil DEP: ${percentageShare}%  |  \u2211 ${oeLizenzanzahl}</div>
				</div>
		  	`;
		},
		onChangeStudiensemester(){
			// Reset table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSoftwareLvZuordnungen' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
			);
		},
		openSoftwarelizenzanforderungForm(){
			let selectedData = this.table.getSelectedData();

			if (selectedData.length == 0)
			{
				this.$fhcAlert.alertWarning( this.$p.t('global/zeilenAuswaehlen'));
				return;
			}

			this.$refs.softwarelizenzanforderungForm.openModalChangeLicense(selectedData, this.selectedStudiensemester);
		},
		onFormClosed(){
			// Deselect all rows
			this.table.deselectRow();
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungTable.tabulator;

			// Await Studiensemester
			await this.loadAndSetStudiensemester();

			// Set table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSoftwareLvZuordnungen' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
			);

			// Await phrases categories
			await this.$p.loadCategory(['global', 'lehre']);

			// Replace column titles with phrasen
			this.table.updateColumnDefinition('lv_bezeichnung', {title: this.$p.t('lehre', 'lehrveranstaltung')});
			this.table.updateColumnDefinition('stg_bezeichnung', {title: this.$p.t('lehre', 'studiengang')});
			this.table.updateColumnDefinition('softwaretyp_kurzbz', {title: this.$p.t('global', 'softwaretypKurzbz')});
			this.table.updateColumnDefinition('studiensemester_kurzbz', {title: this.$p.t('lehre', 'studiensemester')});
			this.table.updateColumnDefinition('softwaretyp_bezeichnung', {title: this.$p.t('global', 'softwaretyp')});
			this.table.updateColumnDefinition('anzahl_lizenzen', {title: this.$p.t('global', 'lizenzAnzahl')});

		}
	},
	template: `
<div class="softwareanforderung overflow-hidden">
	<!-- Title and Studiensemester Dropdown-->
	<div class="row d-flex my-3">
		<div class="col-10 h4">{{ $p.t('global/swAnforderungenUndLizenen') }}</div>
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
	<!-- Table-->
	<div class="row mb-5">
		<div class="col">
			<core-filter-cmpt
				ref="softwareanforderungTable"
				uniqueId="softwareanforderungTable"
				table-only
				reload
				:side-menu="false"
				:tabulator-options="tabulatorOptions"
				:tabulator-events="[{event: 'tableBuilt', handler: onTableBuilt}]"
				:download="[{ formatter: 'csv', file: 'software.csv', options: {delimiter: ';', bom: true} }]">
				<template v-slot:actions>
					<button class="btn btn-primary" @click="openSoftwarelizenzanforderungForm">{{ $p.t('global/lizenzanzahlAendern') }}</button>
					<div class="form-check form-check-inline ms-3">
						<input
							class="form-check-input"
							type="checkbox"
							v-model="cbGroupStartOpen">
						<label class="form-check-label">{{ $p.t('global/aufgeklappt') }}</label>
					</div>
				</template>		
			</core-filter-cmpt>		
		
		</div>
	</div>
	
	<!-- Form -->
	<softwarelizenzanforderung-form ref="softwarelizenzanforderungForm" @form-closed="onFormClosed"></softwarelizenzanforderung-form>
</div>
`
};
