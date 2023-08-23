import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import SoftwareimageModal from "../../Modals/SoftwareimageModal";
export const Imageverwaltung = {
	components: {
		CoreFilterCmpt,
		SoftwareimageModal
	},
	emits: [
		'filterMenuUpdated',
	],
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
					{title: 'Verfügbarkeit Start', field: 'verfuegbarkeit_start', headerFilter: true},
					{title: 'Verfügbarkeit Ende', field: 'verfuegbarkeit_ende', headerFilter: true},
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
			tabulatorAdditionalColumns: ['actions']
		}
	},
	methods: {
		openModal(event, softwareimageId) {
			this.$refs.softwareimageModal.open(softwareimageId);
		},
		onSoftwareimageSaved() {
			this.$refs.softwareimageModal.hide();
			this.$refs.softwareimageTable.reloadTable();
		},
		editSoftwareimage(event, softwareimage_id){
			this.openModal(event, softwareimage_id);
		},
		deleteSoftwareimage(softwareimage_id) {
			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Image/deleteImage',
				{
					softwareimage_id: softwareimage_id
				}
			).then(
				result => {
					this.$refs.softwareimageTable.reloadTable();
				}
			).catch(
				error => {
					alert('Error when deleting softwareimage: ' + error.message);
				}
			);
		},
		updateFilterMenuEntries: function(payload) {
			// console.log('* IMG / updateFilterMenuEntries: payload.children:');
			// console.log(payload.children[0]);
			this.$emit('filterMenuUpdated', payload);
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
		@nw-new-entry="updateFilterMenuEntries"
		@click:new="openModal">
	</core-filter-cmpt>
	
	<!-- Softwareimage modal component -->
	<softwareimage-modal
		class="fade"
		ref="softwareimageModal"
		dialog-class="modal-lg"
		@on-saved="onSoftwareimageSaved">
	</softwareimage-modal>	
	`
};