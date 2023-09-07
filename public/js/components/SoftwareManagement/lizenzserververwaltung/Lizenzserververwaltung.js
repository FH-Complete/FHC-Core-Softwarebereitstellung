import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import LizenzserverModal from "../../Modals/LizenzserverModal";

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
					{title: 'Anmerkung', field: 'anmerkung', headerFilter: true, hozAlign: 'right'}
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
		emitNewFilterEntry: function(payload) {
			this.$emit('newFilterEntry', payload);
		}
	},
	template: `
	<core-filter-cmpt
		ref="lizenzserverTable"
		filter-type="LizenzserverVerwaltung"
		:tabulator-options="lizenzserverTabulatorOptions"
		:tabulatorAdditionalColumns="tabulatorAdditionalColumns"
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