<?php
	$filterCmptArray = array(
		// TODO: OWN APP!
		// TODO: bezeichnung for softwaretyp, depending on language
		'app' => 'core',
		'datasetName' => 'softwareManagement',
		'query' => '
			SELECT
				sw.software_id AS "ID",
				sw.software_kurzbz AS "Software Kurzbezeichnung",
				sw.softwaretyp_kurzbz AS "Softwaretyp Kurzbezeichnung", 
				sw.version AS "Version", 
				sw.beschreibung AS "Beschreibung", 
				sw.hersteller AS "Hersteller", 
				sw.os AS "Betriebssystem", 
				sw.lizenzart AS "Lizenzart", 
				sw.anzahl_lizenzen AS "Anzahl Lizenzen", 
				sw.aktiv AS "aktiv",
				sw_status.softwarestatus_kurzbz AS "Softwarestatus Kurzbezeichnung"
			FROM
				extension.tbl_software sw
				JOIN extension.tbl_softwaretyp sw_typ USING (softwaretyp_kurzbz)
				JOIN extension.tbl_software_softwarestatus sw_swstatus USING (software_id)
				JOIN extension.tbl_softwarestatus sw_status USING (softwarestatus_kurzbz)
			ORDER BY
				software_id DESC
		',
		'requiredPermissions' => 'admin'
	);
