<?php
	$filterCmptArray = array(
		'app' => 'core',
		'datasetName' => 'imageVerwaltung',
		'query' => '
			SELECT
				si.softwareimage_id, 
				si.bezeichnung, 
				si.betriebssystem, 
				si.verfuegbarkeit_start, 
				si.verfuegbarkeit_ende, 
				si.anmerkung, 
				sio.ort_count,
				sis.software_count
			FROM
				extension.tbl_softwareimage si
			LEFT JOIN (
				SELECT
					softwareimage_id,
					COUNT(ort_kurzbz) AS ort_count
				FROM
					extension.tbl_softwareimage_ort
				GROUP BY
					softwareimage_id
			) sio USING (softwareimage_id)
			LEFT JOIN (
				SELECT
					softwareimage_id,
					COUNT(software_id) AS software_count
				FROM
					extension.tbl_softwareimage_software
				GROUP BY
					softwareimage_id
			) sis USING (softwareimage_id)
			ORDER BY
				 bezeichnung
		',
		'requiredPermissions' => 'extension/software_verwalten'
	);
