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
		'selectedStudienjahr',
		'currentTab'
	],
	data: function() {
		return {
			table: null,
			planungDeadlinePast: false,
			vorrueckenActivated: false,
			vorrueckStudienjahr: '',
			cbDataTree: true, // checkbox display dataTree or not
			cbDataTreeStartExpanded: false,	// checkbox expand dataTree or not
			cbGroupStartOpen: true // checkbox group organisationseinheit start open
		}
	},
	watch: {
		cbGroupStartOpen(newVal){
			this.table.setGroupStartOpen(newVal);
			this.replaceTableData();
		},
		cbDataTreeStartExpanded(newVal){
			if (newVal) this.table.redraw(true);
		},
		selectedStudienjahr(newVal) {
			if(newVal && this.currentTab === "softwarebereitstellungUebersicht" && this.table) {
				this.replaceTableData();
				this.setVorrueckStudienjahr(this.selectedStudienjahr);
				if (this.vorrueckenActivated) this.deactivateVorruecken();
			}
		},
		currentTab(newVal) {
			if (newVal === 'softwarebereitstellungUebersicht' && this.selectedStudienjahr && this.table) {
				this.replaceTableData();
				this.setVorrueckStudienjahr(this.selectedStudienjahr);
				if (this.vorrueckenActivated) this.deactivateVorruecken();
			}
		}
	},
	computed: {
		tabulatorOptions() {
			const self = this;
			return {
				// NOTE: data is set on table built to await preselected actual Studienjahr
				ajaxResponse(url, params, response){
					return self.prepDataTreeData(response.data); // Prepare data for dataTree view
				},
				layout: 'fitColumns',
				autoResize: false, // prevent auto resizing of table
				resizableColumnFit: true, //maintain the fit of columns when resizing
				index: 'software_lv_id',
				groupBy: 'lv_oe_bezeichnung',
				groupToggleElement:"header", //toggle group on click anywhere in the group header
				dataTree: self.cbDataTree,
				dataTreeStartExpanded: [self.cbDataTreeStartExpanded],
				dataTreeElementColumn: 'lv_bezeichnung',
				dataTreeChildIndent: 15, //indent child rows by 15 px
				dataTreeSelectPropagate: true, //propagate selection events from parent rows to children
				persistence: {
					filter: false, //persist filter sorting
				},
				selectable: true,
				selectableRangeMode: 'click',
				selectableCheck: function (row) {
					let data = row.getData();
					return self.vorrueckenActivated
						? data.lehrtyp_kurzbz === 'tpl' && (
							data.abbestelltamum === null ||
							data.softwarestatus_kurzbz === 'endoflife' ||
							data.softwarestatus_kurzbz === 'nichtverfuegbar' ||
							data.isMissingLvNextYear === true ||
							data.isVorgerueckt === true)  // TODO check ob auch wenn lehrtyp lv
						: data.lehrtyp_kurzbz === 'tpl';
				},
				rowFormatter: function(row) {
					const data = row.getData();
					const selectionCell = row.getCell('selection');

					// Hide children checkboxes for children SwLvs
					if (selectionCell) {
						const checkbox = selectionCell.getElement().querySelector("input[type='checkbox']");
						if (checkbox && data.lehrtyp_kurzbz !== 'tpl') checkbox.style.display = "none";
					}

					// Format text color and pointer events for different states
					const rowElement = row.getElement();
					const isDisabled = self.vorrueckenActivated && (
						data.abbestelltamum !== null ||
						data.softwarestatus_kurzbz === 'endoflife' ||
						data.softwarestatus_kurzbz === 'nichtverfuegbar' ||
						data.isMissingLvNextYear === true ||
						data.isVorgerueckt === true
					)

					rowElement.classList.remove("tabulator-unselectable"); // Ensure class doesn't interfere
					rowElement.style.color = self.vorrueckenActivated && isDisabled ? "grey" : "black";
					rowElement.style.pointerEvents = isDisabled ? "none" : "auto";
				},
				columns: [
					{
						field: 'selection',
						formatter: 'rowSelection',
						headerSort: false,
						width: 70,
						visible: false
					},
					{title: 'SW-LV-ID', field: 'software_lv_id', headerFilter: true, visible: false},
					{title: 'SW-ID', field: 'software_id', headerFilter: true, visible: false},
					{title: 'LV-ID', field: 'lehrveranstaltung_id', headerFilter: true, visible: false},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true, width: 350},
					{title: 'Studiensemester', field: 'studiensemester_kurzbz', headerFilter: true, visible:true, width: 90},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false},
					{title: 'STG KZ', field: 'studiengang_kz', headerFilter: true, visible:false},
					{title: 'Lehrtyp-Kurzbz', field: 'lehrtyp_kurzbz', headerFilter: true, visible:false},
					{title: 'STG Kurzbz', field: 'stg_typ_kurzbz', headerFilter: true, visible:true, width: 70},
					{title: 'SW-Typ Kurzbz', field: 'softwaretyp_kurzbz', headerFilter: true, visible: false},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true, visible: false, },
					{title: 'OrgForm', field: 'orgform_kurzbz', headerFilter: true, width: 70},
					{title: 'Semester', field: 'semester', headerFilter: true, hozAlign: 'right', width: 50},
					{title: 'LE-Gruppen', field: 'lehreinheitgruppen_bezeichnung', headerFilter: true, width: 200, visible: false},
					{title: 'SW-Typ', field: 'softwaretyp_bezeichnung', headerFilter: true, width: 200, visible: false},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right', width: 100},
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
							elementAttributes:{maxlength:"3",},
							selectContents:true,
							verticalNavigation:"table", //up and down arrow keys navigate away from cell without changing value
						},
						editable: (cell) => {
							let rowData = cell.getRow().getData();
							return rowData.lehrtyp_kurzbz !== 'tpl';
						},
						validator: ["min:0", "maxLength:3", "integer"]
					},
					{title: this.$p.t('global/aktionen'), field: 'actions',
						width: 120,
						formatter: (cell, formatterParams, onRendered) => {

							if (cell.getData().lehrtyp_kurzbz === 'tpl')
							{
								let container = document.createElement('div');
								container.className = "d-flex gap-2";

								let button = document.createElement('button');
								button.className = 'btn btn-outline-secondary';
								button.innerHTML = 'SW ändern'
								button.disabled = self.planungDeadlinePast;
								button.addEventListener('click', (event) =>
									self.editSwLvZuordnung(cell.getRow())
								);
								container.append(button);

								button = document.createElement('button');
								button.className = 'btn btn-outline-secondary';
								button.innerHTML = '<i class="fa fa-xmark"></i>';
								button.disabled = self.planungDeadlinePast;
								button.addEventListener('click', () =>
									self.deleteSwLvs(cell.getRow().getIndex())
								);
								container.append(button);

								return container;
							}
						},
						frozen: true
					},
					{
						title: this.vorrueckStudienjahr,
						field: 'vorrueckStudienjahr',
						formatter: this._formatVorrueckTableData,
						headerSort: false,
						width: 170,
						visible: false,
					}
				]
			}
		},
	},
	methods: {
		editSwLvZuordnung(row){
			// If selected row is a Quellkurs
			if (row.getData().lehrtyp_kurzbz === 'tpl')
			{
				this.$refs.softwareaenderungForm.openModalUpdateSwByTemplate(row.getData());
			}
			// Else its a simple LV
			else
			{
				this.$refs.softwareaenderungForm.openModalUpdateSwByLv(row.getData());
			}

		},
		async deleteSwLvs(software_lv_id){
			if (!await this.$fhcAlert.confirmDelete()) return;

			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/deleteSwLvsByTpl', {
					software_lv_id: software_lv_id,
					studienjahr_kurzbz: this.selectedStudienjahr
				})
				.then((result) => {
					this.$fhcAlert.alertSuccess('Gelöscht');
					this.reloadTabulator();
				})
				.catch((error) => this.$fhcAlert.handleSystemError(error));
		},
		vorrueckenSwLvs() {
			let selectedData = this.table.getSelectedData();
			if (selectedData.length === 0) return;

			// Save SW-LV-Zuordnungen
			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/vorrueckSwLvsByTpl', {
					software_lv_ids: selectedData.map((item) => item.software_lv_id),
					studienjahr_kurzbz: this.vorrueckStudienjahr
				})
				.then(result => {
					if (result.data.length > 0) {
						this.$fhcAlert.alertSuccess(this.$p.t('ui', 'gespeichert'));

						// If dataTree not expanded, update parent level -> lightweight performance
						if (!this.cbDataTreeStartExpanded) {
							let updateData = [];
							let tpl_software_lv_ids = this.table.getData().map((row) => row.software_lv_id);

							result.data.forEach(swlvId => {
								// Add to updateData only the template swlvIds (to make updateData work correctly)
								if (tpl_software_lv_ids.includes(swlvId))
									updateData.push(
										{
											software_lv_id: swlvId,
											isVorgerueckt: true
										}
									)
							});

							this.table.updateData(updateData).then(() => this.table.redraw(true));
						}
						// If dataTree is expanded, use method as workaround to update also children rows
						else
						{
							// Use this method as workaround to update also children rows
							this._addVorrueckTableData();

						}
					}
				})
				.catch(error => this.$fhcAlert.handleSystemError(error));
		},
		abbestellenSwLvs() {
			let selectedData = this.table.getSelectedData();

			// Cancel SW-LV-Bestellungen (abbestellen)
			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/abbestellenSwLvs', {
					data: selectedData.map((item) => item.software_lv_id)
				})
				.then(result => result.data)
				.then(data => {
					if (data && Array.isArray(data) && data.length > 0)
					{
						this.table.updateData(data);
						this.$fhcAlert.alertSuccess(this.$p.t('ui', 'abbestellt'));

						this.$fhcApi
							.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/sendMailSoftwareAbbestellt', {
								data: data.map((item) => item.software_lv_id)
							})
							.catch(error => this.$fhcAlert.handleSystemError(error));
					}
				})
				.then(() => this.table.redraw(true))
				.catch(error => this.$fhcAlert.handleSystemError(error));
		},
		activateVorruecken(){
			this.vorrueckenActivated = true;
			this.table.showColumn('selection');
			this.table.showColumn('vorrueckStudienjahr');
			this.table.redraw(true);
		},
		deactivateVorruecken(){
			this.vorrueckenActivated = false;
			this.table.hideColumn('vorrueckStudienjahr');
			this.table.hideColumn('selection');
			this.table.deselectRow();
			this.table.redraw(true);
		},
		_addVorrueckTableData(){
		 	// Select all rows to get also children swlvs
		 	this.table.selectRow();
		 	const tableData = this.table.getSelectedData();
			this.table.deselectRow();

			if (tableData.length > 0)
			return this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/validateVorrueckSwLvsForTpl', {
					software_lv_ids: tableData.map(row => row.software_lv_id),
					studienjahr_kurzbz: this.vorrueckStudienjahr
				})
				.then((result) => {
					if (result.data) {
						const isVorgerrueckt_software_lv_ids = result.data.isVorgerrueckt_software_lv_ids;
						const isMissingLvNextYear_software_lv_ids = result.data.isMissingLvNextYear_software_lv_ids;

						tableData.forEach(rowData => {
							rowData.isVorgerueckt = isVorgerrueckt_software_lv_ids.includes(rowData.software_lv_id);
							rowData.isMissingLvNextYear = isMissingLvNextYear_software_lv_ids.includes(rowData.software_lv_id);
						})

						return tableData;
					}
				})
				.then((tableData) => {
					if (tableData) this.table.updateData(tableData)
				})
				.then(() => this.table.redraw(true))
				.catch(error => {this.$fhcAlert.handleSystemError(error)});
		},
		_formatVorrueckTableData(cell, formatterParams, onRendered){
			let data = cell.getRow().getData();

			if (data.abbestelltamum !== null) {
				return `<span class="badge bg-danger">Abbestellt</span>`;
			} else if (
				data.softwarestatus_kurzbz === 'endoflife' ||
				data.softwarestatus_kurzbz === 'nichtverfuegbar'
			) {
				return `<span class="badge bg-danger">Nicht bestellbar</span>`;
			} else if (data.isMissingLvNextYear === true) {
				return `<span class="badge bg-light text-dark">LV-ID fehlt ${this.vorrueckStudienjahr}</span>`;
			} else if (data.isVorgerueckt === true) {
				return `<span class="badge bg-success">Vorgerückt</span>`;
			}
			return "";
		},
		setVorrueckStudienjahr(selectedStudienjahr){
			return this.$fhcApi
				.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getVorrueckStudienjahr', {
					studienjahr_kurzbz: selectedStudienjahr
				})
				.then(result => {
					this.vorrueckStudienjahr = result.data;
					return result.data;
				})
				.catch(error => this.$fhcAlert.handleSystemError(error) );
		},
		setTableData(){
			if (this.selectedStudienjahr)
				this.$fhcApi
					.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/isPlanningDeadlinePast', {
						studienjahr_kurzbz: this.selectedStudienjahr
					})
					.then((result) => this.planungDeadlinePast = result.data)
					.then(() =>
						this.table
							.setData(CoreRESTClient._generateRouterURI(
								'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSwLvsRequestedByTpl' +
								'?studienjahr_kurzbz=' + this.selectedStudienjahr
							))
							.then(() => this._addVorrueckTableData())
					)
					.catch((error) => { this.$fhcAlert.handleSystemError(error) });

		},
		replaceTableData(){
			this.$fhcApi
				.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/isPlanningDeadlinePast', {
					studienjahr_kurzbz: this.selectedStudienjahr
				})
				.then((result) => this.planungDeadlinePast = result.data)
				.then(() => {
					this.table.replaceData(CoreRESTClient._generateRouterURI(
						'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSwLvsRequestedByTpl' +
						'?studienjahr_kurzbz=' + this.selectedStudienjahr
					))
				})
				.catch((error) => { this.$fhcAlert.handleSystemError(error) });
		},
		onRowClick(e, row) {
			if (!this.vorrueckenActivated) row.deselect();
		},
		onRowDblClick(e, row) {
			row.treeToggle();
		},
		onDataLoaded(data) {
			console.log('onDataLoaded');
			if (this.table) this._addVorrueckTableData();
		},
		async onTableBuilt(){
			this.table = this.$refs.softwareanforderungVerwaltungTable.tabulator;

			this.setTableData();

			if (this.selectedStudienjahr)
				this.setVorrueckStudienjahr(this.selectedStudienjahr).then((vorrueckStudienjahr) =>
					this.table.updateColumnDefinition('vorrueckStudienjahr', {title: vorrueckStudienjahr })
				);

			// Replace column titles with phrasen
			await this.$p.loadCategory(['lehre']);
			this.table.updateColumnDefinition('lv_bezeichnung', {title: this.$p.t('lehre', 'lehrveranstaltung')});
		},
		onCellEdited(cell) {
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
		<div class="col-12 h4">Meine Quellkurs-Softwarebestellungen {{ selectedStudienjahr }}</div>
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
							{event: 'rowClick', handler: onRowClick},
							{event: 'rowDblClick', handler: onRowDblClick},
							{event: 'tableBuilt', handler: onTableBuilt},
							{event: 'cellEdited', handler: onCellEdited},
							{event: 'dataLoaded', handler: onDataLoaded}
						]"
						:download="[{ formatter: 'csv', file: 'software.csv', options: {delimiter: ';', bom: true} }]">
						<template v-slot:actions>
							<button class="btn btn-outline-secondary dropdown-toggle" type="button" id="statusDropdown" data-bs-toggle="dropdown" aria-expanded="false">
								{{ $p.t('ui/aktion') }}
							</button>
							<ul class="dropdown-menu" aria-labelledby="statusDropdown">
								<li>
									<a class="dropdown-item" href="#"
										@click="activateVorruecken">
										<!--{{ $p.t('global/anforderungenVorruecken') }}--> Bestellungen vorrücken/abbestellen
									</a>
								</li>
							</ul>
							<button v-if="vorrueckenActivated" class="btn btn-outline-secondary" type="button" @click="deactivateVorruecken">
								{{ $p.t('ui/abbrechen') }}
							</button>
							<button v-if="vorrueckenActivated" class="btn btn-danger" type="button" @click="abbestellenSwLvs">
								<!--{{ $p.t('ui/abbestellen') }}--> Abbestellen
							</button>	
							<button v-if="vorrueckenActivated" class="btn btn-primary" type="button" @click="vorrueckenSwLvs">
								<!--{{ $p.t('ui/vorruecken') }}--> Vorrücken in {{ vorrueckStudienjahr }}
							</button>
							<div class="form-check form-check-inline ms-3">
								<input
									class="form-check-input"
									type="checkbox"
									v-model="cbGroupStartOpen">
								<label class="form-check-label">Kompetenzfelder {{ $p.t('global/aufgeklappt') }}</label>
							</div>
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
		</div>
	</div>
</div>

<!-- Form -->
<softwareaenderung-form ref="softwareaenderungForm" @on-saved="reloadTabulator()"></softwareaenderung-form>
`
};
