/**
 * Copyright (C) 2023 fhcomplete.org
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {SoftwareManagementTabulatorOptions} from './SoftwareManagementTabulatorSetup.js';
import {SoftwareManagementTabulatorEventHandlers} from './SoftwareManagementTabulatorSetup.js';

import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import {CoreNavigationCmpt} from '../../../../../js/components/navigation/Navigation.js';
import {ActionsCmpt} from './ActionsCmpt.js';
import {DetailsCmpt} from './DetailsCmpt.js';
import SoftwareModal from '../Modals/SoftwareModal.js';
import {CoreRESTClient} from '../../../../../js/RESTClient.js';

export const SoftwareManagementCmpt = {
	components: {
		CoreNavigationCmpt,
		CoreFilterCmpt,
		ActionsCmpt,
		DetailsCmpt,
		SoftwareModal
	},
	data: function() {
		return {
			extraTabulatorOptions: { // tabulator options which can be modified after first render
				dataTreeStartExpanded: true,
				columns: [
					{
						field: 'software_kurzbz',
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						hozAlign: 'left',
						width: 150,
						headerSort: false,
						frozen: true
					},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true, frozen: true},
					{title: 'Softwaretyp', field: 'softwaretyp_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right'},
					{title: 'Beschreibung', field: 'beschreibung', headerFilter: true},
					{title: 'Hersteller', field: 'hersteller', headerFilter: true},
					{title: 'Betriebssystem', field: 'os', headerFilter: true},
					{title: 'Lizenzart', field: 'lizenzart', headerFilter: true},
					{title: 'Anzahl Lizenzen', field: 'anzahl_lizenzen', headerFilter: true},
					{title: 'Aktiv', field: 'aktiv', headerFilter: true, formatter:"tickCross", hozAlign: 'center'},
					{title: 'Status', field: 'softwarestatus_kurzbz',
						editor: "list", editorParams:{values:[]},
						headerFilter: true, headerFilterParams:{values:[]}
					},
					{title: 'Anmerkung intern', field: 'anmerkung_intern', headerFilter: true},
					{title: 'ID', field: 'software_id', headerFilter: true},
					{title: 'Übergeordnete Software ID', field: 'software_id_parent', headerFilter: true},
					{title: 'Übergeordnete Software', field: 'software_kurzbz_parent', headerFilter: true},
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
			softwareManagementTabulatorEventHandlers: SoftwareManagementTabulatorEventHandlers,
			tabulatorAdditionalColumns: ['actions'],
			appSideMenuEntries: {},
			softwarestatus: Array
		}
	},
	computed: {
		softwareManagementTabulatorOptions() { // default options + extra options
			return {...SoftwareManagementTabulatorOptions, ...this.extraTabulatorOptions};
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
			error => {
				let errorMessage = error.message ? error.message : 'Unknown error';
				alert('Error when getting softwarestatus: ' + errorMessage); //TODO beautiful alert
			}
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

			// get Orte for a software
			this.$refs.details.getOrteBySoftware(row.getIndex(), row.getData().software_kurzbz);
		});
	},
	methods: {
		handleHierarchyToggle(expandHierarchy) {
			this.extraTabulatorOptions.dataTreeStartExpanded = expandHierarchy;
			this.reloadTabulator();
		},
		openModal(event, softwareId) {
			this.$refs.modalForSave.openSoftwareModal(softwareId);
		},
		handleSoftwareSaved() {
			this.$refs.modalForSave.hide();
			this.$refs.softwareTable.reloadTable();
		},
		populateTabulatorColumnStatus(status_arr){
			// Modify format
			let result = status_arr.reduce((res, x) => {
				res[x.softwarestatus_kurzbz] = x.bezeichnung;
				return res;
			}, {});

			let statusCol = this.softwareManagementTabulatorOptions.columns.find(col => col.field === 'softwarestatus_kurzbz');
			statusCol.editorParams = {values: result};
			statusCol.headerFilterParams = {values: result};
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
					alert( 'Bitte erst Zeilen auswählen');
					return;
				}

				software_ids = selectedData.map(data => data.software_id);
			}

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/changeSoftwarestatus',
				{
					software_ids: software_ids,
					softwarestatus_kurzbz: softwarestatus_kurzbz
				}
			).then(
				result => {
					this.$refs.softwareTable.reloadTable(); // TODO use row update instead of reloadTable after solving datatree issues
				}
			).catch(
				error => {
					alert('Error when updating softwarestatus: ' + error.message);
				}
			);
		},
		editSoftware(event, software_id){
			this.openModal(event, software_id);
		},
		deleteSoftware(software_id) {
			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/deleteSoftware',
				{
					software_id: software_id
				}
			).then(
				result => {
					this.$refs.softwareTable.reloadTable();
				}
			).catch(
				error => {
					alert('Error when deleting software: ' + error.message);
				}
			);
		},
		reloadTabulator() {
			for (let option in this.softwareManagementTabulatorOptions)
			{
				if (this.$refs.softwareTable.tabulator.options.hasOwnProperty(option))
					this.$refs.softwareTable.tabulator.options[option] = this.softwareManagementTabulatorOptions[option];
			}
			this.$refs.softwareTable.reloadTable();
		},
		newSideMenuEntryHandler: function(payload) {
			this.appSideMenuEntries = payload;
		}
	},
	template: `
		<!-- Navigation component -->
		<core-navigation-cmpt v-bind:add-side-menu-entries="appSideMenuEntries"></core-navigation-cmpt>

		<div id="content">
			<div>
				<!-- Filter component -->
				<core-filter-cmpt
					ref="softwareTable"
					title="Software Verwaltung"
					filter-type="SoftwareManagement"
					:tabulator-options="softwareManagementTabulatorOptions"
					:tabulator-events="softwareManagementTabulatorEventHandlers"
					:tabulatorAdditionalColumns="tabulatorAdditionalColumns"
					:new-btn-label="'Software'"
					:new-btn-show="true"
					:id-field="'software_id'"
					:parent-id-field="'software_id_parent'"
					@nw-new-entry="newSideMenuEntryHandler"
					@click:new="openModal">
					<template v-slot:actions>
						<actions-cmpt
							:softwarestatus="softwarestatus"
							:expand-hierarchy="extraTabulatorOptions.dataTreeStartExpanded"
							 @set-status="changeStatus"
							 @hierarchy-toggle="handleHierarchyToggle"/>
						 </actions-cmpt>
					 </template>
				</core-filter-cmpt>
				<br>
				<!-- Details component -->
				<details-cmpt ref="details">
				</details-cmpt>
				<!-- Software modal component -->
				<software-modal
					class="fade"
					ref="modalForSave"
					dialog-class="modal-lg"
					@software-saved="handleSoftwareSaved">
				</software-modal>
			</div>
		</div>
	`
};
