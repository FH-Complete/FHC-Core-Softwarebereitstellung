import {CoreRESTClient} from '../../../../../../js/RESTClient.js';
import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';

export const Softwarezuordnung = {
	components: {
		CoreRESTClient,
		CoreFilterCmpt
	},
	data() {
		return {
			softwareimageId: Vue.inject('softwareimageId'),
			softwareTitel: null,
			softwarezuordnung: [],
			softwarezuordnungTabulatorOptions: {
				layout: 'fitColumns',
				index: 'software_id',
				columns: [
					{title: 'Software-ID', field: 'software_id', visible: false, headerFilter: true, frozen: true},
					{title: 'Softwaretyp', field: 'softwaretyp_kurzbz', headerFilter: true},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true},
					{title: 'Status', field: 'softwarestatus_bezeichnung', headerFilter: true},
				]
			}
		}
	},
	methods: {
		getSoftwareByImage(softwareimage_id) {
			CoreRESTClient.get(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Software/getSoftwareByImage',
				{
					softwareimage_id: softwareimage_id
				})
				.then(result => result.data)
				.then(result => {
					this.softwarezuordnung = [];
					if (CoreRESTClient.hasData(result)) {
						this.softwarezuordnung = CoreRESTClient.getData(result);
					}
					this.$refs.zuordnungTable.tabulator.setData(CoreRESTClient.getData(result));
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
		}
	},
	template: `
	<div class="softwarezuordnung">
		<div class="card">
			<h3 class="h5 card-header">Softwarezuordnung<span class="fhc-subtitle">Zuordnung über Software</span></h3>
			<div class="card-body">
				<core-filter-cmpt
					ref="zuordnungTable"
					:side-menu="false"
					table-only
					:tabulator-options="softwarezuordnungTabulatorOptions">
				</core-filter-cmpt>
			</div>
		</div>
	</div>
	`
};
