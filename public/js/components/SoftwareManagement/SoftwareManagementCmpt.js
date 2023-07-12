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
import {OptionsBarCmpt} from './OptionsBarCmpt.js';
import {ActionsCmpt} from './ActionsCmpt.js';
import SoftwareModal from '../Modals/SoftwareModal.js';
import {CoreRESTClient} from '../../../../../js/RESTClient.js';

export const SoftwareManagementCmpt = {
	components: {
		CoreNavigationCmpt,
		CoreFilterCmpt,
		OptionsBarCmpt,
		ActionsCmpt,
		SoftwareModal
	},
	data: function() {
		return {
			extraTabulatorOptions: { // tabulator options which are modified externally
				dataTreeStartExpanded: true
			},
			softwareManagementTabulatorEventHandlers: SoftwareManagementTabulatorEventHandlers,
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
	created() {
	},
	mounted() {
	},
	methods: {
		handleHierarchyToggle(expandHierarchy) {
			this.extraTabulatorOptions.dataTreeStartExpanded = expandHierarchy;
			this.reloadTabulator();
		},
		openModalForCreate(softwareId) {
			if (softwareId) this.softwareId = softwareId;
			this.$refs.modalForCreate.show();
		},
		newSideMenuEntryHandler: function(payload) {
			this.appSideMenuEntries = payload;
		},
		reloadTabulator() {
			for (let option in this.softwareManagementTabulatorOptions)
			{
				if (this.$refs.softwareTable.tabulator.options.hasOwnProperty(option)
					&& this.$refs.softwareTable.tabulator.options[option] != this.softwareManagementTabulatorOptions[option])
					this.$refs.softwareTable.tabulator.options[option] = this.softwareManagementTabulatorOptions[option]
			}
			this.$refs.softwareTable.reloadTable();
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
					alert('Error when getting softwarestatus: ' + error.message);
				}
			);
		}
	},
	beforeCreate() {
		CoreRESTClient.get(
			'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getStatus'
		).then(
			result => {
				this.softwarestatus = CoreRESTClient.getData(result.data);
			}
		).catch(
			error => {
				let errorMessage = error.message ? error.message : 'Unknown error';
				alert('Error when getting softwarestatus: ' + errorMessage); //TODO beautiful alert
			}
		);
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
					:new-btn-label="'Software'"
					:new-btn-show="true"
					@nw-new-entry="newSideMenuEntryHandler"
					@click:new="openModalForCreate">
					<template v-slot:actions>
						<actions-cmpt
							:softwarestatus="softwarestatus"
							 @set-status="changeStatus"/>
						 </actions-cmpt>
					 </template>
				</core-filter-cmpt>
				<software-modal class="fade" ref="modalForCreate" dialog-class="modal-lg" title="Software anlegen" :softwareId="softwareId"></software-modal>
			</div>
		</div>
	`
};
