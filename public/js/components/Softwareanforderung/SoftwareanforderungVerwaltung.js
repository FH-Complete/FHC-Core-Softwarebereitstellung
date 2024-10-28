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
					return self.cbDataTree
						? self.prepDataTreeData(response.data) // Prepare data for dataTree view
						: response.data; // else return data for normal list view
				},
				layout: 'fitColumns',
				autoResize: false, // prevent auto resizing of table
				resizableColumnFit: true, //maintain the fit of columns when resizing
				index: 'lehrveranstaltung_id',
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
			let toDelete = [];
			const uniqueLvTemplates = new Set();  // To track unique Lehrveranstaltungen

			for (let childIdx = 0; childIdx < data.length; childIdx++) {
				let child = data[childIdx];

				if (child.lehrtyp_kurzbz === 'tpl' || !child[parentIdField]) {

					if (!uniqueLvTemplates.has(child.lehrveranstaltung_id)) {
						uniqueLvTemplates.add(child.lehrveranstaltung_id);  // Track unique LV Templates

						// Nullify some lv and software-related fields for parent rows
						child.stg_typ_kurzbz = null;
						child.semester = null;
						child.software_id = null;
						child.software_kurzbz = null;
						child.version = null;
						child.softwaretyp_kurzbz = null;
						child.softwaretyp_bezeichnung = null;
						child.softwarestatus_bezeichnung = null;

						// It's a parent, set children
						this._appendChild(data, child, toDelete);
					} else {
						// Remove duplicate parents
						toDelete.push(childIdx);
					}
				}
			}

			let test = data.filter((_, index) => !toDelete.includes(index));

			// Remove duplicates or children incorrectly placed at the top level
			return data.filter((_, index) => !toDelete.includes(index));
		},
		_appendChild(data, parent, toDelete) {

			// Loop through all data and find children for the current parent
			data.forEach((child, index) => {
				

				//console.log(parent);
				//console.log(child);

				// If software doesn't already exist under this parent, add it
				if (child[parentIdField] === parent[idField]) {
					// If parent is found, check if software already exists as a child
					let softwareChild = parent._children?.find(c => c.software_id === child.software_id);
					if (!parent._children) parent._children = [];

					if (!softwareChild) {
						// Add Software as a child level
						softwareChild = {
							software_lv_id: parent.software_lv_id,
							lehrveranstaltung_id: parent[idField],
							lehrtyp_kurzbz: parent.lehrtyp_kurzbz,
							software_id: child.software_id,
							softwaretyp_bezeichnung: child.softwaretyp_bezeichnung,
							software_kurzbz: child.software_kurzbz,
							version: child.version,
							softwarestatus_bezeichnung: child.softwarestatus_bezeichnung,
							_children: []  // Create an empty _children array for STG_KZ
						};
						parent._children.push(softwareChild);
					}

					// Add all relevant data as the child of Software
					softwareChild._children.push({
						...child // push all child properties
					});

					// Mark the child to be removed from the top level
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
