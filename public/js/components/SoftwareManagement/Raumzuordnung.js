import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import RaumModal from "../Modals/RaumModal";

export const Raumzuordnung = {
	components: {
		CoreRESTClient,
		CoreFilterCmpt,
		RaumModal
	},
	data() {
		return {
			softwareimageId: Vue.inject('softwareimageId'),
			softwareTitel: null,
			orte: [],
			orteTabulatorOptions: {
				height: "100%",
				layout: 'fitDataFill',
				index: 'softwareimageort_id',
				columns: [
					{
						field: 'select',
						title: 'rowSelection',
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						hozAlign: 'left',
						width: 50,
					},
					{title: 'Image', field: 'image', headerFilter: true},
					{title: 'Raum', field: 'ort_kurzbz', headerFilter: true},
					{title: 'Raum Bezeichnung', field: 'ort_bezeichnung', headerFilter: true, visible: false},
					{title: 'Verfügbar Start', field: 'verfuegbarkeit_start', headerFilter: true},
					{title: 'Verfügbar Ende', field: 'verfuegbarkeit_ende', headerFilter: true},
					{title: 'Image Verfügbarkeit Start', field: 'image_verfuegbarkeit_start', headerFilter: true, visible: false},
					{title: 'Image Verfügbarkeit Ende', field: 'image_verfuegbarkeit_ende', headerFilter: true, visible: false},
					{
						title: 'Aktionen',
						field: 'actions',
						formatter: (cell, formatterParams, onRendered) => {
							let container = document.createElement('div');
							container.className = "d-flex gap-2";

							let button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-edit"></i>';
							button.addEventListener('click', (event) =>
								this.editOrt(cell.getRow().getIndex())
							);
							container.append(button);

							button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-xmark"></i>';
							button.addEventListener('click', () =>
								this.deleteOrt(cell.getRow().getIndex())
							);
							container.append(button);

							return container;
						}
					}
				]
			}
		}
	},
	computed: {
		showBtn() { return Number.isInteger(this.softwareimageId) ? true : false }
	},
	methods: {
		openModal(softwareimageort_id) {
			this.$refs.raumModal.open(softwareimageort_id);
		},
		editOrt(softwareimageort_id){
			this.openModal(softwareimageort_id);
		},
		deleteOrt(softwareimageort_id){
			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Ort/deleteImageort',
				{
					softwareimageort_id: softwareimageort_id
				},
				{
					timeout: 2000
				}
			).then(
				result => {
					if (CoreRESTClient.isError(result.data))
					{
						alert('Fehler beim Löschen des Softwareimageortes: ' + Object.values(result.data.retval).join('; '));
					}
					else
					{
					//	this.$refs.raumTable.reloadTable(); // TODO fix, does not reload yet
					}
				}
			).catch(
				error => {
					alert('Fehler beim Löschen des Softwareimageortes: ' + error.message);
				}
			);
		},
		getOrteBySoftware(software_id, software_titel) {
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getOrteBySoftware',
				{
					software_id: software_id
				},
				{
					timeout: 2000
				}
			).then(
				result => {
					this.orte = [];
					this.show = true;
					this.softwareTitel = software_titel
					if (CoreRESTClient.hasData(result.data)) {
						this.orte = CoreRESTClient.getData(result.data);
					}
					this.$refs.raumTable.tabulator.setData(this.orte);
				}
			).catch(
				error => {
					let errorMessage = error.message ? error.message : 'Unknown error';
					alert('Error when getting Raume: ' + errorMessage); //TODO beautiful alert
				}
			);
		},
		getOrteByImage(softwareimage_id) {
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Ort/getOrteByImage',
				{
					softwareimage_id: softwareimage_id
				},
				{
					timeout: 2000
				}
			).then(
				result => {
					this.orte = [];
					if (CoreRESTClient.hasData(result.data)) {
						this.orte = CoreRESTClient.getData(result.data);
					}
					this.$refs.raumTable.tabulator.setData(this.orte);
				}
			).catch(
				error => {
					let errorMessage = error.message ? error.message : 'Unknown error';
					alert('Error when getting Raume: ' + errorMessage);
				}
			);
		},
		onRaumzuordnungSaved() {
			this.$refs.raumModal.hide();
			//this.$refs.raumTable.reloadTable(); // TODO fix, does not reload yet
		},
	},
	template: `
	<div class="col-md-6">
		<div class="card" v-show="show">
			<h3 class="h5 card-header">Raumzuordnung<span class="fhc-subtitle">Zuordnung über Image</span></h3>
			<div class="card-body">
				<core-filter-cmpt
					ref="raumTable"
					:side-menu="false"
					:table-only=true
					:tabulator-options="orteTabulatorOptions"
					:new-btn-label="'Raum'"
					:new-btn-show="showBtn" 
					@click:new="openModal()">		
				</core-filter-cmpt>
			</div>
		</div>
	</div>	
	
	<!-- Raumzuordnung modal component -->
	<raum-modal
		class="fade"
		ref="raumModal"
		dialog-class="modal-lg"
		@on-saved="onRaumzuordnungSaved">
	</raum-modal>	
	`
};
