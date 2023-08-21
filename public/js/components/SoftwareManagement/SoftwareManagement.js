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
import {BaseLayout} from "../Layout/BaseLayout";
import {NavTabs} from "./NavTabs";
import {Raumzuordnung} from "./Raumzuordnung";
import {Notification} from "./sidebar/Notification";

export const SoftwareManagement = {
	components: {
		CoreNavigationCmpt,
		BaseLayout,
		Notification,
		NavTabs,
		DetailsCmpt: Raumzuordnung
	},
	data: function() {
		return {
			headerMenuEntries: {},
			sideMenuEntries: {},
			appTitle: "Softwarebereitstellung",
			appSubtitle: "",
			mainCols: [10],
			asideCols: [2],
		}
	},
	methods: {
		updateFilterMenuEntries(payload){
			this.sideMenuEntries = payload;
		}
	},
	template: `
	<!-- Navigation component -->
	<core-navigation-cmpt 
		v-bind:add-side-menu-entries="sideMenuEntries"
		v-bind:add-header-menu-entries="headerMenuEntries">	
	</core-navigation-cmpt>
	
	<base-layout
		:coreNav="true" 
		:title="appTitle"
		:subtitle="appSubtitle"
		:mainCols="mainCols"
		:asideCols="asideCols">
		<template v-slot:main>
			<nav-tabs @filter-menu-updated="updateFilterMenuEntries"></nav-tabs>									
		</template>
      	<template v-slot:aside>
      		<notification></notification>	
		</template>
	</base-layout>
	`
};