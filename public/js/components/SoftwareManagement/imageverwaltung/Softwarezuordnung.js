import {CoreFilterCmpt} from '../../../../../../js/components/filter/Filter.js';
import ApiSoftware from "../../../api/software.js";

export const Softwarezuordnung = {
	components: {
		CoreFilterCmpt
	},
	data() {
		return {
			softwareimageId: Vue.inject('softwareimageId'),
			softwareTitel: null,
			softwareimage_bezeichnung: null,
			softwarezuordnung: [],
			softwarezuordnungTabulatorOptions: {
				layout: 'fitColumns',
				autoResize:false, // prevent auto resizing of table
				resizableColumnFit:true, //maintain the fit of columns when resizing
				index: 'software_id',
				selectable: false,
				columns: [
					{title: 'Software-ID', field: 'software_id', visible: false, headerFilter: true, frozen: true},
					{title: this.$p.t('global/softwaretyp'), field: 'softwaretyp_kurzbz', headerFilter: true},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true},
					{title: 'Status', field: 'softwarestatus_bezeichnung', headerFilter: true},
				]
			}
		}
	},
	computed: {
		softwarezuordnungTableTitle() {
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
		getSoftwareByImage(softwareimage_id, softwareimage_bezeichnung = null) {

			this.softwareimage_bezeichnung = softwareimage_bezeichnung;

			this.$api
				.call(ApiSoftware.getSoftwareByImage(softwareimage_id))
				.then(result => {
					this.softwarezuordnung = [];
					if (result.retval) {
						this.softwarezuordnung = result.retval;
					}
					this.$refs.zuordnungTable.tabulator.setData(result.retval);
				})
				.catch(error => this.$fhcAlert.handleSystemError(error));
		}
	},
	template: `
	<div class="softwarezuordnung overflow-hidden">
		<div class="card">
			<h3 class="h5 card-header">{{ $p.t('global/softwareZuordnung')}}<span class="fhc-subtitle">{{ $p.t('global/zuordnungUeberSoftware')}}</span></h3>
			<div class="card-body">
				<core-filter-cmpt
					ref="zuordnungTable"
					:title="softwarezuordnungTableTitle"
					:side-menu="false"
					table-only
					:tabulator-options="softwarezuordnungTabulatorOptions">
				</core-filter-cmpt>
			</div>
		</div>
	</div>
	`
};
