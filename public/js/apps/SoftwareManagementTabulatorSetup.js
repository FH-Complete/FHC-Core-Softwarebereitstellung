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

/**
 *				sw.software_id AS "ID",
				sw.software_kurzbz AS "Software Kurzbezeichnung",
				sw.softwaretyp_kurzbz AS "Softwaretyp Kurzbezeichnung",
				sw.version AS "Version",
				sw.beschreibung AS "Beschreibung",
				sw.hersteller AS "Hersteller",
				sw.os AS "Betriebssystem",
				sw.lizenzart AS "Lizenzart",
				sw.anzahl_lizenzen AS "Anzahl Lizenzen",
				sw.aktiv AS "Aktiv",
				sw_status.softwarestatus_kurzbz AS "Softwarestatus Kurzbezeichnung"
 */


 
export const SoftwareManagementTabulatorOptions = {
	getOptions: function () {
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
					//console.log(this.includeHierarchy);
					//this.includeHierarchy = true

					//~ if (row.getTreeChildren().length)
						//~ row.treeExpand();

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

};

/**
 *
 */
export const SoftwareManagementTabulatorEventHandlers = [
	{
		// show issue text on row click
		event: "rowClick",
		handler: function(e, row) {
		//console.log(row.getData());
			//alert(row.getData().Inhalt);
		},
		// show issue text on row click
		event: "dataLoaded",
		handler: function(data) {
			//console.log(data);

			if (data.length)
			{
				//~ data[0]._children = [
				 //~ {ID: 2, 'Software Kurzbezeichnung': 'Test', 'Softwaretyp Kurzbezeichnung': 'software', Version: '1', Beschreibung: 'child', 'Softwarestatus Kurzbezeichnung': 'neu'},
				 //~ {ID: 5, 'Software Kurzbezeichnung': 'MIEP', 'Softwaretyp Kurzbezeichnung': 'software', Version: '1', Beschreibung: 'child', 'Softwarestatus Kurzbezeichnung': 'neu'},
			  //~ ];
				//~ data[0]._children = [
				 //~ data[3],
				 //~ data[4]
			  //~ ];

			  //~ data.splice(3, 2);
			}
		//data[0].Version = 3;
		
		},
	}
];


