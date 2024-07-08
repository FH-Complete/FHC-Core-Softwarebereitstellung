import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import {Raumzuordnung} from "../SoftwareManagement/Raumzuordnung.js";
import SoftwareanforderungForm from "../Form/Softwareanforderung.js";

// Fields used to restructure table data for dataTree
const idField = 'software_id';
const parentIdField = 'software_id_parent';

export default {
	components: {
		CoreFilterCmpt,
		SoftwareanforderungForm,
		Raumzuordnung
	},
	data: function() {
		return {
			cbDataTree: true, // checkbox display dataTree or not
			cbDataTreeStartExpanded: false,	// checkbox expand dataTree or not
		}
	},
	computed: {
		tabulatorOptions() {
			const self = this;
			return {
				ajaxURL: CoreRESTClient._generateRouterURI('extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwarelistData'),
				ajaxResponse(url, params, response){
					// If dataTree checkbox is checked
					return self.cbDataTree
						? self.prepDataTreeData(CoreRESTClient.getData(response)) // Prepare data for dataTree view
						: CoreRESTClient.getData(response); // else return data for normal list view
				},
				dataTree: self.cbDataTree,
				dataTreeStartExpanded: self.cbDataTreeStartExpanded,
				layout: 'fitColumns',
				index: 'software_id',
				columns: [
					{
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						titleFormatterParams: { rowRange: "active"},
						width: 70,
						frozen: true
					},
					{title: 'ID', field: 'software_id', headerFilter: true, visible: false, frozen: true},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true,
						frozen: true,
						width: 200,
						minWidth: 200,
						maxWidth: 200,},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right', minWidth: 70},
					{title: this.$p.t('global/softwaretyp'), field: 'softwaretyp_bezeichnung', headerFilter: true,
						minWidth: 150,
						formatter: (cell) => {
							return cell.getValue();
						}
					},
					{title: this.$p.t('global/softwaretypKurzbz'), field: 'softwaretyp_kurzbz', headerFilter: true, visible: false},
					{title: this.$p.t('global/hersteller'), field: 'hersteller', headerFilter: true, minWidth: 200},
					{title: this.$p.t('global/betriebssystem'), field: 'os', headerFilter: true, minWidth: 150},
					{title: this.$p.t('global/beschreibung'), field: 'beschreibung', headerFilter: true, visible: false},
					{title: this.$p.t('global/verantwortliche'), field: 'verantwortliche', headerFilter: true, visible: false},
					{title: this.$p.t('global/anmerkungIntern'), field: 'anmerkung_intern', headerFilter: true, visible: false},
					{title: 'Übergeordnete Software ID', field: 'software_id_parent', headerFilter: true, visible: false},
					{title: this.$p.t('global/uebergeordneteSoftware'), field: 'software_kurzbz_parent', headerFilter: true, visible: false},
					{title: this.$p.t('global/insertamum'), field: 'insertamum', hozAlign:"center", headerFilter: true, visible: false},
					{title: this.$p.t('global/insertvon'), field: 'insertvon', headerFilter: true, visible: false},
					{title: this.$p.t('global/updateamum'), field: 'updateamum', hozAlign:"center", headerFilter: true, visible: false},
					{title: this.$p.t('global/updatevon'), field: 'updatevon', headerFilter: true, visible: false},
					{title: 'Software-Status', field: 'softwarestatus_kurzbz', headerFilter: true,
						formatter: (cell) => this.softwarestatus
							? this.softwarestatus[cell.getValue()]
							: cell.getData().softwarestatus_bezeichnung,
						width: 200,
						minWidth: 200,
						maxWidth: 200,
						frozen: true
					},
					{title: this.$p.t('global/aktionen'), field: 'actions',
						width: 380,
						minWidth: 380,
						maxWidth: 380,
						formatter: (cell, formatterParams, onRendered) => {
							let container = document.createElement('div');
							container.className = "d-flex gap-2";

							let button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = this.$p.t('global/raumverfuegbarkeit');
							button.addEventListener(
								'click', (event) => this.openRaumzuordnung(event, cell.getRow())
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
		openRaumzuordnung(e, row){
			// Get Orte for a software
			this.$refs.raumzuordnung.getOrteBySoftware(row.getIndex(), row.getData().software_kurzbz);

			// Open Details in offcanvas
			let offcanvasElement = new bootstrap.Offcanvas(document.getElementById('softwarelisteOffcanvas'));
			offcanvasElement.show();
		},
		openSoftwareanforderungForm(){
			let selectedData = this.$refs.softwareanforderungNachSwTable.tabulator.getSelectedData();

			if (selectedData.length == 0)
			{
				this.$fhcAlert.alertWarning( this.$p.t('global/zeilenAuswaehlen'));
				return;
			}

			this.$refs.softwareanforderungForm.openModalSwToLv(selectedData);
		},
		reloadTabulator() {
			if (this.$refs.softwareanforderungNachSwTable.tabulator !== null && this.$refs.softwareanforderungNachSwTable.tabulator !== undefined)
			{
				for (let option in this.tabulatorOptions)
				{
					if (this.$refs.softwareanforderungNachSwTable.tabulator.options.hasOwnProperty(option))
						this.$refs.softwareanforderungNachSwTable.tabulator.options[option] = this.tabulatorOptions[option];
				}
				this.$refs.softwareanforderungNachSwTable.reloadTable();
			}
		},
		prepDataTreeData(data){
			let toDelete = [];

			// loop through all data
			for (let childIdx = 0; childIdx < data.length; childIdx++)
			{
				let child = data[childIdx];

				// if it has parent id, it is a child
				if (child[parentIdField])
				{
					// append the child on the right place. If parent found, mark original sw child on 0 level for deleting
					if (this._appendChild(data, child)) toDelete.push(childIdx);
				}
			}

			// delete the marked children from 0 level
			for (let counter = 0; counter < toDelete.length; counter++)
			{
				// decrease index by counter as index of data array changes after every deletion
				data.splice(toDelete[counter] - counter, 1);
			}

			return data;
		},
		_appendChild(data, child) {
			// get parent id
			let parentId = child[parentIdField];

			// loop thorugh all data
			for (let parentIdx = 0; parentIdx < data.length; parentIdx++)
			{
				let parent = data[parentIdx];

				// if it's the parent
				if (parent[idField] == parentId)
				{
					// create children array if not done yet
					if (!parent._children) parent._children = [];

					// if child is not included in children array, append the child
					if (!parent._children.includes(child)) parent._children.push(child);

					// parent found
					return true;
				}
				// search children for parents
				else if (parent._children) this._appendChild(parent._children, child);
			}

			// parent not found
			return false;
		},
		onFormClosed(){
			// Deselect all rows
			this.$refs.softwareanforderungNachSwTable.tabulator.deselectRow();
		}
	},
	template: `
<div class="softwareanforderungNachSw overflow-hidden">
	<div class="row-col d-flex ms-auto">
		<!-- TODO phrase exists, but not breaking line properly -->
		<!--<button class="btn btn-secondary text-start ms-auto" @click="">{{ $p.t('global/swNichtGefundenHierBestellen') }}</button>--> 
		<button class="btn btn-secondary text-start ms-auto" @click="">Software nicht gefunden?<br>Hier bei IT-Services bestellen</button>
	</div>
	<div class="row mb-5">
		<div class="col">
			<core-filter-cmpt
				ref="softwareanforderungNachSwTable"
				uniqueId="softwareanforderungNachSwTable"
				table-only
				:side-menu="false"
				:tabulator-options="tabulatorOptions">
				<template v-slot:actions>
					<button class="btn btn-primary" @click="openSoftwareanforderungForm()">{{ $p.t('global/swFuerLvAnfordern') }}</button>
					<div class="form-check form-check-inline">
						<input
							class="form-check-input"
							type="checkbox"
							v-model="cbDataTree"
							:checked="cbDataTree"
							@change="reloadTabulator">
						<label class="form-check-label">{{ $p.t('global/hierarchieAnsicht') }}</label>
					</div>
					<div class="form-check form-check-inline" v-show="cbDataTree">
						<input
							class="form-check-input"
							type="checkbox"
							v-model="cbDataTreeStartExpanded"
							:checked="cbDataTreeStartExpanded"
							@change="reloadTabulator">
						<label class="form-check-label">{{ $p.t('global/aufgeklappt') }}</label>
					</div>
				</template>
			</core-filter-cmpt>						
		</div>
	</div>
	
	<!-- Form -->
	<softwareanforderung-form ref="softwareanforderungForm" @form-closed="onFormClosed"></softwareanforderung-form>
	
	<!-- Software Raumverfügbarkeit  -->
	<div class="offcanvas offcanvas-start w-50" tabindex="-1" id="softwarelisteOffcanvas">
		<div class="offcanvas-header">
			<button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
		</div>
		<raumzuordnung ref="raumzuordnung"></raumzuordnung>
	</div>
</div>
`
};
