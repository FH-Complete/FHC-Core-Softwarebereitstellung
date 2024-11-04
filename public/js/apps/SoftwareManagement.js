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

import SoftwareManagement from '../components/SoftwareManagement/SoftwareManagement.js';
import SoftwarelisteLayout from '../components/Softwareliste/SoftwarelisteLayout.js';
import SoftwareanforderungLayout from '../components/Softwareanforderung/SoftwareanforderungLayout.js';
import FhcAlert from '../../../../js/plugin/FhcAlert.js';
import FhcApi from "../../../../js/plugin/FhcApi.js";
import Phrasen from "../../../../js/plugin/Phrasen.js";

const STUDIENSEMESTER_DROPDOWN_STARTDATE = '2024-09-01'; // Dropdown starts from this studiensemester up to all future ones
// Deadline pro Studienjahr, bis wann SW Zuordnungen bearbeitet oder gelöscht werden dürfen
const BEARBEITUNGSSPERRE_DATUM = {
	day: 30,
	month: 3	// 3 = April
};

const softwareManagementApp = Vue.createApp({
	components: {
		SoftwareManagement,
		SoftwarelisteLayout,
		SoftwareanforderungLayout
	},
	provide() {
		return {
			STUDIENSEMESTER_DROPDOWN_STARTDATE,
			BEARBEITUNGSSPERRE_DATUM
		};
	}
});

softwareManagementApp
	.use(primevue.config.default,{zIndex: {overlay: 9999}})
	.use(FhcAlert)
	.use(FhcApi)
	.use(Phrasen)
	.mount('#main')