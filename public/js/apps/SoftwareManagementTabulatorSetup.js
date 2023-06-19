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
	maxHeight: "100%",
	minHeight: 50,
	layout: 'fitColumns',
	columns: [
		//~ {title: 'Datum', field: 'Datum', headerFilter: true, formatter:
			//~ function(cell){
				//~ return cell.getValue().replace(/(.*)-(.*)-(.*)\s(.*)/, '$3.$2.$1 $4');
			//~ }
		//~ },
		{title: 'ID', field: 'ID', headerFilter: true},
		{title: 'Software Kurzbezeichnung', field: 'Software Kurzbezeichnung', headerFilter: true},
		{title: 'Softwaretyp Kurzbezeichnung', field: 'Vorname', headerFilter: true},
		{title: 'Version', field: 'Version', headerFilter: true},
		{title: 'Beschreibung', field: 'Beschreibung', headerFilter: true},
		{title: 'Hersteller', field: 'Hersteller', headerFilter: true},
		{title: 'Betriebssystem', field: 'Betriebssystem', headerFilter: true},
		{title: 'Lizenzart', field: 'Lizenzart', headerFilter: true},
		{title: 'Aktiv', field: 'Aktiv', headerFilter: true},
		{title: 'Softwarestatus Kurzbezeichnung', field: 'Softwarestatus Kurzbezeichnung', headerFilter: true}
	],
	rowFormatter: function(row) {
		let data = row.getData(); // get data for this row

		console.log(data);

		// If data is not null and provides the property Aktiv and it is not null
		if (data != null && data.hasOwnProperty('Aktiv') && data.Aktiv != null)
		{
			// display human readable values
			let copiedData = JSON.parse(JSON.stringify(data));
			let aktiv = copiedData.Aktiv;
			console.log(aktiv);
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
		console.log(row.getData());
			//alert(row.getData().Inhalt);
		}
	}
];


