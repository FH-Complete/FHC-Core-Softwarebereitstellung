import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import CoreFormInput from "../../../../../js/components/Form/Input.js";
import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import SoftwareanforderungForm from "../Form/Softwareanforderung.js";

// Fields used to restructure table data for dataTree
const idField = 'lehrveranstaltung_id';
const parentIdField = 'lehrveranstaltung_template_id';
const BERECHTIGUNG_SOFTWAREANFORDERUNG = 'extension/software_bestellen';

export default {
	components: {
		CoreFilterCmpt,
		CoreFormInput,
		SoftwareanforderungForm
	},
	inject: ['STUDIENSEMESTER_DROPDOWN_STARTDATE'],
	data: function() {
		return {
			table: null,
			studiensemester: [],
			selectedStudiensemester: '',
			cbDataTree: true, // checkbox display dataTree or not
			cbDataTreeStartExpanded: false,	// checkbox expand dataTree or not
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
					return self.prepDataTreeData(response.data); // Prepare data for dataTree view
				},
				layout: 'fitColumns',
				autoResize: false, // prevent auto resizing of table
				resizableColumnFit: true, //maintain the fit of columns when resizing
				index: 'software_lv_id',
				groupBy: 'lv_oe_bezeichnung',
				dataTree: self.cbDataTree,
				dataTreeStartExpanded: [true, self.cbDataTreeStartExpanded],
				dataTreeChildIndent: 15, //indent child rows by 15 px
				dataTreeSelectPropagate:true, //propagate selection events from parent rows to children
				persistence:{
					filter: false, //persist filter sorting
				},
				columns: [
					{title: 'SW-LV-ID', field: 'software_lv_id', headerFilter: true, visible: false},
					{title: 'SW-ID', field: 'software_id', headerFilter: true, visible: false},
					{title: 'LV-ID', field: 'lehrveranstaltung_id', headerFilter: true, visible: false},
					{title: 'Studiensemester', field: 'studiensemester_kurzbz', headerFilter: true, visible:false},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true, width: 270},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false},
					{title: 'STG KZ', field: 'studiengang_kz', headerFilter: true, visible:false},
					{title: 'Lehrtyp-Kurzbz', field: 'lehrtyp_kurzbz', headerFilter: true, visible:false},
					{title: 'STG Kurzbz', field: 'stg_typ_kurzbz', headerFilter: true, visible:true, width: 70},
					{title: 'SW-Typ Kurzbz', field: 'softwaretyp_kurzbz', headerFilter: true, visible: false},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true, visible: false, },
					{title: 'OrgForm', field: 'orgform_kurzbz', headerFilter: true, width: 70},
					{title: 'Semester', field: 'semester', headerFilter: true, hozAlign: 'right', width: 50},
					{title: 'LE-Gruppen', field: 'lehreinheitgruppen_bezeichnung', headerFilter: true, width: 200},
					{title: 'SW-Typ', field: 'softwaretyp_bezeichnung', headerFilter: true},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right', width: 70},
					{title: 'Software-Status', field: 'softwarestatus_bezeichnung', headerFilter: true},
					{title: 'User-Anzahl', field: 'anzahl_lizenzen', headerFilter: true, width: 100,
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
				.catch( error => this.$fhcAlert.handleSystemError(error) );
		},
		onChangeStudiensemester(){
			// Reset table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSwLvZuordnungenBerechtigtByLvOe' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				)
			);
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungVerwaltungTable.tabulator;

			// Await Studiensemester
			await this.loadAndSetStudiensemester();

			// Set table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSwLvZuordnungenBerechtigtByLvOe' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				)
			);

			// Await phrases categories
			await this.$p.loadCategory(['lehre']);

			// Replace column titles with phrasen
			this.table.updateColumnDefinition('lv_bezeichnung', {title: this.$p.t('lehre', 'lehrveranstaltung')});
			//this.table.updateColumnDefinition('stg_bezeichnung', {title: this.$p.t('lehre', 'studiengang')});

		},
		onRowClick(e, row){

			if (row.getData().lehrtyp_kurzbz === 'tpl' && row.getData().software_id !== null)
			{
				// Toggle to show/hide the selected children lvs
				row.treeToggle();
			}
		},
		prepDataTreeData(data){
			let toDelete = []; 	// Array to track indices of items to delete from top level
			const uniqueQuellkurse = new Set();  // Set to track unique Quellkurse

			// Loop data
			for (let itemIdx = 0; itemIdx < data.length; itemIdx++) {
				let item = data[itemIdx];

				// Check if the item is a top-level Quellkurs (type 'tpl') or has no parent
				if (item.lehrtyp_kurzbz === 'tpl' || !item[parentIdField]) {

					// Ensure each Quellkurs is unique
					if (!uniqueQuellkurse.has(item.lehrveranstaltung_id)) {
						uniqueQuellkurse.add(item.lehrveranstaltung_id);  // Track unique Quellkurse

						// Initialize _children array for top-level Quellkurs
						item._children = [];

						// Populate software entries as children of the Quellkurs
						this._append2ndLvl_SwQuellkursZuordnung(data, item, toDelete);

						// Clean up unnecessary fields for Quellkurs level
						item.software_lv_id = null;
						item.stg_typ_kurzbz = null;
						item.semester = null;
						item.software_id = null;
						item.software_kurzbz = null;
						item.version = null;
						item.softwaretyp_kurzbz = null;
						item.softwaretyp_bezeichnung = null;
						item.softwarestatus_bezeichnung = null;
					} else {
						// Mark duplicate Quellkurse for deletion later
						toDelete.push(itemIdx);
					}
				}
			}

			// Filter out duplicate Quellkurse and incorrectly top level placed children
			return data.filter((_, index) => !toDelete.includes(index));
		},
		_append2ndLvl_SwQuellkursZuordnung(data, parentTpl, toDelete) {
			data.forEach((item, index) => {

				// If the current item matches the Quellkurs
				if (item[idField] === parentTpl[idField]) {

					// Check if the sw-template entry already exists under the parent Quellkurs
					let swTplChild = parentTpl._children.find(c => c.software_id  === item.software_id );

					// If not found, create a new sw-template entry
					if (!swTplChild) {
						swTplChild = {
							...item,
							_children: []
						};

						// Add the sw-template entry as a child of the Quellkurs
						parentTpl._children.push(swTplChild);
					}

					/// Call to add all LV-SW Zuordnungen that are assigend to the Quellkurs
					this._append3rdLvl_SwLvZuordnung(data, swTplChild, toDelete);
				}
			});
		},
		_append3rdLvl_SwLvZuordnung(data, swTplChild, toDelete) {
			data.forEach((item, index) => {
				// If item matches the current software entry
				if (item[parentIdField] === swTplChild[idField] &&
					item.software_id === swTplChild.software_id) {

					// Add item as a child of the software entry
					swTplChild._children.push(item);  // Add LV as a child

					// Mark the index for deletion
					toDelete.push(index);  
				}
			});
		},
		reloadTabulator() {
			if (this.$refs.softwareanforderungVerwaltungTable.tabulator !== null && this.$refs.softwareanforderungVerwaltungTable.tabulator !== undefined)
			{
				for (let option in this.tabulatorOptions)
				{
					if (this.$refs.softwareanforderungVerwaltungTable.tabulator.options.hasOwnProperty(option))
						this.$refs.softwareanforderungVerwaltungTable.tabulator.options[option] = this.tabulatorOptions[option];
				}
				this.$refs.softwareanforderungVerwaltungTable.reloadTable();
			}
		},
	},
	template: `
<div class="softwareanforderungVerwaltung overflow-hidden">
	<div class="row d-flex my-3">
		<div class="col-10 h4">{{ $p.t('global/swAnforderungUeberAuswahlVonStandardisiertenLvTemplates') }}</div>
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
	<div class="row mb-5">
		<div class="col">
			<core-filter-cmpt
				ref="softwareanforderungVerwaltungTable"
				uniqueId="softwareanforderungVerwaltungTable"
				table-only
				:side-menu="false"
				:tabulator-options="tabulatorOptions"
				:tabulator-events="[
					{event: 'tableBuilt', handler: onTableBuilt},
					{event: 'rowClick', handler: onRowClick}
				]">
				<template v-slot:actions>
					<div class="form-check form-check-inline ms-3">
						<input
							class="form-check-input"
							type="checkbox"
							v-model="cbDataTreeStartExpanded"
							:checked="cbDataTreeStartExpanded"
							@change="reloadTabulator">
						<label class="form-check-label">Templates {{ $p.t('global/aufgeklappt') }}</label>
					</div>
				</template>
			</core-filter-cmpt>						
		</div>
	</div>
</div>
`
};
