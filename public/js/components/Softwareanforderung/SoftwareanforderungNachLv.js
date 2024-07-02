import {CoreFilterCmpt} from '../../../../../js/components/filter/Filter.js';
import CoreFormInput from "../../../../../js/components/Form/Input.js";
import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import SoftwareanforderungForm from "../Form/Softwareanforderung.js";

export default {
	components: {
		CoreFilterCmpt,
		CoreFormInput,
		SoftwareanforderungForm
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
			this.$refs.softwareanforderungNachLvTable.tabulator.setData(
				CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getLehrveranstaltungen' +
					'?studiensemester_kurzbz=' + newVal
				),
			);
		}
	},
	computed: {
		tabulatorOptions() {
			return {
				ajaxURL: CoreRESTClient._generateRouterURI(
					'extensions/FHC-Core-Softwarebereitstellung/fhcapi/Softwareanforderung/getLehrveranstaltungen' +
					'?studiensemester_kurzbz=' + this.selectedStudiensemester
				),
				ajaxResponse(url, params, response){ return response.data },
				layout: 'fitColumns',
				index: 'lehrveranstaltung_id',
				columns: [
					{
						formatter: 'rowSelection',
						titleFormatter: 'rowSelection',
						titleFormatterParams: { rowRange: "active"},
						width: 70
					},
					{title: 'LV-ID', field: 'lehrveranstaltung_id', headerFilter: true, visible: false},
					{title: 'Lehrveranstaltung', field: 'lv_bezeichnung', headerFilter: true},
					{title: 'STG Kurzbz', field: 'studiengang_kurzbz', headerFilter: true, visible:false},
					{title: 'Studiengang', field: 'stg_bezeichnung', headerFilter: true},
					{title: 'Semester', field: 'semester', headerFilter: true, width: 150},
					{title: 'OE Kurzbz', field: 'lv_oe_kurzbz', headerFilter: true, visible:false},
					{title: 'OE', field: 'lv_oe_bezeichnung', headerFilter: true}
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
		openSoftwareanforderungForm(){
			let selectedData = this.$refs.softwareanforderungNachLvTable.tabulator.getSelectedData();

			if (selectedData.length == 0)
			{
				this.$fhcAlert.alertWarning( this.$p.t('global/zeilenAuswaehlen'));
				return;
			}

			this.$refs.softwareanforderungForm.openModalLvToSw(selectedData, this.selectedStudiensemester);
		},
		reloadTabulator() {
			if (this.$refs.softwareanforderungNachLvTable.tabulator !== null && this.$refs.softwareanforderungNachLvTable.tabulator !== undefined)
			{
				for (let option in this.tabulatorOptions)
				{
					if (this.$refs.softwareanforderungNachLvTable.tabulator.options.hasOwnProperty(option))
						this.$refs.softwareanforderungNachLvTable.tabulator.options[option] = this.tabulatorOptions[option];
				}
				this.$refs.softwareanforderungNachLvTable.reloadTable();
			}
		},
		onFormClosed(){
			// Deselect all rows
			this.$refs.softwareanforderungNachLvTable.tabulator.deselectRow();
		}
	},
	template: `
<div class="softwareanforderungNachLv overflow-hidden">
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
				ref="softwareanforderungNachLvTable"
				uniqueId="softwareanforderungNachLvTable"
				table-only
				:side-menu="false"
				:tabulator-options="tabulatorOptions">
				<template v-slot:actions>
					<button class="btn btn-primary" @click="openSoftwareanforderungForm()">{{ $p.t('global/swFuerLvAnfordern') }}</button>
				</template>
			</core-filter-cmpt>						
		</div>
	</div>
	
	<!-- Form -->
	<softwareanforderung-form ref="softwareanforderungForm" @form-closed="onFormClosed"></softwareanforderung-form>

</div>
`
};
