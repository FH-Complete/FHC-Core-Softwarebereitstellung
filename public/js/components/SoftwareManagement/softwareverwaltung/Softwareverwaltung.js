import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import SoftwareModal from "../../Modals/SoftwareModal.js";
import {Actions} from "./Actions.js";
import {Raumzuordnung} from "../Raumzuordnung.js";

export default {
	componentName: 'Softwareverwaltung',
	components: {
		CoreFilterCmpt,
		SoftwareModal,
		Actions,
		Raumzuordnung
	},
	data: function() {
		return {
			languageIndex: null, // language of current user
			showHierarchy: false, // display data as hierarchy tree or not
			selectedTabulatorRow: null, // currently selected tabulator row
			softwarestatus: null,
			software_kurzbz: ''
		}
	},
	computed: {
		softwareTabulatorOptions() {
			return {// tabulator options which can be modified after first render
				index: 'software_id',
				layout: 'fitColumns',
				autoResize:false, // prevent auto resizing of table
				resizableColumnFit:true, //maintain the fit of columns when resizing
				dataTreeStartExpanded: true,
				dataTreeSelectPropagate: true, //propagate selection events from parent rows to children
				columns: [
					{
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						titleFormatterParams: { rowRange: "active"},
						width: 70,
						frozen: true
					},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true,
						width: 150,
						minWidth: 100,
						maxWidth: 200,
						frozen: true
					},
					{
						title: this.$p.t('global/softwaretyp'),
						field: 'softwaretyp_bezeichnung',
						headerFilter: true,
						formatter: (cell) => {
							return cell.getValue()[this.languageIndex - 1];
						}
					},
					{title: this.$p.t('global/softwaretypKurzbz'), field: 'softwaretyp_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right', width: 100},
					{title: this.$p.t('global/beschreibung'), field: 'beschreibung', headerFilter: true},
					{title: this.$p.t('global/hersteller'), field: 'hersteller', headerFilter: true},
					{title: this.$p.t('global/betriebssystem'), field: 'os', headerFilter: true},
					{title: this.$p.t('global/verantwortliche'), field: 'verantwortliche', headerFilter: true},
					{title: this.$p.t('global/lizenzkategorieKurzbz'), field: 'lizenzkategorie_kurzbz', visible: false, headerFilter: true},
					{title: this.$p.t('global/lizenzkategorie'), field: 'lizenzkategorie_bezeichnung', visible: false, headerFilter: true},
					{title: this.$p.t('global/lizenzart'), field: 'lizenzart', headerFilter: true},
					{title: this.$p.t('global/lizenzserver'), field: 'lizenzserver_kurzbz', headerFilter: true},
					{title: this.$p.t('global/lizenzserverPort'), field: 'lizenzserver_port', headerFilter: true},
					{title: this.$p.t('global/userAnzahl'), field: 'anzahl_lizenzen', headerFilter: true, hozAlign: 'right', width: 100},
					{title: this.$p.t('global/lizenzLaufzeit'), field: 'lizenzlaufzeit', headerFilter: true},
					{title: this.$p.t('global/lizenzKosten'), field: 'lizenzkosten', headerFilter: true, hozAlign: 'right', formatter: "money", formatterParams: { symbol: "€", precision: 2, thousand: ".", decimal: "," }},
					{title: this.$p.t('global/anmerkungIntern'), field: 'anmerkung_intern', headerFilter: true},
					{title: 'Software-ID', field: 'software_id', headerFilter: true},
					{title: 'Übergeordnete Software ID', field: 'software_id_parent', headerFilter: true},
					{title: this.$p.t('global/uebergeordneteSoftware'), field: 'software_kurzbz_parent', headerFilter: true},
					{title: this.$p.t('global/insertamum'), field: 'insertamum', hozAlign:"center", headerFilter: true},
					{title: this.$p.t('global/insertvon'), field: 'insertvon', headerFilter: true},
					{title: this.$p.t('global/updateamum'), field: 'updateamum', hozAlign:"center", headerFilter: true},
					{title: this.$p.t('global/updatevon'), field: 'updatevon', headerFilter: true},
					{title: 'Software-Status', field: 'softwarestatus_kurzbz',
						editor: "list",
						editorParams:{ valuesLookup: this.getSoftwarestatus },
						headerFilter: true,
						headerFilterParams:{ valuesLookup: this.getSoftwarestatus },
						formatter: (cell) => this.softwarestatus
							? this.softwarestatus[cell.getValue()]
							: cell.getData().softwarestatus_bezeichnung[this.languageIndex - 1],
						width: 150,
						minWidth: 150,
						maxWidth: 150,
						frozen: true
					},
					{
						title: this.$p.t('global/aktionen'),
						field: 'actions',
						width: 220,
						minWidth: 220,
						maxWidth: 220,
						formatter: (cell, formatterParams, onRendered) => {
							let container = document.createElement('div');
							container.className = "d-flex gap-2";

							let button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = this.$p.t('global/raumverfuegbarkeit');
							button.addEventListener('click', (event) => this.openRaumzuordnung(event, cell.getRow()));
							container.append(button);

							button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-edit"></i>';
							button.addEventListener('click', (event) => this.editSoftware(event, cell.getRow().getIndex()));
							container.append(button);

							button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-xmark"></i>';
							button.addEventListener('click', () => this.deleteSoftware(cell.getRow().getIndex()));
							container.append(button);

							return container;
						},
						frozen: true
					}
				]
			}
		},
	},
	beforeCreate() {
		CoreRESTClient
			.get('/extensions/FHC-Core-Softwarebereitstellung/components/Software/getLanguageIndex', null)
			.then(result => result.data)
			.then(result => { this.languageIndex = CoreRESTClient.getData(result);})
			.catch( error => this.$fhcAlert.handleSystemError(error) );
	},
	methods: {
		handleHierarchyViewChange(showHierarchy) {
			this.showHierarchy = showHierarchy;
			this.reloadTabulator();
		},
		handleHierarchyExpansion(expandHierarchy) {
			this.softwareTabulatorOptions.dataTreeStartExpanded = expandHierarchy;
			this.reloadTabulator();
		},
		openModal(event, softwareId) {
			this.$refs.modalForSave.openSoftwareModal(softwareId);
		},
		handleSoftwareSaved() {
			this.$refs.modalForSave.hide();
			this.$refs.softwareTable.reloadTable();
			// reload Raumzuordnung data
			this.getSoftwareRowDetails();
		},
		getSoftwareRowDetails() {
			if (!this.selectedTabulatorRow) return;

			// get Orte for a software
			this.$refs.raumzuordnung.getOrteBySoftware(this.selectedTabulatorRow.getIndex(), this.selectedTabulatorRow.getData().software_kurzbz);

			// get Softwarekurzbz
			this.software_kurzbz = this.selectedTabulatorRow.getData().software_kurzbz;
		},
		getSoftwarestatus() {
			return CoreRESTClient
				.get('/extensions/FHC-Core-Softwarebereitstellung/components/Software/getStatus')
				.then(result => result.data)
				.then(result => {
					// Reduce array of objects into one object
					return this.softwarestatus = CoreRESTClient.getData(result).reduce((o, x) => {
						o[x.softwarestatus_kurzbz] = x.bezeichnung;
						return o;
					}, {});
				})
				.catch(error => this.$fhcAlert.handleSystemError(error));
		},
		changeStatus(softwarestatus_kurzbz, software_id = null) {
			let software_ids = [];

			// If software_id is provided
			if (software_id !== null)
			{
				software_ids.push(software_id);
			}
			// Else get software_id of selected rows
			else
			{
				let selectedData = this.$refs.softwareTable.tabulator.getSelectedData();

				if (selectedData.length == 0)
				{
					this.$fhcAlert.alertWarning( this.$p.t('global/zeilenAuswaehlen'));
					return;
				}

				software_ids = selectedData.map(data => data.software_id);
			}

			CoreRESTClient
				.post(
					'/extensions/FHC-Core-Softwarebereitstellung/components/Software/changeSoftwarestatus',
					{
						software_ids: software_ids,
						softwarestatus_kurzbz: softwarestatus_kurzbz
					}
				)
				.then(result => result.data)
				.then(result => {
					if (result.retval.parentArray.length > 0)
					{
						// Sticky success msg
						this.$fhcAlert.alertDefault('success', 'Info', this.$p.t('global/gespeichert'), true);

						// Sticky info msg
						this.$fhcAlert.alertDefault(
							'info',
							this.$p.t('global/statusErfolgreichUebertragen'),
							this.$p.t('global/statusUebertragenMsg', {
								status: softwarestatus_kurzbz,
								parentSoftware: result.retval.parentArray.join(', ')
							}),
							true
						);
					}
					else
					{
						this.$fhcAlert.alertSuccess(this.$p.t('global/gespeichert'));
					}

					this.$refs.softwareTable.reloadTable(); }) // TODO use row update instead of reloadTable after solving datatree issues
				.catch( error => this.$fhcAlert.handleSystemError(error));
		},
		editSoftware(event, software_id){
			this.openModal(event, software_id);
		},
		async deleteSoftware(software_id) {

			if (await this.$fhcAlert.confirmDelete() === false) return;

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/deleteSoftware',
				{
					software_id: software_id
				})
				.then(result => result.data)
				.then(result => {
					if (CoreRESTClient.isError(result))
					{
						this.$fhcAlert.alertDefault('warn', 'Löschen nicht möglich', result.retval[0], true);
					}
					else
					{
						this.$fhcAlert.alertSuccess(this.$p.t('global/geloescht'));
						this.$refs.softwareTable.reloadTable();
					}
				}
			).catch(error => this.$fhcAlert.handleSystemError(error));
		},
		promoteChildren(children, resultArr) {
			for (let child of children) {
				// add child to result array
				resultArr.push(child);

				// if other children, descend into next level
				if (child._children)
				{
					this.promoteChildren(child._children, resultArr);
					// remove children from this level
					delete child._children;
				}
			}
		},
		reloadTabulator() {
			if (this.$refs.softwareTable.tabulator !== null && this.$refs.softwareTable.tabulator !== undefined)
			{
				for (let option in this.softwareTabulatorOptions)
				{
					if (this.$refs.softwareTable.tabulator.options.hasOwnProperty(option))
						this.$refs.softwareTable.tabulator.options[option] = this.softwareTabulatorOptions[option];
				}
				this.$refs.softwareTable.reloadTable();
			}
		},
		onTableCellEdited(cell){
			this.changeStatus(cell.getValue(), cell.getRow().getIndex());
		},
		openRaumzuordnung(e, row){
			// save currently clicked row
			this.selectedTabulatorRow = row;

			// get row data
			this.getSoftwareRowDetails();

			let offcanvasElement = new bootstrap.Offcanvas(document.getElementById('softwareverwaltungOffcanvas'));
			offcanvasElement.show();
		},
		onTableDataLoaded(data){
			// no promoting of children if hierarchy shown
			if (this.showHierarchy == false)
			{
				let allChildrenArr = [];

				// loop through all data
				for (let child of data)
				{
					// if it has children
					if (child._children)
					{
						// promote children, i.e. put them on 0 level
						this.promoteChildren(child._children, data);

						// remove children from lower level
						delete child._children;
					}
				}
				// Resort data
				data.sort((a, b) => {
					let sort = a.software_kurzbz.localeCompare(b.software_kurzbz);

					if (sort == 0) sort = b.version - a.version;
					if (sort == 0) sort = b.software_id - a.software_id;

					return sort;
				});
			}
		}
	},
	template: `
	<div class="softwareVerwaltung overflow-hidden">
		<!-- Software Verwaltung Table -->
		<div class="row mb-5">
			<div class="col">
				<core-filter-cmpt
					ref="softwareTable"
					filter-type="SoftwareManagement"
					uniqueId="softwareTable"
					:tabulator-options="softwareTabulatorOptions"
					:tabulator-events="[
						{event: 'cellEdited', handler: onTableCellEdited},
						{event: 'rowClick', handler: onTableRowClick},
						{event: 'dataLoaded', handler: onTableDataLoaded}
					]"
					:side-menu="false"
					new-btn-label="Software"
					new-btn-show
					:id-field="'software_id'"
					:parent-id-field="'software_id_parent'"
					:download="[{ formatter: 'csv', file: 'software.csv', options: {delimiter: ';', bom: true} }]"
					@click:new="openModal">
					<template v-slot:actions>
						<actions
							:softwarestatus="softwarestatus"
							:expand-hierarchy="softwareTabulatorOptions.dataTreeStartExpanded"
							 @set-status="changeStatus"
							 @hierarchy-view-changed="handleHierarchyViewChange"
							 @hierarchy-expansion-changed="handleHierarchyExpansion"/>
						 </actions>
					 </template>
				</core-filter-cmpt>
				<!-- Software Details -->
				
				
			</div>
		</div>
		<!-- Software Details -->
		<div class="offcanvas offcanvas-start w-50" tabindex="-1" id="softwareverwaltungOffcanvas">
			<div class="offcanvas-header">
				<button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
			</div>
			<raumzuordnung ref="raumzuordnung"></raumzuordnung>
		</div>
		<!-- Software modal component -->
		<software-modal
				class="fade"
				ref="modalForSave"
				dialog-class="modal-xl"
				@software-saved="handleSoftwareSaved">
			</software-modal>
	</div>
`
};
