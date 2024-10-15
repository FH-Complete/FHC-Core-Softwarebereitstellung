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
				dataTree: self.cbDataTree,
				dataTreeStartExpanded: self.cbDataTreeStartExpanded,
				dataTreeChildIndent: 15, //indent child rows by 15 px
				dataTreeSelectPropagate:true, //propagate selection events from parent rows to children
				persistence:{
					filter: false, //persist filter sorting
				},
				columns: [
					{title: 'LV-ID', field: 'lehrveranstaltung_id', headerFilter: true, visible: false},
					{title: 'STG Kurzbz', field: 'stg_typ_kurzbz', headerFilter: true, visible:true, width: 120},
					{title: 'Lehrtyp Kurzbz', field: 'lehrtyp_kurzbz', headerFilter: true, visible:true, width: 70},
					{title: 'Studiengang', field: 'stg_bezeichnung', headerFilter: true, visible: false, width: 250},
					{title: 'Studiengangtyp', field: 'stg_typ_bezeichnung', headerFilter: true, width: 250},
					{title: 'OrgForm', field: 'orgform_kurzbz', headerFilter: true, width: 70},
					{title: 'Semester', field: 'semester', headerFilter: true, width: 50},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true, minWidth: 250},
					{title: 'Studienplan', field: 'studienplan_bezeichnung', headerFilter: true, visible:true, width: 220},
					{title: 'LE-Gruppen', field: 'lehreinheitgruppen_bezeichnung', headerFilter: true, width: 200},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false, minWidth: 80},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true, minWidth: 200}
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
		openSoftwareanforderungForm(){
			let selectedData = this.table.getSelectedData();

			if (selectedData.length == 0)
			{
				this.$fhcAlert.alertWarning( this.$p.t('global/zeilenAuswaehlen'));
				return;
			}

			this.$refs.softwareanforderungForm.openModalLvTemplateToSw(selectedData, this.selectedStudiensemester);
		},
		onFormClosed(){
			// Deselect all rows
			this.table.deselectRow();
		},
		onChangeStudiensemester(){
			// Reset table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'/api/frontend/v1/education/Lehrveranstaltung/getTemplateLvTree' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester +
					'&berechtigung=' + BERECHTIGUNG_SOFTWAREANFORDERUNG
				),
			);
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungNachLvTemplateTable.tabulator;

			// Await Studiensemester
			await this.loadAndSetStudiensemester();

			// Set table data
			this.table.setData(
				CoreRESTClient._generateRouterURI(
					'/api/frontend/v1/education/Lehrveranstaltung/getTemplateLvTree' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester +
					'&berechtigung=' + BERECHTIGUNG_SOFTWAREANFORDERUNG
				),
			);

			// Await phrases categories
			await this.$p.loadCategory(['lehre']);

			// Replace column titles with phrasen
			this.table.updateColumnDefinition('lv_bezeichnung', {title: this.$p.t('lehre', 'lehrveranstaltung')});
			//this.table.updateColumnDefinition('stg_bezeichnung', {title: this.$p.t('lehre', 'studiengang')});

		},
		onRowClick(e, row){
			// Only if first level (= lv template) is clicked
			if (row.getTreeParent() === false)
			{
				// First deselect all rows
				row.getTable().deselectRow();

				// Select lv template row and its children lvs (due to option setting datatree propagate)
				row.select();

				// Expand to show the selected children lvs
				row.treeExpand();
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
		reloadTabulator() {
			if (this.$refs.softwareanforderungNachLvTemplateTable.tabulator !== null && this.$refs.softwareanforderungNachLvTemplateTable.tabulator !== undefined)
			{
				for (let option in this.tabulatorOptions)
				{
					if (this.$refs.softwareanforderungNachLvTemplateTable.tabulator.options.hasOwnProperty(option))
						this.$refs.softwareanforderungNachLvTemplateTable.tabulator.options[option] = this.tabulatorOptions[option];
				}
				this.$refs.softwareanforderungNachLvTemplateTable.reloadTable();
			}
		},
	},
	template: `
<div class="softwareanforderungNachStandardLvTemplate overflow-hidden">
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
				ref="softwareanforderungNachLvTemplateTable"
				uniqueId="softwareanforderungNachLvTemplateTable"
				table-only
				:side-menu="false"
				:tabulator-options="tabulatorOptions"
				:tabulator-events="[
					{event: 'tableBuilt', handler: onTableBuilt},
					{event: 'rowClick', handler: onRowClick}
				]">
				<template v-slot:actions>
					<button class="btn btn-primary" @click="openSoftwareanforderungForm()">{{ $p.t('global/swFuerLvAnfordern') }}</button>
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
	
	<!-- Form -->
	<softwareanforderung-form ref="softwareanforderungForm" @form-closed="onFormClosed"></softwareanforderung-form>

</div>
`
};
