import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';

export const DetailsCmpt = {
	components: {
		CoreRESTClient,
		CoreFilterCmpt
	},
	data() {
		return {
			show: false,
			softwareId: null,
			softwareTitel: null,
			orte: [],
			orteTabulatorOptions: {
				height: "100%",
				layout: 'fitColumns',
				columns: [
					{title: 'Raum', field: 'ort_kurzbz', headerFilter: true},
					{title: 'Raum Bezeichnung', field: 'ort_bezeichnung', headerFilter: true, visible: false},
					{title: 'Image', field: 'image', headerFilter: true},
					{title: 'Raum Verfügbarkeit Start', field: 'ort_verfuegbarkeit_start', headerFilter: true},
					{title: 'Raum Verfügbarkeit Ende', field: 'ort_verfuegbarkeit_ende', headerFilter: true},
					{title: 'Image Verfügbarkeit Start', field: 'image_verfuegbarkeit_start', headerFilter: true, visible: false},
					{title: 'Image Verfügbarkeit Ende', field: 'image_verfuegbarkeit_ende', headerFilter: true, visible: false}
				]
			}
		}
	},
	methods: {
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
		}
	},
	template: `
		<div class="card" v-show="show">
			<div class="card-header">
				Zugeordnete Räume {{softwareTitel}}
			</div>
			<div class="card-body">
				<core-filter-cmpt
					ref="raumTable"
					:side-menu="false"
					:table-only=true
					:tabulator-options="orteTabulatorOptions">
				</core-filter-cmpt>
			</div>
		</div>
	`
};
