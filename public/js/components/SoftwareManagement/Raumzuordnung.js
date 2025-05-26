import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import RaumModal from "../Modals/RaumModal.js";
import {Actions} from "./imageverwaltung/Actions.js";
import ApiOrt from "../../api/ort.js";

export const Raumzuordnung = {
	components: {
		CoreFilterCmpt,
		RaumModal,
		Actions
	},
	data() {
		return {
			softwareimageId: Vue.inject('softwareimageId'),
			softwareimage_bezeichnung: Vue.inject('softwareimage_bezeichnung'),
			softwareTitel: null,
			orte: [],
			orteTabulatorOptions: {
				layout: 'fitColumns',
				index: 'softwareimageort_id',
				selectable: true,
				selectableRangeMode: 'click',
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
	computed: {
		showBtn() { return Number.isInteger(this.softwareimageId) ? true : false },
		raumTableTitle() {
			if (this.$parent.$options.componentName === 'Imageverwaltung')
			{
				return this.softwareimage_bezeichnung ? this.softwareimage_bezeichnung : '[ ' + this.$p.t('global/imageAuswaehlen') + ' ]';
			}
			else
			{
				return this.softwareTitel ? this.softwareTitel : '[ ' + this.$p.t('global/softwareAuswaehlen') + ' ]';
			}
		}
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

			this.$api
				.call(ApiOrt.deleteImageort(softwareimageort_id))
				.then(result => {
					if (result.error)
					{
						this.$fhcAlert.alertSystemMessage(Object.values(result.retval).join('; '));  // TODO backend result anpassen
					}
					else
					{
						this.$fhcAlert.alertSuccess(this.$p.t('global/geloescht'));

						// Refresh data in Raumzuordnungstabelle
						this.getOrteByImage(this.softwareimageId);

						// Emit deleted Raumanzahl to be updated in Imagetabelle
						this.$emit('onSaved', -1);
					}
				})
				.catch(error => this.$fhcAlert.handleSystemError(error));
		},
		getOrteBySoftware(software_id, software_titel) {
			this.$api
				.call(ApiOrt.getOrteBySoftware(software_id))
				.then(result => {
					this.orte = [];
					this.softwareTitel = software_titel
					if (result.retval) {
						this.orte = result.retval;
					}
					this.$refs.raumTable.tabulator.setData(result.retval);
				})
				.catch(error => this.$fhcAlert.handleSystemError(error));
		},
		getOrteByImage(softwareimage_id) {
			this.$api
				.call(ApiOrt.getOrteByImage(softwareimage_id))
				.then(result => {
					this.orte = [];
					if (result.retval) {
						this.orte = result.retval;
					}
					this.$refs.raumTable.tabulator.setData(result.retval);
				})
				.catch(error => this.$fhcAlert.handleSystemError(error));
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
				this.$fhcAlert.handleSystemMessage(this.$p.t('global/zeilenAuswaehlen'));
				return;
			}

			this.$refs.raumModal.openVerfuebarkeitAendernModal(selectedData);
		},
		onTableBuilt(e, row){
			// Raumzuordnung can be readonly or editable. If editable...
			if (this.$parent.$options.componentName === 'Imageverwaltung')
			{
				// ...add column with checkboxes as front column
				this.$refs.raumTable.tabulator.addColumn(
					{
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						titleFormatterParams: {
							rowRange: "active"
						},
						width: 50,
						frozen: true
					}, true // front column
				);

				// ...add column with action buttons at the end
				this.$refs.raumTable.tabulator.addColumn(
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
						},
						frozen: true
					}, false // append to end
				);
			}
		}
	},
	template: `
	<div class="raumzuordnung overflow-hidden">
		<div class="card">
			<h3 class="h5 card-header">{{ $p.t('global/raumverfuegbarkeit') }}<span class="fhc-subtitle">{{ $p.t('global/zuordnungUeberImage') }}</span></h3>
			<div class="card-body">
				<core-filter-cmpt
					ref="raumTable"
					:side-menu="false"
					:title="raumTableTitle"
					table-only
					:tabulator-options="orteTabulatorOptions"
					:tabulator-events="[{event: 'tableBuilt', handler: onTableBuilt}]"
					:new-btn-label="$p.t('global/raum')"
					:new-btn-show="showBtn" 
					@click:new="openModal()">	
					<template v-if="showBtn" v-slot:actions>
						<actions @on-click="onVerfuegbarkeitAendernClick()"></actions>
					 </template>	
				</core-filter-cmpt>
			</div>
		</div>
		<!-- Raumzuordnung modal component -->
		<raum-modal
			class="fade"
			ref="raumModal"
			dialog-class="modal-lg"
			@on-saved="onRaumzuordnungSaved">
		</raum-modal>	
	</div>
	`
};
