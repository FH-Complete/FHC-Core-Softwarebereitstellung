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
import SoftwareModal from '../Modals/SoftwareModal.js';
import {CoreRESTClient} from '../../../../../js/RESTClient.js';

export const SoftwareManagementCmpt = {
	components: {
		CoreNavigationCmpt,
		CoreFilterCmpt,
		ActionsCmpt,
		SoftwareModal
	},
	data: function() {
		return {
			extraTabulatorOptions: { // tabulator options which can be modified after first render
				dataTreeStartExpanded: true,
				columns: [
					{
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
					{title: 'Status', field: 'softwarestatus_kurzbz', headerFilter: true, editor: "list", editorParams:{values:[]}},
					{title: 'Anmerkung intern', field: 'anmerkung_intern', headerFilter: true},
					{title: 'ID', field: 'software_id', headerFilter: true},
					{title: 'Übergeordnete Software ID', field: 'software_id_parent', headerFilter: true}
				]
			},
			softwareManagementTabulatorEventHandlers: SoftwareManagementTabulatorEventHandlers,
			softwareManagementTabulatorAdditionalColumns: ['Action'],
			softwareId: null,
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

				this.addTabulatorColumns();
				this.reloadTabulator();
			}
		).catch(
			error => {
				let errorMessage = error.message ? error.message : 'Unknown error';
				alert('Error when getting softwarestatus: ' + errorMessage); //TODO beautiful alert
			}
		);
	},
	methods: {
		handleHierarchyToggle(expandHierarchy) {
			this.extraTabulatorOptions.dataTreeStartExpanded = expandHierarchy;
			this.reloadTabulator();
		},
		openModalForCreate(event, softwareId) {
			if (softwareId) this.softwareId = softwareId;
			this.$refs.modalForSave.show();
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
		},
		changeStatus(softwarestatus_kurzbz) {
			let selectedData = this.$refs.softwareTable.tabulator.getSelectedData();

			if (selectedData.length == 0)
			{
				alert( 'Bitte erst Zeilen auswählen');
				return;
			}

			let software_ids = selectedData.map(data => data.software_id);

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/updateStatus',
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
		deleteSoftware(software_id) {
			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/deleteSoftware',
				{
					software_id: software_id
				}
			).then(
				result => {
					this.$refs.softwareTable.reloadTable(); // TODO use row update instead of reloadTable after solving datatree issues
				}
			).catch(
				error => {
					alert('Error when deleting software: ' + error.message);
				}
			);
		},
		addTabulatorColumns() {
			let deleteSoftwareFunc = this.deleteSoftware;
			let columns = [
				{
					title: 'Action', field: 'action', headerFilter: false, formatter: function(cell){
						let delButton = document.createElement('button');
						delButton.className = 'btn btn-outline-secondary';
						delButton.innerHTML = '<i class="fa fa-xmark"></i>';
						delButton.addEventListener('click', () => deleteSoftwareFunc(cell.getRow().getIndex()));

						return delButton;
					}
				}
			];

			this.extraTabulatorOptions.columns = this.extraTabulatorOptions.columns.concat(columns);
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
					:tabulator-additional-columns="softwareManagementTabulatorAdditionalColumns"
					:new-btn-label="'Software'"
					:new-btn-show="true"
					@nw-new-entry="newSideMenuEntryHandler"
					@click:new="openModalForCreate">
					<template v-slot:actions>
						<actions-cmpt
							:softwarestatus="softwarestatus"
							:expand-hierarchy="extraTabulatorOptions.dataTreeStartExpanded"
							 @set-status="changeStatus"
							 @hierarchy-toggle="handleHierarchyToggle"/>
						 </actions-cmpt>
					 </template>
				</core-filter-cmpt>
				<!-- Software modal component -->
				<software-modal
					class="fade"
					ref="modalForSave"
					dialog-class="modal-lg"
					title="Software anlegen"
					:softwareId="softwareId"
					@software-saved="handleSoftwareSaved">
				</software-modal>
			</div>
		</div>
	`
};
