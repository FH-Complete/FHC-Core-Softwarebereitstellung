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

import {SoftwareManagementTabulatorOptions} from './SoftwareManagementTabulatorSetup.js';
import {SoftwareManagementTabulatorEventHandlers} from './SoftwareManagementTabulatorSetup.js';

import {CoreFilterCmpt} from '../../../../js/components/filter/Filter.js';
import {CoreNavigationCmpt} from '../../../../js/components/navigation/Navigation.js';

const softwareManagementApp = Vue.createApp({
	data: function() {
		return {
			appSideMenuEntries: {},
			softwareManagementTabulatorOptions: SoftwareManagementTabulatorOptions,
			softwareManagementTabulatorEventHandlers: SoftwareManagementTabulatorEventHandlers
		};
	},
	components: {
		CoreNavigationCmpt,
		CoreFilterCmpt
	},
	methods: {
		newSideMenuEntryHandler: function(payload) {
			this.appSideMenuEntries = payload;
		}
	}
});

softwareManagementApp.mount('#main');
