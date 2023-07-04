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

export const SoftwareManagementTabulatorOptions = {
	getOptions: function (expandHierarchy) {
		return {
				maxHeight: "100%",
				minHeight: 50,
				layout: 'fitColumns',
				dataTree: true,
				dataTreeFilter: true,
				dataTreeStartExpanded: expandHierarchy,
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
					{title: 'Software Kurzbezeichnung', field: 'software_kurzbz', headerFilter: true},
					{title: 'Softwaretyp Kurzbezeichnung', field: 'softwaretyp_kurzbz', headerFilter: true},
					{title: 'Version', field: 'version', headerFilter: true},
					{title: 'Beschreibung', field: 'beschreibung', headerFilter: true},
					{title: 'Hersteller', field: 'hersteller', headerFilter: true},
					{title: 'Betriebssystem', field: 'os', headerFilter: true},
					{title: 'Lizenzart', field: 'lizenzart', headerFilter: true},
					{title: 'Anzahl Lizenzen', field: 'anzahl_lizenzen', headerFilter: true},
					{title: 'Aktiv', field: 'aktiv', headerFilter: true},
					{title: 'Softwarestatus Kurzbezeichnung', field: 'softwarestatus_kurzbz', headerFilter: true},
					{title: 'ID', field: 'software_id', headerFilter: true},
					{title: 'Übergeordnete Software ID', field: 'software_id_parent', headerFilter: true}
				],
				rowFormatter: function(row) {
					let data = row.getData(); // get data for this row

					//~ if (!row.isTreeExpanded() && expandHierarchy)
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
	//~ {
		//~ // show issue text on row click
		//~ event: "rowClick",
		//~ handler: function(e, row) {
			//~ alert(row.getData().Beschreibung);
		//~ }
	//~ },
	{
		event: "dataLoaded",
		handler: function(data) {

			if (data.length)
			{
				let toDelete = [];

				// loop through all software
				for (let childIdx = 0; childIdx < data.length; childIdx++)
				{
					let childSw = data[childIdx];

					// if it has parent ID, it is a child
					if (childSw['software_id_parent'])
					{
						// append the child on the right place. if sw parent found, mark original sw child on 0 level for deleting
						if (_appendChild(data, childSw)) toDelete.push(childIdx);
					}
				}

				// delete the marked children from 0 level
				for (let counter = 0; counter < toDelete.length; counter++)
				{
					//decrease index by counter as index of data array changes after every deletion
					data.splice(toDelete[counter] - counter, 1);
				}
			}
		}
	}
];

// append childSw to it's parent
function _appendChild(swArr, childSw) {
	// get parent id
	let parentId = childSw['software_id_parent'];

	// loop thorugh all software
	for (let parentIdx = 0; parentIdx < swArr.length; parentIdx++)
	{
		let parentSw = swArr[parentIdx];

		// if it's the parent
		if (parentSw['software_id'] == parentId)
		{
			// create children array if not done yet
			if (!parentSw._children) parentSw._children = [];

			// append the child
			parentSw._children.push(childSw);

			// parent found
			return true;
		}
		// search children for parents
		else if (parentSw._children) _appendChild(parentSw._children, childSw);
	}

	// parent not found
	return false;
}
