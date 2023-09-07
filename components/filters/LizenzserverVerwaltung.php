<?php
	$filterCmptArray = array(
		'app' => 'core',
		'datasetName' => 'lizenzserverVerwaltung',
		'query' => '
			SELECT
				lizenzserver_kurzbz,
			   	bezeichnung,
			   	macadresse,
			   	ipadresse
				ansprechpartner,
			   	anmerkung,
			   	location
			FROM
				extension.tbl_softwarelizenzserver
			ORDER BY
				 lizenzserver_kurzbz
		',
		'requiredPermissions' => 'admin'
	);
