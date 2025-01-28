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
import CoreFormInput from "../../../../../../js/components/Form/Input.js";
import SoftwarebereitstellungLvs from "./SoftwarebereitstellungLvs.js";
import SoftwarebereitstellungTemplates from "./SoftwarebereitstellungTemplates.js";

export default {
	components: {
		CoreBaseLayout,
		CoreFormInput,
		SoftwarebereitstellungLvs,
		SoftwarebereitstellungTemplates
	},
	inject: ['STUDIENSEMESTER_DROPDOWN_STARTDATE'],
	data() {
		return{
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
		}
	},
	template: `	
	<core-base-layout>
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
			
			<softwarebereitstellung-templates 
				:selected-studiensemester="selectedStudiensemester" 
				@loaded="onChildLoaded">
			</softwarebereitstellung-templates>	
				
			<softwarebereitstellung-lvs 	
				:selected-studiensemester="selectedStudiensemester" 
				@loaded="onChildLoaded">
			</softwarebereitstellung-lvs>						
		</template>
	</core-base-layout>
	`
};