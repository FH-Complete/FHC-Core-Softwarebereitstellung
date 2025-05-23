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

import CoreBaseLayout from "../../../../../js/components/layout/BaseLayout.js";
import CoreTabs from "../../../../../js/components/Tabs.js";

export default {
	components: {
		CoreBaseLayout,
		CoreTabs
	},
	props: {
		ortKurzbz: {
			type: String,
			required: false
		}
	},
	data() {
		return {
			tabs: {
				softwareliste: {
					title: Vue.computed(() => this.$p.t('global/softwareliste')),
					component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/Softwareliste/Softwareliste.js'
				},
				softwaresuche: {
					title: Vue.computed(() => this.$p.t('global/sucheNachRaum')),
					component: '../../extensions/FHC-Core-Softwarebereitstellung/js/components/SoftwareManagement/softwaresuche/Softwaresuche.js'
				}
			}
		}
	},
	computed:{
		defaultTab() { return this.ortKurzbz ? 'softwaresuche' : 'softwareliste'},
	},
	template: `
	<core-base-layout :title="$p.t('global/softwareliste')">
		<template #main>
			<core-tabs :config="tabs" :default="defaultTab" :modelValue="{ortKurzbz: ortKurzbz}"></core-tabs>									
		</template>
	</core-base-layout>
	`
};