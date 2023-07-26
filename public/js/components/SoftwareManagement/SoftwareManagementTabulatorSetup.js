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

// default tabulator options
export const SoftwareManagementTabulatorOptions = {
	maxHeight: "100%",
	minHeight: 50,
	layout: 'fitColumns',
	index: 'software_id',
	dataTree: true,
	dataTreeFilter: true, // TODO ist eigentlich default
	dataTreeSort: true,	  // TODO ist eigentlich default
	dataTreeSelectPropagate: true, //propagate selection events from parent rows to children
   //~ data:  [
	  //~ {ID: 7, 'Software Kurzbezeichnung': 'PhysiklabMod', 'Softwaretyp Kurzbezeichnung': 'modul', Version: '2', Beschreibung: 'Physiklab Modul', 'Softwarestatus Kurzbezeichnung': 'neu'},
	  //~ {ID: 4, 'Software Kurzbezeichnung': 'MatlabMod', 'Softwaretyp Kurzbezeichnung': 'modul', Version: '1', Beschreibung: 'Matlab Modul', 'Softwarestatus Kurzbezeichnung': 'budgetiert', _children:[
		 //~ {ID: 2, 'Software Kurzbezeichnung': 'Matlab I', 'Softwaretyp Kurzbezeichnung': 'software', Version: '1', Beschreibung: 'child', 'Softwarestatus Kurzbezeichnung': 'neu', _children:[
			   //~ {'ID': 6, 'Software Kurzbezeichnung': 'Matlab I - child', 'Softwaretyp Kurzbezeichnung': 'software', Version: '1', Beschreibung: 'child, grandchild', 'Softwarestatus Kurzbezeichnung': 'neu'}
			//~ ]},
		 //~ {ID: 5, 'Software Kurzbezeichnung': 'Matlab ||', 'Softwaretyp Kurzbezeichnung': 'software', Version: '1', Beschreibung: 'child', 'Softwarestatus Kurzbezeichnung': 'neu'},
	  //~ ]},
   //~ ],
	rowFormatter: function(row) {
		let data = row.getData(); // get data for this row
	}
};

/**
 *
 */
export const SoftwareManagementTabulatorEventHandlers = [
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
					// decrease index by counter as index of data array changes after every deletion
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

	// loop through all software
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
