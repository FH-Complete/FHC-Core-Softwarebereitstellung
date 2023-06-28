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
import {OptionsBarCmpt} from '../components/OptionsBarCmpt.js';

const softwareManagementApp = Vue.createApp({
	components: {
		CoreNavigationCmpt,
		CoreFilterCmpt,
		OptionsBarCmpt
	},
	//~ props: {
		//~ includeHierarchy: {
			//~ type: Boolean,
			//~ default: true
		//~ }
	//~ },
	data: function() {
		return {
			includeHierarchy: true,
			appSideMenuEntries: {},
			softwareManagementTabulatorOptions: null,
			softwareManagementTabulatorEventHandlers: null
		};
	},
	created() {
		console.log("IN MOUNTED");
		//~ console.log(this.getTabulatorOptions);
		this.softwareManagementTabulatorOptions = SoftwareManagementTabulatorOptions.getOptions();
		this.softwareManagementTabulatorEventHandlers = SoftwareManagementTabulatorEventHandlers;
		//this.includeHierarchy = 
	},
	computed: {
		//~ softwareManagementTabulatorOptions: function() {
			
		//~ }
	},
	methods: {
		newSideMenuEntryHandler: function(payload) {
			this.appSideMenuEntries = payload;
		},
		getTabulatorOptions: function(includeHierarchy) {
			return {
				maxHeight: "100%",
				minHeight: 50,
				layout: 'fitColumns',
				dataTree: true,
				dataTreeFilter: true,
				//dataTreeStartExpanded: false,
			   //~ data:  [
				  //~ {ID: 7, 'Software Kurzbezeichnung': 'PhysiklabMod', 'Softwaretyp Kurzbezeichnung': 'modul', Version: '2', Beschreibung: 'Physiklab Modul', 'Softwarestatus Kurzbezeichnung': 'neu'},
				  //~ {ID: 4, 'Software Kurzbezeichnung': 'MatlabMod', 'Softwaretyp Kurzbezeichnung': 'modul', Version: '1', Beschreibung: 'Matlab Modul', 'Softwarestatus Kurzbezeichnung': 'budgetiert', _children:[
					 //~ {ID: 2, 'Software Kurzbezeichnung': 'Matlab I', 'Softwaretyp Kurzbezeichnung': 'software', Version: '1', Beschreibung: 'child', 'Softwarestatus Kurzbezeichnung': 'neu', _children:[
						   //~ {'ID': 6, 'Software Kurzbezeichnung': 'Matlab I - child', 'Softwaretyp Kurzbezeichnung': 'software', Version: '1', Beschreibung: 'child, grandchild', 'Softwarestatus Kurzbezeichnung': 'neu'}
						//~ ]},
					 //~ {ID: 5, 'Software Kurzbezeichnung': 'Matlab ||', 'Softwaretyp Kurzbezeichnung': 'software', Version: '1', Beschreibung: 'child', 'Softwarestatus Kurzbezeichnung': 'neu'},
				  //~ ]},
			   //~ ],
				columns: [
					{title: 'ID', field: 'ID', headerFilter: true},
					{title: 'Software Kurzbezeichnung', field: 'Software Kurzbezeichnung', headerFilter: true},
					{title: 'Softwaretyp Kurzbezeichnung', field: 'Softwaretyp Kurzbezeichnung', headerFilter: true},
					{title: 'Version', field: 'Version', headerFilter: true},
					{title: 'Beschreibung', field: 'Beschreibung', headerFilter: true},
					{title: 'Hersteller', field: 'Hersteller', headerFilter: true},
					{title: 'Betriebssystem', field: 'Betriebssystem', headerFilter: true},
					{title: 'Lizenzart', field: 'Lizenzart', headerFilter: true},
					{title: 'Anzahl Lizenzen', field: 'Anzahl Lizenzen', headerFilter: true},
					{title: 'Aktiv', field: 'Aktiv', headerFilter: true},
					{title: 'Softwarestatus Kurzbezeichnung', field: 'Softwarestatus Kurzbezeichnung', headerFilter: true}
				],
				rowFormatter: function(row) {
					let data = row.getData(); // get data for this row

					//console.log(this.includeHierarchy);
					//console.log(data);
					//console.log(row.getTreeChildren().length);
					//console.log(this);
					console.log(includeHierarchy);

					if (includeHierarchy == true && row.getTreeChildren().length)
						row.treeExpand();

					if (data.ID == 7)
					{
						//row.getNextRow().delete();
						//var children = row.getTreeChildren();
						//row.addTreeChild({ID: 2, 'Software Kurzbezeichnung': 'Test', 'Softwaretyp Kurzbezeichnung': 'software', Version: '1', Beschreibung: 'child', 'Softwarestatus Kurzbezeichnung': 'neu'});
					}

					

					

					// If data is not null and provides the property Aktiv and it is not null
					//~ if (data != null && data.hasOwnProperty('Aktiv') && data.Aktiv != null)
					//~ {
						//~ // display human readable values
						//~ let copiedData = JSON.parse(JSON.stringify(data));
						//~ let aktiv = copiedData.Aktiv;
						//~ //console.log(aktiv);
					//~ }
				}
			}
		}
	}
});

softwareManagementApp.mount('#main');
