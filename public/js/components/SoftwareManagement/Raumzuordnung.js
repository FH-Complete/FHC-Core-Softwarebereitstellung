import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import RaumModal from "../Modals/RaumModal.js";
import {Actions} from "./imageverwaltung/Actions.js";

export const Raumzuordnung = {
	components: {
		CoreRESTClient,
		CoreFilterCmpt,
		RaumModal,
		Actions
	},
	data() {
		return {
			softwareimageId: Vue.inject('softwareimageId'),
			softwareTitel: null,
			orte: [],
			orteTabulatorOptions: {
				maxHeight: "100%",
				minHeight: 30,
				layout: 'fitColumns',
				index: 'softwareimageort_id',
				columnDefaults:{
					tooltip:true,
				},
				columns: [
					{title: 'Img-Ort-ID', field: 'softwareimageort_id', headerFilter: true, visible: false},
					{title: 'Image', field: 'image', headerFilter: true},
					{title: 'Img-Verfügbarkeit Start', field: 'image_verfuegbarkeit_start', headerFilter: true,
						hozAlign: 'center', visible: false},
					{title: 'Img-Verfügbarkeit Ende', field: 'image_verfuegbarkeit_ende', headerFilter: true,
						hozAlign: 'center', visible: false},
					{title: 'Ort', field: 'ort_kurzbz', headerFilter: true},
					{title: 'Ort Bezeichnung', field: 'ort_bezeichnung', headerFilter: true, visible: false},
					{title: 'Ort-Verfügbarkeit Start', field: 'verfuegbarkeit_start', headerFilter: true, hozAlign: 'center'},
					{title: 'Ort-Verfügbarkeit Ende', field: 'verfuegbarkeit_ende', headerFilter: true, hozAlign: 'center'},
				]
			}
		}
	},
	mounted(){
		this.$refs.raumTable.tabulator.on("tableBuilt", (e, row) => {

			// Raumzuordnung can be readonly or editable. If editable...
			if (this.$parent.$options.componentName === 'Imageverwaltung')
			{
				// ...add column with checkboxes as front column
				this.$refs.raumTable.tabulator.addColumn(
					{
						field: 'select',
						title: 'rowSelection',
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						titleFormatterParams: {
							rowRange: "active"
						},
						hozAlign: 'left',
						width: 50,
					}, true // front column
				);

				// ...add column with action buttons at the end
				this.$refs.raumTable.tabulator.addColumn(
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
					}, false // append to end
				);
			}
		});
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
		async deleteOrt(softwareimageort_id){

			if (await this.$fhcAlert.confirmDelete() === false) return;

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
						this.$fhcAlert.alertSystemMessage(Object.values(result.data.retval).join('; '));  // TODO backend result anpassen
					}
					else
					{
						this.$fhcAlert.alertSuccess('Gelöscht!');

						// Refresh data in Raumzuordnungstabelle
						this.getOrteByImage(this.softwareimageId);

						// Emit deleted Raumanzahl to be updated in Imagetabelle
						this.$emit('onSaved', -1);
					}
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
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
					this.softwareTitel = software_titel
					if (CoreRESTClient.hasData(result.data)) {
						this.orte = CoreRESTClient.getData(result.data);
					}
					this.$refs.raumTable.tabulator.setData(CoreRESTClient.getData(result.data));
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
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
					this.$refs.raumTable.tabulator.setData(CoreRESTClient.getData(result.data));
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
		},
		onRaumzuordnungSaved(raumanzahlDifferenz) {
			this.$refs.raumModal.hide();

			// Refresh data in Raumzuordnungstabelle
			this.getOrteByImage(this.softwareimageId);

			// Emit added Raumanzahl to be updated in Imagetabelle
			this.$emit('onSaved', raumanzahlDifferenz);
		},
		onVerfuegbarkeitAendernClick(){
			let selectedData = this.$refs.raumTable.tabulator.getSelectedData();

			if (selectedData.length == 0)
			{
				this.$fhcAlert.handleSystemMessage('Bitte erst Zeilen auswählen');
				return;
			}

			this.$refs.raumModal.openVerfuebarkeitAendernModal(selectedData);
		},
	},
	template: `
	<div class="col-md-6">
		<div class="card">
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
					<template v-if="showBtn" v-slot:actions>
						<actions @on-click="onVerfuegbarkeitAendernClick()"></actions>
					 </template>	
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
