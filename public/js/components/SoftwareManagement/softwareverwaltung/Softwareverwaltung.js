import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import SoftwareModal from "../../Modals/SoftwareModal.js";
import {Actions} from "./Actions.js";
import {Raumzuordnung} from "../Raumzuordnung.js";

export const Softwareverwaltung = {
	componentName: 'Softwareverwaltung',
	components: {
		CoreFilterCmpt,
		SoftwareModal,
		Actions,
		Raumzuordnung
	},
	data: function() {
		return {
			softwareTabulatorOptions: { // tabulator options which can be modified after first render
				index: 'software_id',
				maxHeight: "100%",
				minHeight: 50,
				layout: 'fitColumns',
				columnDefaults:{
					tooltip:true,
				},
				dataTreeStartExpanded: true,
				dataTreeSelectPropagate: true, //propagate selection events from parent rows to children
				columns: [
					{
						field: 'software_kurzbz',
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						width: 50,
						headerSort: false,
						frozen: true
					},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true, frozen: true},
					{
						title: 'Softwaretyp',
						field: 'softwaretyp_bezeichnung',
						headerFilter: true,
						formatter: (cell) => {
							return cell.getValue()[this.languageIndex - 1];
						}
					},
					{title: 'Softwaretyp Kurzbezeichnung', field: 'softwaretyp_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right'},
					{title: 'Beschreibung', field: 'beschreibung', headerFilter: true},
					{title: 'Hersteller', field: 'hersteller', headerFilter: true},
					{title: 'Betriebssystem', field: 'os', headerFilter: true},
					{title: 'Verantwortliche', field: 'verantwortliche', headerFilter: true},
					{title: 'Lizenz-Art', field: 'lizenzart', headerFilter: true},
					{title: 'Lizenz-Server', field: 'lizenzserver_kurzbz', headerFilter: true},
					{title: 'Lizenz-Anzahl', field: 'anzahl_lizenzen', headerFilter: true},
					{title: 'Lizenz-Laufzeit', field: 'lizenzlaufzeit', headerFilter: true},
					{title: 'Lizenz-Kosten', field: 'lizenzkosten', headerFilter: true, hozAlign: 'right', formatter: "money", formatterParams: { symbol: "€", precision: 2, thousand: ".", decimal: "," }},
					{
						title: 'Status',
						field: 'softwarestatus_kurzbz',
						editor: "list",
						editorParams:{values:[]},
						headerFilter: true,
						headerFilterParams:{values:[]},
						formatter: (cell) => {
							return cell.getData().softwarestatus_bezeichnung[this.languageIndex - 1];
						}
					},
					{
						title: 'Softwarestatus Bezeichnung',
						field: 'softwarestatus_bezeichnung',
						headerFilter: true,
						formatter: (cell) => {
							return cell.getValue()[this.languageIndex - 1];
						}
					},
					{title: 'Anmerkung intern', field: 'anmerkung_intern', headerFilter: true},
					{title: 'ID', field: 'software_id', headerFilter: true},
					{title: 'Übergeordnete Software ID', field: 'software_id_parent', headerFilter: true},
					{title: 'Übergeordnete Software', field: 'software_kurzbz_parent', headerFilter: true},
					{title: 'Erstellt am', field: 'insertamum', hozAlign:"center", headerFilter: true},
					{title: 'Erstellt von', field: 'insertvon', headerFilter: true},
					{title: 'Geändert am', field: 'updateamum', hozAlign:"center", headerFilter: true},
					{title: 'Geändert von', field: 'updatevon', headerFilter: true},
					{
						title: 'Aktionen',
						field: 'actions',
						formatter: (cell, formatterParams, onRendered) => {
							let container = document.createElement('div');
							container.className = "d-flex gap-2";

							let button = document.createElement('button');
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
						}
					}
				]
			},
			languageIndex: null, // language of current user
			showHierarchy: false, // display data as hierarchy tree or not
			selectedTabulatorRow: null, // currently selected tabulator row
			softwarestatus: Array,
			software_kurzbz: ''
		}
	},
	beforeCreate() {
		CoreRESTClient.get(
			'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getStatus',
			null,
			{
				timeout: 2000
			}
		).then(
			result => {
				this.softwarestatus = CoreRESTClient.getData(result.data);

				// Populate Status column with editable Softwarestatus list.
				// NOTE: tabulator bugfixed transparent list in 5.2.3 release. (release notes)
				this.populateTabulatorColumnStatus(this.softwarestatus);
				this.reloadTabulator();
			}
		).catch(
			error => { this.$fhcAlert.handleSystemError(error); }
		);
		CoreRESTClient.get(
			'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getLanguageIndex',
			null,
			{
				timeout: 2000
			}
		).then(
			result => {
				this.languageIndex = CoreRESTClient.getData(result.data);
			}
		).catch(
			error => { this.$fhcAlert.handleSystemError(error); }
		);
	},
	mounted(){
		// set tabulator events

		// in-table status edit event
		this.$refs.softwareTable.tabulator.on("cellEdited", (cell) => {
			this.changeStatus(cell.getValue(), cell.getRow().getIndex());
		});

		// row click event (showing software details)
		this.$refs.softwareTable.tabulator.on("rowClick", (e, row) => {

			// exclude other clicked elements like buttons, icons...
			if (e.target.nodeName != 'DIV') return;

			// save currently clicked row
			this.selectedTabulatorRow = row;

			// get row data
			this.getSoftwareRowDetails();

			// Scroll to Detail
			window.scrollTo(0, this.$refs.softwareDetail.offsetTop);
		});

		this.$refs.softwareTable.tabulator.on("dataLoaded", data => {
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

		});
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
		populateTabulatorColumnStatus(status_arr) {
			// Modify format
			let result = status_arr.reduce((res, x) => {
				res[x.softwarestatus_kurzbz] = x.bezeichnung;
				return res;
			}, {});

			let statusCol = this.softwareTabulatorOptions.columns.find(col => col.field === 'softwarestatus_kurzbz');
			statusCol.editorParams = {values: result};
			statusCol.headerFilterParams = {values: result};
		},
		getSoftwareRowDetails() {
			if (!this.selectedTabulatorRow) return;

			// get Orte for a software
			this.$refs.raumzuordnung.getOrteBySoftware(this.selectedTabulatorRow.getIndex(), this.selectedTabulatorRow.getData().software_kurzbz);

			// get Softwarekurzbz
			this.software_kurzbz = this.selectedTabulatorRow.getData().software_kurzbz;
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
					this.$fhcAlert.handleSystemMessage( 'Bitte erst Zeilen auswählen');
					return;
				}

				software_ids = selectedData.map(data => data.software_id);
			}

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/changeSoftwarestatus',
				{
					software_ids: software_ids,
					softwarestatus_kurzbz: softwarestatus_kurzbz
				},
				{
					timeout: 2000
				}
			).then(
				result => {
					this.$refs.softwareTable.reloadTable(); // TODO use row update instead of reloadTable after solving datatree issues
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
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
				},
				{
					timeout: 2000
				}
			).then(
				result => {
					if (CoreRESTClient.isError(result.data))
					{
						this.$fhcAlert.handleSystemMessage(result.data.retval);
					}
					else
					{
						this.$fhcAlert.alertSuccess('Gelöscht!');
						this.$refs.softwareTable.reloadTable();
					}
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
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
			for (let option in this.softwareTabulatorOptions)
			{
				if (this.$refs.softwareTable.tabulator.options.hasOwnProperty(option))
					this.$refs.softwareTable.tabulator.options[option] = this.softwareTabulatorOptions[option];
			}
			this.$refs.softwareTable.reloadTable();
		},
	},
	template: `
	<!-- Software Verwaltung Tabelle -->
	<core-filter-cmpt
		ref="softwareTable"
		filter-type="SoftwareManagement"
		:tabulator-options="softwareTabulatorOptions"
		:side-menu="false"
		:new-btn-label="'Software'"
		:new-btn-show="true"
		:id-field="'software_id'"
		:parent-id-field="'software_id_parent'"
		:download="[{ formatter: 'csv', file: 'data.csv', options: {delimiter: ';', bom: true}} ]"
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
	<div class="row mt-3">
		<h2 ref="softwareDetail" class="h4 mb-3">Software-Details <span class="text-uppercase">{{ software_kurzbz }}</span></h2>
		<raumzuordnung ref="raumzuordnung"></raumzuordnung>
	</div>
	<!-- Software modal component -->
	<software-modal
		class="fade"
		ref="modalForSave"
		dialog-class="modal-xl"
		@software-saved="handleSoftwareSaved">
	</software-modal>
`
};
