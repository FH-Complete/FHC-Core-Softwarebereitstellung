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
import CoreBaseLayout from "../../../../../../js/components/layout/BaseLayout.js";
import SoftwarebereitstellungLvs from "./SoftwarebereitstellungLvs.js";
import SoftwarebereitstellungTemplates from "./SoftwarebereitstellungTemplates.js";

export default {
	components: {
		CoreBaseLayout,
		SoftwarebereitstellungLvs,
		SoftwarebereitstellungTemplates
	},
	template: `	
	<core-base-layout>
		<template #main>			
			<softwarebereitstellung-templates></softwarebereitstellung-templates>	
				
			<softwarebereitstellung-lvs></softwarebereitstellung-lvs>						
		</template>
	</core-base-layout>
	`
};