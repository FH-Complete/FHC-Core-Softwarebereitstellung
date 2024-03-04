<?php
	$filterCmptArray = array(
		// TODO: OWN APP!
		// TODO: bezeichnung for softwaretyp, depending on language
		'app' => 'core',
		'datasetName' => 'softwareManagement',
		'query' => '
			SELECT * FROM (
				SELECT
					DISTINCT ON (sw.software_id)
					sw.software_kurzbz,
					sw.softwaretyp_kurzbz,
					sw.version,
					sw.beschreibung,
					sw.hersteller,
					sw.os,
					sw.verantwortliche,
					sw.lizenzart,
					sw.lizenzserver_kurzbz,
					sw.anzahl_lizenzen,
					sw.lizenzlaufzeit,
					sw.lizenzkosten,
					sw_status.softwarestatus_kurzbz,
					sw.anmerkung_intern,
					sw.software_id,
					sw.software_id_parent,
					sw_parent.software_kurzbz AS software_kurzbz_parent,
					sw_typ.bezeichnung AS softwaretyp_bezeichnung,
					sw_status.bezeichnung AS softwarestatus_bezeichnung,
					sw.insertamum::date,
					(
						SELECT
							CONCAT(person.vorname, \' \', person.nachname)
						FROM
							tbl_person AS person
							JOIN tbl_benutzer AS benutzer USING (person_id)
						WHERE
							benutzer.uid = sw.insertvon
					) AS insertvon,
					sw.updateamum::date,
					(
						SELECT
							CONCAT(person.vorname, \' \', person.nachname)
						FROM
							tbl_person AS person
							JOIN tbl_benutzer AS benutzer USING (person_id)
						WHERE
							benutzer.uid = sw.updatevon
					) AS updatevon
				FROM
					extension.tbl_software sw
					JOIN extension.tbl_softwaretyp sw_typ USING (softwaretyp_kurzbz)
					LEFT JOIN extension.tbl_software_softwarestatus sw_swstatus USING (software_id)
					LEFT JOIN extension.tbl_softwarestatus sw_status USING (softwarestatus_kurzbz)
					LEFT JOIN extension.tbl_software sw_parent ON sw.software_id_parent = sw_parent.software_id
				ORDER BY
					sw.software_id DESC, sw_swstatus.datum DESC, sw_swstatus.software_status_id DESC
			) software
			ORDER BY software_kurzbz, version DESC NULLS LAST, software_id DESC
		',
		'requiredPermissions' => 'admin'
	);
