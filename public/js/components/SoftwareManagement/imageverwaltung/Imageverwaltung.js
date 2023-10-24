import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import SoftwareimageModal from "../../Modals/SoftwareimageModal.js";
import {Raumzuordnung} from "../Raumzuordnung.js";
import {Softwarezuordnung} from "./Softwarezuordnung.js";
import {Alert} from "../Alert.js";

export const Imageverwaltung = {
	componentName: 'Imageverwaltung',
	components: {
		CoreFilterCmpt,
		SoftwareimageModal,
		Raumzuordnung,
		Softwarezuordnung
	},
	mixins: [Alert],
	emits: [
		'newFilterEntry',
	],
	provide() {
		return {
			softwareimageId: Vue.computed(() => this.softwareimageId),
			softwareimage_bezeichnung: Vue.computed(() => this.softwareimage_bezeichnung)
		}
	},
	data: function() {
		return {
			softwareimageTabulatorOptions: { // tabulator options which can be modified after first render
				maxHeight: "100%",
				layout: 'fitColumns',
				index: 'softwareimage_id',
				columnDefaults:{
					tooltip:true,
				},
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
						hozAlign: 'center',
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
						}
					}
				]
			},
			tabulatorAdditionalColumns: ['actions'],
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

			if (await this.confirmDelete() === false) return;

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Image/deleteImage',
				{
					softwareimage_id: softwareimage_id
				}
			).then(
				result => {
					this.alertSuccess('Gelöscht!');
					this.$refs.softwareimageTable.reloadTable();

					// Empty Raumzuordnungstabelle
					this.$refs.raumzuordnung.getOrteByImage(null);

					// Empty Softwarezuordnungstabelle
					this.$refs.softwarezuordnung.getSoftwareByImage(null);
				}
			).catch(
				error => {
					this.alertSystemError(error);
				}
			);
		},
		onRaumzuordnungSaved(raumanzahlDifferenz) {

			// Update Raumanzahl in Imagetabelle
			let row = this.$refs.softwareimageTable.tabulator.getRow(this.softwareimageId);
			let oldRaumanzahl = row.getData().ort_count;
			row.update({ort_count: oldRaumanzahl + raumanzahlDifferenz})
		},
		emitNewFilterEntry: function(payload) {
			this.$emit('newFilterEntry', payload);
		}
	},
	template: `
	<!-- Imageverwaltung Tabelle -->
	<core-filter-cmpt
		ref="softwareimageTable"
		filter-type="ImageVerwaltung"
		:tabulator-options="softwareimageTabulatorOptions"
		:tabulatorAdditionalColumns="tabulatorAdditionalColumns"
		:new-btn-label="'Image'"
		:new-btn-show="true"
		@nw-new-entry="emitNewFilterEntry"
		@click:new="openModal">
	</core-filter-cmpt>
	
	<!-- Softwareimage Details -->
	<h2 ref="softwareimageDetail" class="h4 fhc-hr mt-5">Softwareimage-Details
		<span class="text-uppercase">{{ softwareimage_bezeichnung }}</span></h2>				
	<div class="row">						
		<raumzuordnung ref="raumzuordnung" @on-saved="onRaumzuordnungSaved"></raumzuordnung>								
		<softwarezuordnung ref="softwarezuordnung"></softwarezuordnung>								
	</div>
	
	<!-- Softwareimage modal component -->
	<softwareimage-modal
		class="fade"
		ref="softwareimageModal"
		dialog-class="modal-lg"
		@on-saved="onSoftwareimageSaved">
	</softwareimage-modal>	
	`
};