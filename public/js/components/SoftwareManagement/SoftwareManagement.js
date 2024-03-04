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
import {BaseLayout} from "../Layout/BaseLayout.js";
import {NavTabs} from "./NavTabs.js";
import {Notification} from "./sidebar/Notification.js";

export const SoftwareManagement = {
	components: {
		CoreNavigationCmpt,
		BaseLayout,
		Notification,
		NavTabs
	},
	template: `
	<!-- Navigation component -->
	<core-navigation-cmpt></core-navigation-cmpt>
	
	<base-layout
		:coreNav="true" 
		title="Softwarebereitstellung"
		:mainCols="12"
		:asideCols="0">
		<template v-slot:main>
			<nav-tabs></nav-tabs>									
		</template>
	</base-layout>
	`
};