<?php
	$filterCmptArray = array(
		// TODO: OWN APP!
		// TODO: bezeichnung for softwaretyp, depending on language
		'app' => 'core',
		'datasetName' => 'softwareManagement',
		'query' => '
			SELECT
				sw.software_kurzbz AS "Software Kurzbezeichnung",
				sw.softwaretyp_kurzbz AS "Softwaretyp Kurzbezeichnung",
				sw.version AS "Version",
				sw.beschreibung AS "Beschreibung",
				sw.hersteller AS "Hersteller",
				sw.os AS "Betriebssystem",
				sw.lizenzart AS "Lizenzart",
				sw.anzahl_lizenzen AS "Anzahl Lizenzen",
				sw.aktiv AS "Aktiv",
				sw_status.softwarestatus_kurzbz AS "Softwarestatus Kurzbezeichnung",
				sw.software_id AS "ID"
			FROM
				extension.tbl_software sw
				JOIN extension.tbl_softwaretyp sw_typ USING (softwaretyp_kurzbz)
				LEFT JOIN extension.tbl_software_softwarestatus sw_swstatus USING (software_id)
				LEFT JOIN extension.tbl_softwarestatus sw_status USING (softwarestatus_kurzbz)
			ORDER BY
				software_id DESC
		',
		'requiredPermissions' => 'admin'
	);
