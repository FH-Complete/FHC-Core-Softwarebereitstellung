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
				index: 'softwareimage_id',
				columns: [
					{title: 'ImageID', field: 'softwareimage_id', visible: false, headerFilter: true, frozen: true},
					{title: 'Bezeichnung', field: 'bezeichnung', headerFilter: true, frozen: true},
					{title: 'Betriebssystem', field: 'betriebssystem', headerFilter: true},
					{title: 'Verfügbarkeit Start', field: 'verfuegbarkeit_start', headerFilter: true, hozAlign: 'center'},
					{title: 'Verfügbarkeit Ende', field: 'verfuegbarkeit_ende', headerFilter: true, hozAlign: 'center'},
					{title: 'Anzahl Räume', field: 'ort_count', headerFilter: true, hozAlign: 'right'},
					{title: 'Anzahl Software', field: 'software_count', headerFilter: true, hozAlign: 'right'},
					{title: 'Anmerkung', field: 'anmerkung', headerFilter: true},
					{
						title: 'Aktionen',
						field: 'actions',
						width: 105,
						minWidth: 105,
						maxWidth: 105,
						formatter: (cell, formatterParams, onRendered) => {
							let container = document.createElement('div');
							container.className = "d-flex gap-2";

							let button = document.createElement('button');
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
	mounted(){
		// Row click event (showing softwareimage details)
		this.$refs.softwareimageTable.tabulator.on('rowClick', (e, row) => {
			// Exclude other clicked elements like buttons, icons...
			if (e.target.nodeName != 'DIV') return;

			// Get Orte
			this.$refs.raumzuordnung.getOrteByImage(row.getIndex());

			// Get Software
			this.$refs.softwarezuordnung.getSoftwareByImage(row.getIndex());

			// Get Softwareimage Bezeichnung
			this.softwareimageId = row.getData().softwareimage_id;
			this.softwareimage_bezeichnung = row.getData().bezeichnung;


			// Scroll to Detail
			window.scrollTo(0, this.$refs.softwareimageDetail.offsetTop);
		});
	},
	methods: {
		openModal(event, softwareimageId, copy = false) {
			this.$refs.softwareimageModal.open(softwareimageId, copy);
		},
		onSoftwareimageSaved() {
			console.log('onSoftwareimageSaved:');
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
					this.$fhcAlert.alertSuccess('Gelöscht!');
					this.$refs.softwareimageTable.reloadTable();

					// Empty Raumzuordnungstabelle
					this.$refs.raumzuordnung.getOrteByImage(null);

					// Empty Softwarezuordnungstabelle
					this.$refs.softwarezuordnung.getSoftwareByImage(null);
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
		},
		onRaumzuordnungSaved(raumanzahlDifferenz) {

			// Update Raumanzahl in Imagetabelle
			let row = this.$refs.softwareimageTable.tabulator.getRow(this.softwareimageId);
			let oldRaumanzahl = row.getData().ort_count;
			row.update({ort_count: oldRaumanzahl + raumanzahlDifferenz})
		}
	},
	template: `
	<div class="row">
		<div class="col">
			<!-- Imageverwaltung Tabelle -->
			<core-filter-cmpt
				ref="softwareimageTable"
				filter-type="ImageVerwaltung"
				uniqueId="softwareimageTable"
				:tabulator-options="softwareimageTabulatorOptions"
				:side-menu="false"
				new-btn-label="Image"
				new-btn-show
				:download="[{ formatter: 'csv', file: 'softwareimages.csv', options: {delimiter: ';', bom: true} }]"
				@click:new="openModal">
			</core-filter-cmpt>
			
			<!-- Softwareimage Details -->			
			<div class="row mt-3">
				<h2 ref="softwareimageDetail" class="h4 mb-3">Softwareimage-Details
					<span class="text-uppercase">{{ softwareimage_bezeichnung }}</span>
				</h2>	
				<div class="col-md-6">
					<raumzuordnung ref="raumzuordnung" @on-saved="onRaumzuordnungSaved"></raumzuordnung>								
				</div>							
				<div class="col-md-6">						
					<softwarezuordnung ref="softwarezuordnung"></softwarezuordnung>		
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
	</div>
	`
};