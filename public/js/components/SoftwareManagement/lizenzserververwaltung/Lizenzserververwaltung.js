import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import LizenzserverModal from "../../Modals/LizenzserverModal.js";

export const Lizenzserververwaltung = {
	components: {
		CoreFilterCmpt,
		LizenzserverModal
	},
	emits: [
		'newFilterEntry',
	],
	data: function() {
		return {
			lizenzserverTabulatorOptions: { // tabulator options which can be modified after first render
				maxHeight: "100%",
				layout: 'fitColumns',
				index: 'lizenzserver_kurzbz',
				columnDefaults:{
					tooltip:true,
				},
				columns: [
					{title: 'Kurzbezeichung', field: 'lizenzserver_kurzbz', headerFilter: true, frozen: true},
					{title: 'Bezeichnung', field: 'bezeichnung', headerFilter: true, frozen: true},
					{title: 'Mac-Adresse', field: 'macadresse', headerFilter: true},
					{title: 'IP-Adresse', field: 'ipadresse', headerFilter: true},
					{title: 'Anpsprechpartner', field: 'ansprechpartner', headerFilter: true},
					{title: 'Location', field: 'location', headerFilter: true, hozAlign: 'right'},
					{title: 'Anmerkung', field: 'anmerkung', headerFilter: true, hozAlign: 'right'},
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
							button.addEventListener('click', (event) => this.editLizenzserver(event, cell.getRow().getIndex()));
							container.append(button);

							button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-xmark"></i>';
							button.addEventListener('click', () => this.deleteLizenzserver(cell.getRow().getIndex()));
							container.append(button);

							return container;
						}
					}
				]
			}
		}
	},
	methods: {
		openModal(event, lizenzserver_kurzbz) {
			this.$refs.lizenzserverModal.open(lizenzserver_kurzbz);
		},
		onLizenzserverSaved() {
			this.$refs.lizenzserverModal.hide();
			this.$refs.lizenzserverTable.reloadTable();
		},
		editLizenzserver(event, lizenzserver_kurzbz){
			this.openModal(event, lizenzserver_kurzbz);
		},
		async deleteLizenzserver(lizenzserver_kurzbz) {

			if (await this.$fhcAlert.confirmDelete() === false) return;

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Lizenzserver/deleteLizenzserver',
				{
					lizenzserver_kurzbz: lizenzserver_kurzbz
				}
			).then(
				result => {
					this.$fhcAlert.alertSuccess('Gelöscht!');
					this.$refs.lizenzserverTable.reloadTable();
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
		},
		emitNewFilterEntry: function(payload) {
			this.$emit('newFilterEntry', payload);
		}
	},
	template: `
	<!-- Lizenzserververwaltung Tabelle -->
	<core-filter-cmpt
		ref="lizenzserverTable"
		filter-type="LizenzserverVerwaltung"
		:tabulator-options="lizenzserverTabulatorOptions"
		new-btn-label="Lizenzserver"
		new-btn-show="true"
		@nw-new-entry="emitNewFilterEntry"
		@click:new="openModal">	
	</core-filter-cmpt>
	
	<!-- Lizenzserver modal component -->
	<lizenzserver-modal
		class="fade"
		ref="lizenzserverModal"
		dialog-class="modal-lg"
		@on-saved="onLizenzserverSaved">
	</lizenzserver-modal>	
	`
};