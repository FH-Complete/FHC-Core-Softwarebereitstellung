import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import CoreFormInput from "../../../../../js/components/Form/Input.js";
import {CoreRESTClient} from '../../../../../js/RESTClient.js';

export default {
	components: {
		CoreFilterCmpt,
		CoreFormInput
	},
	data: function() {
		return {
			studiensemester: [],
			selectedStudiensemester: ''
		}
	},
	created() {
		this.loadStudiensemester();
	},
	watch: {
		selectedStudiensemester(newVal){
			// Set data of selected Studiensemester
			this.$refs.softwareanforderungTable.tabulator.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSoftwareLvZuordnungen' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
			);
		}
	},
	computed: {
		tabulatorOptions() {
			return {
				ajaxURL: CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getSoftwareLvZuordnungen' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
				ajaxResponse(url, params, response){ return response.data },
				layout: 'fitColumns',
				index: 'software_lv_id',
				columns: [
					{
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						titleFormatterParams: { rowRange: "active"},
						width: 70
					},
					{title: 'SW-LV-ID', field: 'software_lv_id', headerFilter: true, visible: false},
					{title: 'SW-ID', field: 'software_id', headerFilter: true, visible: false},
					{title: 'LV-ID', field: 'lehrveranstaltung_id', headerFilter: true, visible: false},
					{title: 'Studiensemester', field: 'studiensemester_kurzbz', headerFilter: true, visible:false},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false},
					{title: 'STG Kurzbz', field: 'studiengang_kurzbz', headerFilter: true, visible:false},
					{title: this.$p.t('global/softwaretypKurzbz'), field: 'softwaretyp_kurzbz', headerFilter: true, visible: false},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true},
					{title: 'Studiengang', field: 'stg_bezeichnung', headerFilter: true},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true},
					{title: 'Semester', field: 'semester', headerFilter: true, hozAlign: 'right', width: 70},
					{title: this.$p.t('global/softwaretyp'), field: 'softwaretyp_bezeichnung', headerFilter: true},
					{title: 'Software', field: 'software_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true, hozAlign: 'right', width: 70},
					{title: 'Software-Status', field: 'softwarestatus_bezeichnung', headerFilter: true},
					{title: this.$p.t('global/lizenzAnzahl'), field: 'anzahl_lizenzen', headerFilter: true, hozAlign: 'right'},
				]
			}
		}
	},
	methods: {
		loadStudiensemester(){
			this.$fhcApi
				.get('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getAllSemester')
				.then( result => {
					this.studiensemester = result.data;
					const now = new Date();

					// Get actual Studiensemester
					const currentSemester = this.studiensemester.find(semester => {
						const startDate = new Date(semester.start);
						const endDate = new Date(semester.ende);
						return startDate <= now && endDate >= now;
					});

					// Preselect Studiensemester
					this.selectedStudiensemester = currentSemester
						? currentSemester.studiensemester_kurzbz
						: '';
				})
				.catch( this.$fhcAlert.handleSystemError );
		},
		reloadTabulator() {
			if (this.$refs.softwareanforderungTable.tabulator !== null && this.$refs.softwareanforderungTable.tabulator !== undefined)
			{
				for (let option in this.tabulatorOptions)
				{
					if (this.$refs.softwareanforderungTable.tabulator.options.hasOwnProperty(option))
						this.$refs.softwareanforderungTable.tabulator.options[option] = this.tabulatorOptions[option];
				}
				this.$refs.softwareanforderungTable.reloadTable();
			}
		}
	},
	template: `
<div class="softwareanforderung overflow-hidden">
	<div class="row d-flex">
		<div class="col-2 mb-3 ms-auto">
			<core-form-input
				type="select"
				v-model="selectedStudiensemester"
				name="studiensemester">
				<option 
				v-for="(studSem, index) in studiensemester"
				:key="index" 
				:value="studSem.studiensemester_kurzbz">
					{{studSem.studiensemester_kurzbz}}
				</option>
			</core-form-input>
		</div>
	</div>
	<div class="row mb-5">
		<div class="col">
			<core-filter-cmpt
				ref="softwareanforderungTable"
				uniqueId="softwareanforderungTable"
				table-only
				:side-menu="false"
				:tabulator-options="tabulatorOptions">
			</core-filter-cmpt>						
		</div>
	</div>
</div>
`
};
