import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import LizenzserverModal from "../../Modals/LizenzserverModal.js";

export default {
	components: {
		CoreFilterCmpt,
		LizenzserverModal
	},
	data: function() {
		return {
			lizenzserverTabulatorOptions: { // tabulator options which can be modified after first render
				layout: 'fitColumns',
				index: 'lizenzserver_kurzbz',
				selectable: false,
				columns: [
					{title: this.$p.t('global/lizenzserverKurzbz'), field: 'lizenzserver_kurzbz', headerFilter: true,
						width: 150,
						minWidth: 100,
						maxWidth: 200,
						frozen: true
					},
					{title: this.$p.t('global/bezeichnung'), field: 'bezeichnung', headerFilter: true,
						width: 150,
						minWidth: 100,
						maxWidth: 200,
						frozen: true
					},
					{title: 'Mac-Adresse', field: 'macadresse', headerFilter: true},
					{title: 'IP-Adresse', field: 'ipadresse', headerFilter: true},
					{title: this.$p.t('global/ansprechpartner'), field: 'ansprechpartner', headerFilter: true},
					{title: 'Location', field: 'location', headerFilter: true, hozAlign: 'right'},
					{title: this.$p.t('global/anmerkung'), field: 'anmerkung', headerFilter: true, hozAlign: 'right'},
					{
						title: this.$p.t('global/aktionen'),
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
							button.addEventListener('click', (event) => this.editLizenzserver(event, cell.getRow().getIndex()));
							container.append(button);

							button = document.createElement('button');
							button.className = 'btn btn-outline-secondary';
							button.innerHTML = '<i class="fa fa-xmark"></i>';
							button.addEventListener('click', () => this.deleteLizenzserver(cell.getRow().getIndex()));
							container.append(button);

							return container;
						},
						frozen: true
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
					if (CoreRESTClient.isError(result.data)) {
						this.$fhcAlert.alertWarning(result.data.retval);
					}
					else
					{
						this.$fhcAlert.alertSuccess(this.$p.t('global/geloescht'));
						this.$refs.lizenzserverTable.reloadTable();
					}
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
		}
	},
	template: `
	<div class="lizenzserververwaltung overflow-hidden">
		<div class="row">
			<div class="col">
				<!-- Lizenzserververwaltung Tabelle -->
				<core-filter-cmpt
					ref="lizenzserverTable"
					filter-type="LizenzserverVerwaltung"
					uniqueId="lizenzserverTable"
					:tabulator-options="lizenzserverTabulatorOptions"
					:side-menu="false"
					:new-btn-label="$p.t('global/lizenzserver')"
					new-btn-show
					:download="[{ formatter: 'csv', file: 'lizenzserver.csv', options:{delimiter: ';', bom: true} }]"
					@click:new="openModal">	
				</core-filter-cmpt>
				
				<!-- Lizenzserver modal component -->
				<lizenzserver-modal
					class="fade"
					ref="lizenzserverModal"
					dialog-class="modal-lg"
					@on-saved="onLizenzserverSaved">
				</lizenzserver-modal>	
			</div>
		</div>
	</div>
	`
};