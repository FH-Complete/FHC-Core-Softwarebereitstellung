import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import CoreFormInput from "../../../../../../js/components/Form/Input.js";
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import SoftwarelizenzanforderungForm from "../../Form/Softwarelizenzanforderung.js";
import SoftwareaenderungForm from "../../Form/Softwareaenderung.js";

export default {
	components: {
		CoreFilterCmpt,
		CoreFormInput,
		SoftwarelizenzanforderungForm,
		SoftwareaenderungForm
	},
	inject: ['STUDIENSEMESTER_DROPDOWN_STARTDATE'],
	data: function() {
		return {
			table: null,	// tabulator instance
			studiensemester: [],
			selectedStudiensemester: '',
			totalLizenzanzahl: 0,
			cbGroupStartOpen: true,	// checkbox group organisationseinheit start open
			bearbeitungIsGesperrt: false
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
						visible: true,
						width: 70,
						hozAlign: 'center'
					},
					{title: 'Erstellt von', field: 'insertvon', headerFilter: true, visible: false},
					{title: 'Erstellt am', field: 'insertamum', headerFilter: true, visible: false},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true, width: 270},
					{title: 'STG Kurzbz', field: 'stg_typ_kurzbz', headerFilter: true, visible:true, width: 70},
					{title: 'SW-Typ Kurzbz', field: 'softwaretyp_kurzbz', headerFilter: true, visible: false},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true, visible: false, },
					{title: 'OrgForm', field: 'orgform_kurzbz', headerFilter: true, width: 70},
					{title: 'Semester', field: 'semester', headerFilter: true, hozAlign: 'right', width: 50},
					{title: 'LE-Gruppen', field: 'lehreinheitgruppen_bezeichnung', headerFilter: true, width: 200},
					{title: 'SW-Typ', field: 'softwaretyp_bezeichnung', headerFilter: true, width: 200},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right', width: 100},
					{title: 'Software-Status', field: 'softwarestatus_bezeichnung', headerFilter: true,
						formatter: (cell) => {
							const { softwarestatus_kurzbz, softwarestatus_bezeichnung } = cell.getRow().getData();

							// Format Softwarestatus Bezeichnung red if status is End of Life or Nicht verfuegbar
							return (softwarestatus_kurzbz === 'endoflife' || softwarestatus_kurzbz === 'nichtverfuegbar')
								? `<span class="text-danger">${softwarestatus_bezeichnung}</span>`
								: softwarestatus_bezeichnung;
						}
					},
					{title: 'Softwarestatus Kurzbz', field: 'softwarestatus_kurzbz', headerFilter: true, visible: false},
					{title: 'User-Anzahl', field: 'anzahl_lizenzen', headerFilter: true, width: 100,
						hozAlign: 'right', frozen: true, editor:"number",
						editorParams:{
							min:0,
							max:100,
							step:10,
							elementAttributes:{
								maxlength:"3",
							},
							selectContents:true,
							verticalNavigation:"table", //up and down arrow keys navigate away from cell without changing value
						},
						editable: true,
					},
					{title: this.$p.t('global/aktionen'), field: 'actions',
						width: 80,
						formatter: (cell, formatterParams, onRendered) => {
							let container = document.createElement('div');
							container.className = "d-flex gap-2";

							let button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-edit"></i>';
							button.disabled = this.bearbeitungIsGesperrt;
							button.addEventListener('click', (event) =>
								this.editSwLvZuordnung(cell.getRow())
							);
							container.append(button);

							button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-xmark"></i>';
							button.disabled = this.bearbeitungIsGesperrt;
							button.addEventListener('click', () =>
								this.deleteSwLvs(cell.getRow().getIndex())
							);
							container.append(button);

							return container;
						},
						frozen: true
					}
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
		editSwLvZuordnung(row){
			// If selected row is a Quellkurs
			if (row.getData().lehrtyp_kurzbz === 'tpl')
			{
				this.$refs.softwareaenderungForm.openModalUpdateSwByTemplate(row.getData(), this.selectedStudiensemester);
			}
			// Else its a simple LV
			else
			{
				this.$refs.softwareaenderungForm.openModalUpdateSwByLv(row.getData(), this.selectedStudiensemester);
			}
		},
		async deleteSwLvs(software_lv_id){
			if (!await this.$fhcAlert.confirmDelete()) return;

			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/deleteSwLvs', {
					software_lv_id: software_lv_id,
					studiensemester_kurzbz: this.selectedStudiensemester
				})
				.then((result) => this.reloadTabulator())
				.then(() => this.$fhcAlert.alertSuccess('Gelöscht'))
				.catch((error) => this.$fhcAlert.handleSystemError(error));
		},
		onCellEdited(cell){
			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/updateLizenzanzahl', [{
					software_lv_id: cell.getData().software_lv_id,
					lizenzanzahl: cell.getData().anzahl_lizenzen,
				}])
				.then(() => this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert')))
				.catch((error) => this.$fhcAlert.handleSystemError(error));
		},
		onChangeStudiensemester(){
			// Reset table data
			this.table
				.setData(CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSwLvsRequestedByLv' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				))
				.then(() => this.checkBearbeitungIsGesperrt());
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
		reloadTabulator() {
			if (this.$refs.softwareanforderungTable.tabulator !== null && this.$refs.softwareanforderungTable.tabulator !== undefined)
			{
				for (let option in this.tabulatorOptions)
				{
					if (this.$refs.softwareanforderungTable.tabulator.options.hasOwnProperty(option))
						this.$refs.softwareanforderungTable.tabulator.options[option] = this.tabulatorOptions[option];
				}
				this.$refs.softwareanforderungTable.reloadTable();
			}
		},
		async checkBearbeitungIsGesperrt(){
			await this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/checkIfBearbeitungIsGesperrt', {
					studiensemester_kurzbz: this.selectedStudiensemester
				})
				.then((result) => this.bearbeitungIsGesperrt = result.data)
				.then(() => this.table.redraw(true) ) // Redraw the table to disable/enable action buttons
				.catch((error) => { this.$fhcAlert.handleSystemError(error) });
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungTable.tabulator;

			// Await Studiensemester
			await this.loadAndSetStudiensemester();

			await this.checkBearbeitungIsGesperrt();

			// Set table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSwLvsRequestedByLv' +
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
		<div class="col-10 h4">{{ $p.t('global/softwarebereitstellungSubtitle') }} - Für einzelne LVs</div>
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
				:tabulator-events="[
					{event: 'tableBuilt', handler: onTableBuilt},
					{event: 'cellEdited', handler: onCellEdited}
				]"
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

	<softwareaenderung-form ref="softwareaenderungForm" @on-saved="reloadTabulator()"></softwareaenderung-form>
</div>
`
};
