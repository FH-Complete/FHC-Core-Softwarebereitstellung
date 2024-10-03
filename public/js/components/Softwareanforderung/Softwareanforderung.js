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
	inject: ['STUDIENSEMESTER_DROPDOWN_STARTDATE'],
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
				autoResize:false, // prevent auto resizing of table
				resizableColumnFit:true, //maintain the fit of columns when resizing
				index: 'software_lv_id',
				groupBy: ["stg_bezeichnung", "stg_typ_bezeichnung"],
				groupToggleElement:"header", //toggle group on click anywhere in the group header
				groupClosedShowCalcs:true, //show column calculations when a group is closed
				groupStartOpen: self.cbGroupStartOpen,
				groupHeader: (value, count, data, group) => {
					return self.calculateByGroupHeader(value, count, data, group);
				},
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
					{title: 'SW-LV-ID', field: 'software_lv_id', headerFilter: true, visible: false},
					{title: 'SW-ID', field: 'software_id', headerFilter: true, visible: false},
					{title: 'LV-ID', field: 'lehrveranstaltung_id', headerFilter: true, visible: false},
					{title: 'Studiensemester', field: 'studiensemester_kurzbz', headerFilter: true, visible:false},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false},
					{title: 'STG KZ', field: 'studiengang_kz', headerFilter: true, visible:false},
					{title: 'STG Kurzbz', field: 'stg_typ_kurzbz', headerFilter: true, visible:true, width: 70},
					{
						title: 'Standardisiert',
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
						visible: true,
						width: 70,
						hozAlign: 'center'
					},
					{title: 'SW-Typ Kurzbz', field: 'softwaretyp_kurzbz', headerFilter: true, visible: false},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true, visible: false, },
					{title: 'OrgForm', field: 'orgform_kurzbz', headerFilter: true, width: 70},
					{title: 'Semester', field: 'semester', headerFilter: true, hozAlign: 'right', width: 50},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true},
					{title: 'LE-Gruppen', field: 'lehreinheitgruppen_bezeichnung', headerFilter: true, width: 200},
					{title: 'SW-Typ', field: 'softwaretyp_bezeichnung', headerFilter: true},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right', width: 70},
					{title: 'Software-Status', field: 'softwarestatus_bezeichnung', headerFilter: true},
					{title: 'User-Anzahl', field: 'anzahl_lizenzen', headerFilter: true,
						hozAlign: 'right', frozen: true}
				]
			}
		}
	},
	methods: {
		async loadAndSetStudiensemester(){
			const result = await this.$fhcApi
				.get('api/frontend/v1/organisation/Studiensemester/getAll', {start: this.STUDIENSEMESTER_DROPDOWN_STARTDATE})
				.then( result => this.studiensemester = result.data )
				.then( () => this.$fhcApi.get('api/frontend/v1/organisation/Studiensemester/getAktNext') ) // Get actual Studiensemester
				.then( result =>  this.selectedStudiensemester = result.data[0].studiensemester_kurzbz ) // Preselect Studiensemester
				.catch(error => this.$fhcAlert.handleSystemError(error) );
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
			  <div class="d-inline fw-normal">${value}</div>
			  <div class="d-inline float-end fw-normal">Anteil KF: ${percentageShare}%  |  \u2211 ${oeLizenzanzahl}</div>
		  	`;
		},
		onChangeStudiensemester(){
			// Reset table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSwLvZuordnungen' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
			);
		},
		openModalChangeLicense(){
			let selectedData = this.table.getSelectedData();

			if (selectedData.length == 0)
			{
				this.$fhcAlert.alertWarning( this.$p.t('global/zeilenAuswaehlen'));
				return;
			}

			this.$refs.softwarelizenzanforderungForm.openModalChangeLicense(selectedData, this.selectedStudiensemester);
		},
		openModalAnforderungenVorruecken(){
			let selectedData = this.table.getSelectedData();

			if (selectedData.length == 0)
			{
				this.$fhcAlert.alertWarning( this.$p.t('global/zeilenAuswaehlen'));
				return;
			}

			this.$refs.softwarelizenzanforderungForm.openModalAnforderungenVorruecken(selectedData, this.selectedStudiensemester);
		},
		onFormClosed(){
			// Deselect all rows
			this.table.deselectRow();

			// Reset data
			this.table.setData();
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungTable.tabulator;

			// Await Studiensemester
			await this.loadAndSetStudiensemester();

			// Set table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSwLvZuordnungen' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
			);

			// Await phrases categories
			await this.$p.loadCategory(['global', 'lehre']);

			// Replace column titles with phrasen
			this.table.updateColumnDefinition('lv_bezeichnung', {title: this.$p.t('lehre', 'lehrveranstaltung')});
			this.table.updateColumnDefinition('orgform_kurzbz', {title: this.$p.t('lehre', 'organisationsform')});
			this.table.updateColumnDefinition('softwaretyp_kurzbz', {title: this.$p.t('global', 'softwaretypKurzbz')});
			this.table.updateColumnDefinition('studiensemester_kurzbz', {title: this.$p.t('lehre', 'studiensemester')});
			this.table.updateColumnDefinition('softwaretyp_bezeichnung', {title: this.$p.t('global', 'softwaretyp')});
			this.table.updateColumnDefinition('anzahl_lizenzen', {title: this.$p.t('global', 'userAnzahl')});

		}
	},
	template: `
<div class="softwareanforderung overflow-hidden">
	<!-- Title and Studiensemester Dropdown-->
	<div class="row d-flex my-3">
		<div class="col-10 h4">{{ $p.t('global/softwareanforderungSubtitle') }}</div>
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
					<button class="btn btn-primary" @click="openModalChangeLicense">{{ $p.t('global/userAnzahlAendern') }}</button>
					<button class="btn btn-outline-secondary dropdown-toggle" type="button" id="statusDropdown" data-bs-toggle="dropdown" aria-expanded="false">
						{{ $p.t('ui/aktion') }}
					</button>
					<ul class="dropdown-menu" aria-labelledby="statusDropdown">
						<li>
							<a class="dropdown-item" href="#"
								@click="openModalAnforderungenVorruecken">
								{{ $p.t('global/anforderungenVorruecken') }}
							</a>
						</li>
					</ul>
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
