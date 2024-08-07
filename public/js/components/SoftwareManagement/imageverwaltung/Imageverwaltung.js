import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import SoftwareimageModal from "../../Modals/SoftwareimageModal.js";
import {Raumzuordnung} from "../Raumzuordnung.js";
import {Softwarezuordnung} from "./Softwarezuordnung.js";

export default {
	componentName: 'Imageverwaltung',
	components: {
		CoreFilterCmpt,
		SoftwareimageModal,
		Raumzuordnung,
		Softwarezuordnung
	},
	provide() {
		return {
			softwareimageId: Vue.computed(() => this.softwareimageId),
			softwareimage_bezeichnung: Vue.computed(() => this.softwareimage_bezeichnung)
		}
	},
	data: function() {
		return {
			softwareimageTabulatorOptions: { // tabulator options which can be modified after first render
				layout: 'fitColumns',
				autoResize:false, // prevent auto resizing of table
				resizableColumnFit:true, //maintain the fit of columns when resizing
				index: 'softwareimage_id',
				selectable: false,
				columns: [
					{title: 'ImageID', field: 'softwareimage_id', visible: false, headerFilter: true, frozen: true},
					{title: this.$p.t('global/bezeichnung'), field: 'bezeichnung', headerFilter: true,
						width: 105,
						minWidth: 105,
						maxWidth: 105,
						frozen: true
					},
					{title: this.$p.t('global/betriebssystem'), field: 'betriebssystem', headerFilter: true},
					{title: this.$p.t('global/verfuegbarkeitStart'), field: 'verfuegbarkeit_start', headerFilter: true, hozAlign: 'center'},
					{title: this.$p.t('global/verfuegbarkeitEnde'), field: 'verfuegbarkeit_ende', headerFilter: true, hozAlign: 'center'},
					{title: 'Anzahl Räume', field: 'ort_count', headerFilter: true, hozAlign: 'right'},
					{title: 'Anzahl Software', field: 'software_count', headerFilter: true, hozAlign: 'right'},
					{title: this.$p.t('global/anmerkung'), field: 'anmerkung', headerFilter: true},
					{title: this.$p.t('global/aktionen'), field: 'actions',
						width: 280,
						minWidth: 280,
						maxWidth: 280,
						formatter: (cell, formatterParams, onRendered) => {
							let container = document.createElement('div');
							container.className = "d-flex gap-2";

							let button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = this.$p.t('global/raumSwZuordnung');
							button.addEventListener('click', (event) => this.openDetail(event, cell.getRow()));
							container.append(button);

							button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-copy"></i>';
							button.addEventListener('click', (event) => this.copySoftwareimage(event, cell.getRow().getIndex()));
							container.append(button);

							button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-edit"></i>';
							button.addEventListener('click', (event) => this.editSoftwareimage(event, cell.getRow().getIndex()));
							container.append(button);

							button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-xmark"></i>';
							button.addEventListener('click', () => this.deleteSoftwareimage(cell.getRow().getIndex()));
							container.append(button);

							return container;
						},
						frozen: true
					}
				]
			},
			softwareimageId: null,
			softwareimage_bezeichnung: ''
		}
	},
	methods: {
		openModal(event, softwareimageId, copy = false) {
			this.$refs.softwareimageModal.open(softwareimageId, copy);
		},
		onSoftwareimageSaved() {
			this.$refs.softwareimageModal.hide();
			this.$refs.softwareimageTable.reloadTable();
		},
		editSoftwareimage(event, softwareimage_id){
			this.openModal(event, softwareimage_id);
		},
		copySoftwareimage(event, softwareimage_id){
			this.openModal(event, softwareimage_id, true);
		},
		async deleteSoftwareimage(softwareimage_id) {

			if (await this.$fhcAlert.confirmDelete() === false) return;

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Image/deleteImage',
				{
					softwareimage_id: softwareimage_id
				}
			).then(
				result => {
					if (CoreRESTClient.isError(result.data)) {
						this.$fhcAlert.alertWarning(result.data.retval);
					}
					else
					{
						this.$fhcAlert.alertSuccess(this.$p.t('global/geloescht'));
						this.$refs.softwareimageTable.reloadTable();

						// Empty Raumzuordnungstabelle
						this.$refs.raumzuordnung.getOrteByImage(null);

						// Empty Softwarezuordnungstabelle
						this.$refs.softwarezuordnung.getSoftwareByImage(null);
					}
				}
			).catch(error => this.$fhcAlert.handleSystemError(error));
		},
		onRaumzuordnungSaved(raumanzahlDifferenz) {

			// Update Raumanzahl in Imagetabelle
			let row = this.$refs.softwareimageTable.tabulator.getRow(this.softwareimageId);
			let oldRaumanzahl = row.getData().ort_count;
			row.update({ort_count: oldRaumanzahl + raumanzahlDifferenz})
		},
		openDetail(e, row){
			// Get Orte
			this.$refs.raumzuordnung.getOrteByImage(row.getIndex(), row.getData().bezeichnung);

			// Get Software
			this.$refs.softwarezuordnung.getSoftwareByImage(row.getIndex(), row.getData().bezeichnung);

			// Get Softwareimage Bezeichnung
			this.softwareimageId = row.getData().softwareimage_id;
			this.softwareimage_bezeichnung = row.getData().bezeichnung;

			let offcanvasElement = new bootstrap.Offcanvas(document.getElementById('imageverwaltungOffcanvas'));
			offcanvasElement.show();
		}
	},
	template: `
	<div class="imageVerwaltung overflow-hidden">
		<!-- Softwareimage Table -->
		<div class="row mb-5">
			<div class="col">
				<!-- Imageverwaltung Tabelle -->
				<core-filter-cmpt
					ref="softwareimageTable"
					filter-type="ImageVerwaltung"
					uniqueId="softwareimageTable"
					:tabulator-options="softwareimageTabulatorOptions"
					:tabulator-events="[{event: 'rowClick', handler: onTableRowClick}]"
					:side-menu="false"
					new-btn-label="Image"
					new-btn-show
					reload
					:download="[{ formatter: 'csv', file: 'softwareimages.csv', options: {delimiter: ';', bom: true} }]"
					@click:new="openModal">
				</core-filter-cmpt>
			</div>
		</div>
		<!-- Softwareimage Details -->	
		<div class="offcanvas offcanvas-start w-75" tabindex="-1" id="imageverwaltungOffcanvas">
			<div class="offcanvas-header">
				<button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
			</div>
			<div class="row">
				<div class="col-12 mb-3">
				<!-- TODO hier weitermachen....tabindex? raum zu image funktioniert nicht wegen 2x overlay offset und modal...-->
					<raumzuordnung ref="raumzuordnung" tabindex="9999" @on-saved="onRaumzuordnungSaved"></raumzuordnung>
				</div>
				<div class="col-12">
					<softwarezuordnung ref="softwarezuordnung"></softwarezuordnung>	
				</div>
			</div>
		</div>		
		<!-- Softwareimage modal component -->
		<softwareimage-modal
		class="fade"
		ref="softwareimageModal"
		dialog-class="modal-lg"
		@on-saved="onSoftwareimageSaved">
	</softwareimage-modal>
	</div>	
	`
};