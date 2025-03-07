import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import SoftwareanforderungForm from "../Form/Softwareanforderung.js";

// Fields used to restructure table data for dataTree
const idField = 'lehrveranstaltung_id';
const parentIdField = 'lehrveranstaltung_template_id';

export default {
	components: {
		CoreFilterCmpt,
		SoftwareanforderungForm
	},
	inject: [
		'selectedStudienjahr',
		'currentTab'
	],
	data: function() {
		return {
			table: null,
			cbDataTree: true, // checkbox display dataTree or not
			cbDataTreeStartExpanded: false,	// checkbox expand dataTree or not
			cbGroupStartOpen: true,	// checkbox group organisationseinheit start open
		}
	},
	watch: {
		cbGroupStartOpen(newVal){
			this.table.setGroupStartOpen(newVal);
			this.table.replaceData();
		},
		selectedStudienjahr(newVal) {
			if(newVal && this.currentTab === "softwareanforderungNachLvTemplate" && this.table) {
				this.table.replaceData();
			}
		},
		currentTab(newVal) {
			if (newVal === 'softwareanforderungNachLvTemplate' && this.selectedStudienjahr && this.table) {
				this.table.replaceData();
			}
		}
	},
	computed: {
		tabulatorOptions() {
			const self = this;
			return {
				ajaxURL: self.$fhcApi.getUri(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getLvsForTplRequests'
				),
				ajaxParams: () => {
					return {
						studienjahr_kurzbz: self.selectedStudienjahr
					}
				},
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
				dataTreeElementColumn: 'lv_bezeichnung',
				dataTreeChildIndent: 15, //indent child rows by 15 px
				dataTreeSelectPropagate:true, //propagate selection events from parent rows to children
				persistence:{
					filter: false, //persist filter sorting
				},
				selectableRangeMode: 'click',
				rowFormatter: (row) => {
					const data = row.getData();
					const selectionCell = row.getCell('selection');

					// Hide children checkboxes for children SwLvs
					if (selectionCell) {
						const checkbox = selectionCell.getElement().querySelector("input[type='checkbox']");
						if (checkbox && data.lehrtyp_kurzbz !== 'tpl') checkbox.style.display = "none";
					}
				},
				columns: [
					{
						field: 'selection',
						formatter: 'rowSelection',
						headerSort: false,
						width: 70,
						visible: true
					},
					{title: 'LV-ID', field: 'lehrveranstaltung_id', headerFilter: true, visible: false},
					{title: 'Lehrtyp Kurzbz', field: 'lehrtyp_kurzbz', headerFilter: true, visible:false, width: 70},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true, width: 350},
					{title: 'Studiensemester', field: 'studiensemester_kurzbz', headerFilter: true, visible:true, width: 90},
					{title: 'STG Kurzbz', field: 'stg_typ_kurzbz', headerFilter: true, visible:true, width: 70},
					{title: 'OrgForm', field: 'orgform_kurzbz', headerFilter: true, width: 70},
					{title: 'Semester', field: 'semester', headerFilter: true, width: 50},
					{title: 'Studiengang', field: 'stg_bezeichnung', headerFilter: true, visible: false, width: 250},
					{title: 'Studiengangtyp', field: 'stg_typ_bezeichnung', headerFilter: true, width: 250},
					{title: 'Studienplan', field: 'studienplan_bezeichnung', headerFilter: true, visible:true, width: 220},
					{title: 'LE-Gruppen', field: 'lehreinheitgruppen_bezeichnung', headerFilter: true, width: 200},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false, minWidth: 80},
					{title: 'Quellkurs-OE', field: 'lv_oe_bezeichnung', headerFilter: true, minWidth: 200}
				]
			}
		}
	},
	methods: {
		openSoftwareanforderungForm(){
			let selectedData = this.table.getSelectedData();

			if (selectedData.length == 0)
			{
				this.$fhcAlert.alertWarning( this.$p.t('global/zeilenAuswaehlen'));
				return;
			}

			this.$refs.softwareanforderungForm.openModalLvTemplateToSw(selectedData);
		},
		onFormClosed(){
			// Deselect all rows
			this.table.deselectRow();
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungNachLvTemplateTable.tabulator;

			// Await phrases categories
			await this.$p.loadCategory(['lehre']);

			// Replace column titles with phrasen
			this.table.updateColumnDefinition('lv_bezeichnung', {title: this.$p.t('lehre', 'lehrveranstaltung')});
			//this.table.updateColumnDefinition('stg_bezeichnung', {title: this.$p.t('lehre', 'studiengang')});

		},
		onRowClick(e, row){
			let parent = row.getTreeParent();

			if (parent) {
				// If child row is clicked, prevent selection
				return;
			}

			// Deselect all rows first to enforce "one parent at a time"
			this.table.deselectRow();

			// Select the parent row (children will be selected automatically due to propagation)
			row.select();
		},
		onRowDblClick(e, row) {
			row.treeToggle();
		},
		prepDataTreeData(data){
			let structuredData = [];
			let qkSwParentLevel = new Set();	// Quellkurs + Software pair

			// Iterate over the data array
			data.forEach((item, index) => {
				// Only process valid Quellkurs + Software pairs
				if (item.lehrtyp_kurzbz === 'tpl' && item.software_id !== null) {
					let parentKey = `${item.lehrveranstaltung_id}-${item.software_id}`;

					// Ensure each Quellkurs + Software pair is unique
					if (!qkSwParentLevel.has(parentKey)) {
						qkSwParentLevel.add(parentKey); // Track Quellkurs-Software pairs

						let parentItem = {
							...item,
							_children: []  // Initialize children array
						};

						// Attach Zuordnungen (assignments) directly under this parent
						this._appendSwLvZuordnung(data, parentItem);

						structuredData.push(parentItem); // Add to final structured data
					}
				}
			});

			return structuredData;
		},
		_appendSwLvZuordnung (data, parentItem) {
			//Attach LV-SW Zuordnungen directly under the Quellkurs + Software parent
			data.forEach((item) => {
				// If the current item is a software assignment related to the parent
				if (item[parentIdField] === parentItem[idField] &&
					item.software_id === parentItem.software_id) {

					parentItem._children.push({...item}); // Add as child
				}
			});
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
		<div class="col-12 h4">Software bestellen für Quellkurse {{ selectedStudienjahr }}</div>
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
					{event: 'rowClick', handler: onRowClick},
					{event: 'rowDblClick', handler: onRowDblClick}
				]">
				<template v-slot:actions>
					<button class="btn btn-primary" @click="openSoftwareanforderungForm()">SW für Quellkurs anfordern</button>
						<div class="form-check form-check-inline ms-3">
						<input
							class="form-check-input"
							type="checkbox"
							v-model="cbDataTreeStartExpanded"
							:checked="cbDataTreeStartExpanded"
							@change="reloadTabulator">
						<label class="form-check-label">Quellkurse {{ $p.t('global/aufgeklappt') }}</label>
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
