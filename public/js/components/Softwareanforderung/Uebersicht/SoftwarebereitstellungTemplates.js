import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import SoftwareaenderungForm from "../../Form/Softwareaenderung.js";

// Fields used to restructure table data for dataTree
const idField = 'lehrveranstaltung_id';
const parentIdField = 'lehrveranstaltung_template_id';

export default {
	components: {
		CoreFilterCmpt,
		SoftwareaenderungForm
	},
	inject: [
		'selectedStudiensemester',
		'currentTab'
	],
	data: function() {
		return {
			table: null,
			planungDeadlinePast: false,
			cbDataTree: true, // checkbox display dataTree or not
			cbDataTreeStartExpanded: false,	// checkbox expand dataTree or not
			cbGroupStartOpen: true,	// checkbox group organisationseinheit start open
		}
	},
	watch: {
		cbGroupStartOpen(newVal){
			this.table.setGroupStartOpen(newVal);
			this.table.setData();
		},
		selectedStudiensemester(newVal) {
			console.log(newVal);
			console.log(this.currentTab);
			if(newVal && this.currentTab === "softwarebereitstellungUebersicht" && this.table) {
				this.replaceTableData();
				this.checkIfPlanungDeadlinePast();
			}
		},
		currentTab(newVal) {
			console.log(newVal);
			if (newVal === 'softwarebereitstellungUebersicht' && this.selectedStudiensemester && this.table) {
				this.replaceTableData();
				this.checkIfPlanungDeadlinePast();
			}
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
				dataTreeStartExpanded: [self.cbDataTreeStartExpanded],
				dataTreeChildIndent: 15, //indent child rows by 15 px
				dataTreeSelectPropagate:true, //propagate selection events from parent rows to children
				persistence:{
					filter: false, //persist filter sorting
				},
				columns: [
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true, width: 270},
					{title: 'SW-LV-ID', field: 'software_lv_id', headerFilter: true, visible: false},
					{title: 'SW-ID', field: 'software_id', headerFilter: true, visible: false},
					{title: 'LV-ID', field: 'lehrveranstaltung_id', headerFilter: true, visible: false},
					{title: 'Studiensemester', field: 'studiensemester_kurzbz', headerFilter: true, visible:false},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false},
					{title: 'STG KZ', field: 'studiengang_kz', headerFilter: true, visible:false},
					{title: 'Lehrtyp-Kurzbz', field: 'lehrtyp_kurzbz', headerFilter: true, visible:false},
					{title: 'STG Kurzbz', field: 'stg_typ_kurzbz', headerFilter: true, visible:true, width: 70},
					{title: 'SW-Typ Kurzbz', field: 'softwaretyp_kurzbz', headerFilter: true, visible: false},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true, visible: false, },
					{title: 'OrgForm', field: 'orgform_kurzbz', headerFilter: true, width: 70},
					{title: 'Semester', field: 'semester', headerFilter: true, hozAlign: 'right', width: 50},
					{title: 'LE-Gruppen', field: 'lehreinheitgruppen_bezeichnung', headerFilter: true, width: 200},
					{title: 'SW-Typ', field: 'softwaretyp_bezeichnung', headerFilter: true, width: 200},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right', width: 100},
					{title: 'Schreibberechtigt', field: 'stgOeBerechtigt', headerFilter: true, visible: false},
					{title: 'Software-Status', field: 'softwarestatus_bezeichnung', headerFilter: true,
						formatter: (cell) => {
							const { softwarestatus_kurzbz, softwarestatus_bezeichnung } = cell.getRow().getData();

							// Format Softwarestatus Bezeichnung red if status is End of Life or Nicht verfuegbar
							return (softwarestatus_kurzbz === 'endoflife' || softwarestatus_kurzbz === 'nichtverfuegbar')
								? `<span class="text-danger">${softwarestatus_bezeichnung}</span>`
								: softwarestatus_bezeichnung;
						}
					},
					{title: 'Softwarestatus Kurzbz', field: 'softwarestatus_kurzbz', headerFilter: true, visible: false},
					{title: 'User-Anzahl', field: 'anzahl_lizenzen', headerFilter: true, width: 100,
						hozAlign: 'right', frozen: true, editor:"number",
						editorParams: {
							min:0,
							max:999,
							elementAttributes:{
								maxlength:"3",
							},
							selectContents:true,
							verticalNavigation:"table", //up and down arrow keys navigate away from cell without changing value
						},
						validator: ["min:0", "maxLength:3", "integer"],
						editable: function(cell) {
							const stgOeBerechtigt = cell.getRow().getData().stgOeBerechtigt;

							// Only editable if 'stgOeBerechtigt' is true
							return stgOeBerechtigt;
						},
						tooltip: function(event, cell) {
							const stgOeBerechtigt = cell.getRow().getData().stgOeBerechtigt;

							if (!stgOeBerechtigt) {
								return self.$p.t('ui/nurLeseberechtigung');
							}
						}
					},
					{title: this.$p.t('global/aktionen'), field: 'actions',
						width: 120,
						formatter: (cell, formatterParams, onRendered) => {

							if (cell.getData().lehrtyp_kurzbz === 'tpl' &&
								cell.getData().software_id !== null)
							{
								let container = document.createElement('div');
								container.className = "d-flex gap-2";

								let button = document.createElement('button');
								button.className = 'btn btn-outline-secondary';
								button.innerHTML = this.$p.t('global/swAendern');
								button.disabled = this.planungDeadlinePast;
								button.addEventListener('click', (event) =>
									this.editSwLvZuordnung(cell.getRow())
								);
								container.append(button);

								button = document.createElement('button');
								button.className = 'btn btn-outline-secondary';
								button.innerHTML = '<i class="fa fa-xmark"></i>';
								button.disabled = this.planungDeadlinePast;
								button.addEventListener('click', () =>
									this.deleteSwLvs(cell.getRow().getIndex())
								);
								container.append(button);

								return container;
							}
						},
						frozen: true
					}
				]
			}
		}
	},
	methods: {
		setTableData(){
			this.table.setData(CoreRESTClient._generateRouterURI(
				'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSwLvsRequestedByTpl' +
				'?studiensemester_kurzbz=' + this.selectedStudiensemester
			))
		},
		replaceTableData(){
			this.table.replaceData(CoreRESTClient._generateRouterURI(
				'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSwLvsRequestedByTpl' +
				'?studiensemester_kurzbz=' + this.selectedStudiensemester
			))
		},
		editSwLvZuordnung(row){
			// If selected row is a Quellkurs
			if (row.getData().lehrtyp_kurzbz === 'tpl')
			{
				this.$refs.softwareaenderungForm.openModalUpdateSwByTemplate(row.getData(), this.selectedStudiensemester);
			}
			// Else its a simple LV
			else
			{
				this.$refs.softwareaenderungForm.openModalUpdateSwByLv(row.getData(), this.selectedStudiensemester);
			}

		},
		async deleteSwLvs(software_lv_id){
			if (!await this.$fhcAlert.confirmDelete()) return;

			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/deleteSwLvs', {
					software_lv_id: software_lv_id,
					studiensemester_kurzbz: this.selectedStudiensemester
				})
				.then((result) => this.reloadTabulator())
				.then(() => this.$fhcAlert.alertSuccess('Gelöscht'))
				.catch((error) => this.$fhcAlert.handleSystemError(error));
		},
		checkIfPlanungDeadlinePast(){
			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/isPlanningDeadlinePast', {
					studiensemester_kurzbz: this.selectedStudiensemester
				})
				.then((result) => this.planungDeadlinePast = result.data)
				.then(() => this.table.redraw(true) ) // Redraw the table to disable/enable action buttons
				.catch((error) => { this.$fhcAlert.handleSystemError(error) });
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungVerwaltungTable.tabulator;
			this.setTableData();

			// Replace column titles with phrasen
			await this.$p.loadCategory(['lehre']);
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
		onCellEdited(cell){
			if (cell.getData().lehrtyp_kurzbz !== 'tpl') {
				this.$fhcApi
					.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/updateLizenzanzahl', [{
						software_lv_id: cell.getData().software_lv_id,
						lizenzanzahl: cell.getData().anzahl_lizenzen,
					}])
					.then(() => this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert')))
					.catch((error) => this.$fhcAlert.handleSystemError(error));
			}
		},
		async prepDataTreeData(data){
			let structuredData = [];
			let qkSwParentLevel = new Set();	// Quellkurs + Software pair

			// Await the extra flag if user is entitled to edit Lizenzanzahl (LV must be entitled by STG OE)
			await this._flagBerechtigtOnStgOe(data);

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

						// Remove unnecessary fields at Quellkurs + Software level  // TODO check ob nötig
						parentItem.software_lv_id = null;
						parentItem.stg_typ_kurzbz = null;
						parentItem.semester = null;
						parentItem.softwarestatus_bezeichnung = null;
						parentItem.softwarestatus_kurzbz = null;

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
		async _flagBerechtigtOnStgOe(swlvs){
			let params = {
				studiensemester_kurzbz: this.selectedStudiensemester,
				lv_ids: swlvs.map(swlv => swlv.lehrveranstaltung_id)
			}

			return new Promise((resolve, reject) => {
				this.$fhcApi
					.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getLvsByStgOe', params)
					.then (result =>
					{
						const data = result.data;
						swlvs.forEach(swlv => {
							const match = data.find(item => item.studiengang_kz === swlv.studiengang_kz);
							swlv.stgOeBerechtigt = !match ? false : true;
						});
						resolve(); // Resolve the Promise when done
					})
					.catch(error => this.$fhcAlert.handleSystemError(error) );
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
		}
	},
	template: `
<div class="softwareanforderungVerwaltung overflow-hidden">
	<div class="row d-flex my-3">
		<div class="col-12 h4">Meine Quellkurs-Softwarebestellungen {{ selectedStudiensemester }}</div>
	</div>
	<div class="row mb-5">
		<div class="col">
			<div class="card bg-light p-2">
				<div class="card-body">
					<core-filter-cmpt
						ref="softwareanforderungVerwaltungTable"
						uniqueId="softwareanforderungVerwaltungTable"
						table-only
						reload
						:side-menu="false"
						:tabulator-options="tabulatorOptions"
						:tabulator-events="[
							{event: 'tableBuilt', handler: onTableBuilt},
							{event: 'rowClick', handler: onRowClick},
							{event: 'cellEdited', handler: onCellEdited}
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
	</div>
</div>

<!-- Form -->
<softwareaenderung-form ref="softwareaenderungForm" @on-saved="reloadTabulator()"></softwareaenderung-form>
`
};
