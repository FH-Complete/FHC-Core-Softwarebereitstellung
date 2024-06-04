import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import {Raumzuordnung} from "../SoftwareManagement/Raumzuordnung.js";
// Fields used to restructure table data for dataTree
const idField = 'software_id';
const parentIdField = 'software_id_parent';

export default {
	componentName: 'Softwareliste',
	components: {
		CoreFilterCmpt,
		Raumzuordnung
	},
	data: function() {
		return {
			data: {},
			cbDataTree: true, // checkbox display dataTree or not
			cbDataTreeStartExpanded: false,	// checkbox expand dataTree or not
			selectedTabulatorRow: null, // currently selected tabulator row
			softwarestatus: null,
			software_kurzbz: ''
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
				index: 'software_id',
				selectable: false,
				columns: [
					{title: 'ID', field: 'software_id', headerFilter: true, visible: false},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true, frozen: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right'},
					{
						title: this.$p.t('global/softwaretyp'),
						field: 'softwaretyp_bezeichnung',
						headerFilter: true,
						formatter: (cell) => {
							return cell.getValue();
						}
					},
					{title: this.$p.t('global/softwaretypKurzbz'), field: 'softwaretyp_kurzbz', headerFilter: true, visible: false},
					{title: this.$p.t('global/hersteller'), field: 'hersteller', headerFilter: true},
					{title: this.$p.t('global/betriebssystem'), field: 'os', headerFilter: true},
					{title: this.$p.t('global/beschreibung'), field: 'beschreibung', headerFilter: true, visible: false},
					{title: this.$p.t('global/verantwortliche'), field: 'verantwortliche', headerFilter: true, visible: false},
					{
						title: 'Software-Status',
						field: 'softwarestatus_kurzbz',
						headerFilter: true,
						formatter: (cell) => this.softwarestatus
								? this.softwarestatus[cell.getValue()]
								: cell.getData().softwarestatus_bezeichnung,
						frozen: true
					},
					{title: this.$p.t('global/anmerkungIntern'), field: 'anmerkung_intern', headerFilter: true, visible: false},
					{title: 'Übergeordnete Software ID', field: 'software_id_parent', headerFilter: true, visible: false},
					{title: this.$p.t('global/uebergeordneteSoftware'), field: 'software_kurzbz_parent', headerFilter: true, visible: false},
					{title: this.$p.t('global/insertamum'), field: 'insertamum', hozAlign:"center", headerFilter: true, visible: false},
					{title: this.$p.t('global/insertvon'), field: 'insertvon', headerFilter: true, visible: false},
					{title: this.$p.t('global/updateamum'), field: 'updateamum', hozAlign:"center", headerFilter: true, visible: false},
					{title: this.$p.t('global/updatevon'), field: 'updatevon', headerFilter: true, visible: false},
					{
						title: this.$p.t('global/aktionen'),
						field: 'actions',
						width: 180,
						minWidth: 180,
						maxWidth: 180,
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
		},
	},
	methods: {
		// Prepare data for dataTree view
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
		reloadTabulator() {
			if (this.$refs.softwarelisteTable.tabulator !== null && this.$refs.softwarelisteTable.tabulator !== undefined)
			{
				for (let option in this.tabulatorOptions)
				{
					if (this.$refs.softwarelisteTable.tabulator.options.hasOwnProperty(option))
						this.$refs.softwarelisteTable.tabulator.options[option] = this.tabulatorOptions[option];
				}
				this.$refs.softwarelisteTable.reloadTable();
			}
		},
		openRaumzuordnung(e, row){
			// save currently clicked row
			this.selectedTabulatorRow = row;

			// get row data
			this.getSoftwareRowDetails();

			// Open Details in offcanvas
			let offcanvasElement = new bootstrap.Offcanvas(document.getElementById('softwarelisteOffcanvas'));
			offcanvasElement.show();
		},
		getSoftwareRowDetails() {
			if (!this.selectedTabulatorRow) return;

			// get Orte for a software
			this.$refs.raumzuordnung.getOrteBySoftware(this.selectedTabulatorRow.getIndex(), this.selectedTabulatorRow.getData().software_kurzbz);

			// get Softwarekurzbz
			this.software_kurzbz = this.selectedTabulatorRow.getData().software_kurzbz;
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
	},
	template: `
<div class="softwareliste">
	<div class="row mb-5">
		<div class="col">
			<core-filter-cmpt
				ref="softwarelisteTable"
				uniqueId="softwarelisteTable"
				table-only
				:side-menu="false"
				:tabulator-options="tabulatorOptions"
				:tabulator-events="[{event: 'rowClick', handler: onTableRowClick}]"
				:download="[{ formatter: 'csv', file: 'software.csv', options: {delimiter: ';', bom: true} }]">
				<template v-slot:actions>
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
	<!-- Software Details -->
	<div class="offcanvas offcanvas-start w-50" tabindex="-1" id="softwarelisteOffcanvas">
		<div class="offcanvas-header">
			<button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
		</div>
		<raumzuordnung ref="raumzuordnung"></raumzuordnung>
	</div>
</div>
`
};
