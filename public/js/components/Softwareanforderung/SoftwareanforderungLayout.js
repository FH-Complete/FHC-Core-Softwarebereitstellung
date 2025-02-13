/**
 * Copyright (C) 2023 fhcomplete.org
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import {CoreNavigationCmpt} from '../../../../../js/components/navigation/Navigation.js';
import CoreBaseLayout from "../../../../../js/components/layout/BaseLayout.js";
import CoreFormInput from "../../../../../js/components/Form/Input.js";
import CoreTabs from "../../../../../js/components/Tabs.js";

export default {
	components: {
		CoreNavigationCmpt,
		CoreBaseLayout,
		CoreFormInput,
		CoreTabs
	},
	provide() {
		return {
			selectedStudiensemester: Vue.computed(() => this.selectedStudiensemester),
			currentTab: Vue.computed(() => this.currentTab),
			changeTab: tab => {
				this.$refs.tabs.change(tab);
			},
		};
	},
	inject: ['STUDIENSEMESTER_DROPDOWN_STARTDATE'],
	data() {
		return {
			tabs: {
				softwarebereitstellungUebersicht: {
					title: Vue.computed(() => this.$p.t('global/softwarebereitstellung') + ' ' + this.$p.t('global/uebersicht')),
					component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/Softwareanforderung/Uebersicht/SoftwarebereitstellungLayout.js'
				},
				softwareanforderungNachLvTemplate: {
					title: Vue.computed(() => this.$p.t('global/anforderungNachQuellkurs')),
					component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/Softwareanforderung/SoftwareanforderungNachLvTemplate.js'
				},
				// NOTE: Keep in case of later necessity.
				// softwareanforderungNachLv: {
				// 	title: Vue.computed(() => this.$p.t('global/anforderungNachLv')),
				// 	component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/Softwareanforderung/SoftwareanforderungNachLv.js'
				// },
				softwareanforderungNachSw: {
					title: Vue.computed(() => this.$p.t('global/softwareliste')),
					component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/Softwareanforderung/SoftwareanforderungNachSw.js'
				},
				softwaresuche: {
					title: Vue.computed(() => this.$p.t('global/sucheNachRaum')),
					component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/SoftwareManagement/softwaresuche/Softwaresuche'
				}
			},
			currentTab: 'softwarebereitstellungUebersicht',
			studiensemester: [],
			selectedStudiensemester: ''
		}
	},
	created(){
		this.loadAndSetStudiensemester();
	},
	methods: {
		loadAndSetStudiensemester(){
			this.$fhcApi
				.get('api/frontend/v1/organisation/Studiensemester/getAll', {start: this.STUDIENSEMESTER_DROPDOWN_STARTDATE})
				.then( result => this.studiensemester = result.data )
				.then( () => this.$fhcApi.get('api/frontend/v1/organisation/Studiensemester/getAktNext') ) // Get actual Studiensemester
				.then( result => this.selectedStudiensemester = result.data[0].studiensemester_kurzbz ) // Preselect Studiensemester
				.catch(error => this.$fhcAlert.handleSystemError(error) );
		},
		onTabChange(tab) {
			this.currentTab = tab; // Update the active tab
		}
	},
	template: `
	<!-- Navigation component -->
	<core-navigation-cmpt></core-navigation-cmpt>
	
	<core-base-layout :title="$p.t('global/softwarebereitstellung')" :subtitle="$p.t('global/softwarebereitstellungSubtitle')">
		<template #main>
			<div class="row">
				<div class="col-10"></div>
				<div class="col-2 ms-auto">
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
			
			<core-tabs ref="tabs" :config="tabs" v-model="currentTab" @change="onTabChange"></core-tabs>	
										
		</template>
	</core-base-layout>
	`
};