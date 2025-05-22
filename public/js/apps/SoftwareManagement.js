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
import FhcAlert from '../../../../js/plugins/FhcAlert.js';
import FhcApi from "../../../../js/plugins/Api.js";
import Phrasen from "../../../../js/plugins/Phrasen.js";

const STUDIENSEMESTER_DROPDOWN_STARTDATE = '2024-09-01'; // Dropdown starts from this studiensemester up to all future ones
const STUDIENJAHR_DROPDOWN_STARTDATE = '2025/26'; // Dropdown starts from this studiensemester up to all future ones

const softwareManagementApp = Vue.createApp({
	components: {
		SoftwareManagement,
		SoftwarelisteLayout,
		SoftwareanforderungLayout
	},
	provide() {
		return {
			STUDIENSEMESTER_DROPDOWN_STARTDATE,
			STUDIENJAHR_DROPDOWN_STARTDATE
		};
	}
});

softwareManagementApp
	.use(primevue.config.default,{zIndex: {overlay: 9999}})
	.use(FhcAlert)
	.use(FhcApi)
	.use(Phrasen)
	.mount('#main')