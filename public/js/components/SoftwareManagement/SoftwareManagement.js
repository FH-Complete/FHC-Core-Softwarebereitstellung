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
	data() {
		return {
			tabs: {
				tab1: { title: Vue.computed(() => this.$p.t('global/softwareverwaltung')), component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/SoftwareManagement/softwareverwaltung/Softwareverwaltung.js' },
				tab2: { title: Vue.computed(() => this.$p.t('global/imageverwaltung')), component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/SoftwareManagement/imageverwaltung/Imageverwaltung.js' },
				tab3: { title: Vue.computed(() => this.$p.t('global/lizenzserververwaltung')), component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/SoftwareManagement/lizenzserververwaltung/Lizenzserververwaltung.js' },
				tab4: { title: Vue.computed(() => this.$p.t('global/sucheNachRaum')), component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/SoftwareManagement/softwaresuche/Softwaresuche.js' },
				tab5: { title: Vue.computed(() => this.$p.t('global/swAnforderungenUndLizenen')), component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/Softwareanforderung/Softwareanforderung.js' }
			}
		}
	},
	template: `
	<!-- Navigation component -->
	<core-navigation-cmpt></core-navigation-cmpt>
	
	<core-base-layout :title="$p.t('global/softwareUndLizenzManagement')">
		<template #main>
			<core-tabs :config="tabs"></core-tabs>									
		</template>
	</core-base-layout>
	`
};