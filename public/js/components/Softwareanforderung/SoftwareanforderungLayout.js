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
import CoreTabs from "../../../../../js/components/Tabs.js";

export default {
	components: {
		CoreNavigationCmpt,
		CoreBaseLayout,
		CoreTabs
	},
	provide() {
		return {
			changeTab: tab => {
				this.$refs.tabs.change(tab);
			}
		};
	},
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
				softwareanforderungNachLv: {
					title: Vue.computed(() => this.$p.t('global/anforderungNachLv')),
					component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/Softwareanforderung/SoftwareanforderungNachLv.js'
				},
				softwareanforderungNachSw: {
					title: Vue.computed(() => this.$p.t('global/anforderungNachSw')),
					component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/Softwareanforderung/SoftwareanforderungNachSw.js'
				},
				softwaresuche: {
					title: Vue.computed(() => this.$p.t('global/sucheNachRaum')),
					component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/SoftwareManagement/softwaresuche/Softwaresuche'
				}
			}
		}
	},
	template: `
	<!-- Navigation component -->
	<core-navigation-cmpt></core-navigation-cmpt>
	
	<core-base-layout :title="$p.t('global/softwarebereitstellung')" :subtitle="$p.t('global/softwarebereitstellungSubtitle')">
		<template #main>
			<core-tabs ref="tabs" :config="tabs"></core-tabs>									
		</template>
	</core-base-layout>
	`
};