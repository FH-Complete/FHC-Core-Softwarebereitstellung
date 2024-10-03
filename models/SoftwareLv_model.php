<?php
class SoftwareLv_model extends DB_Model
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_software_lv';
		$this->pk = 'software_lv_id';
	}

	/**
	 * Get all Software-Lehrveranstaltungs-Zuordnungen with Lizenzanzahl.
	 * Includes information about Lehrveranstaltungen with its Stg, OE and OE-type.
	 * Filter by Studiensemester and Organisationseinheiten if necessary.
	 * @param $studiensemester_kurzbz	Filter by Studiensemester
	 * @param $oes	Filter by Organisationseinheiten
	 * @return mixed
	 */
	public function getSwLvZuordnungen($studiensemester_kurzbz = null, $oes = null)
	{
		$qry = '
			SELECT 
				swlv.software_lv_id,
			    swlv.software_id,
				swlv.lehrveranstaltung_id,
				swlv.studiensemester_kurzbz,
			    swlv.lizenzanzahl AS "anzahl_lizenzen",
				swlv.insertvon,
				swlv.insertamum::date,
				swlv.updatevon,
				swlv.updateamum::date,  
                lv.orgform_kurzbz,
				lv.semester,   
                lv.bezeichnung AS "lv_bezeichnung",   
				lv.oe_kurzbz AS "lv_oe_kurzbz",
			    lv.lehrveranstaltung_template_id,
                CASE
                    WHEN oe.organisationseinheittyp_kurzbz = \'Kompetenzfeld\' THEN (\'KF \' || oe.bezeichnung)
                    WHEN oe.organisationseinheittyp_kurzbz = \'Department\' THEN (\'DEP \' || oe.bezeichnung)
                    ELSE (oe.organisationseinheittyp_kurzbz || \' \' || oe.bezeichnung)
                END AS "lv_oe_bezeichnung",
				(
				    -- comma seperated string of all lehreinheitgruppen
					SELECT string_agg(bezeichnung, \', \') AS lehreinheitgruppe_bezeichnung
					FROM(
					    -- distinct bezeichnung, as may come multiple times from different lehreinheiten
						SELECT DISTINCT ON (studiengang_kz, bezeichnung) studiengang_kz, bezeichnung FROM
						(
							-- distinct lehreinheitgruppe, as may come multiple times from different lehrform
							SELECT DISTINCT ON (legr.lehreinheitgruppe_id) legr.studiengang_kz,
								-- get Spezialgruppe or Lehrverbandgruppe 
								COALESCE(
									legr.gruppe_kurzbz,
									CONCAT( UPPER(substg.typ), UPPER(substg.kurzbz), \'-\', legr.semester, legr.verband, legr.gruppe )
								) as bezeichnung
							FROM lehre.tbl_lehreinheitgruppe 	legr
							JOIN lehre.tbl_lehreinheit 			le USING (lehreinheit_id)
							JOIN lehre.tbl_lehrveranstaltung 	sublv USING (lehrveranstaltung_id)
							JOIN public.tbl_studiengang 		substg ON substg.studiengang_kz = legr.studiengang_kz
							WHERE sublv.lehrveranstaltung_id 	= swlv.lehrveranstaltung_id
							AND le.studiensemester_kurzbz 		= swlv.studiensemester_kurzbz
						) AS lehreinheitgruppen
					    GROUP BY studiengang_kz, bezeichnung
						ORDER BY studiengang_kz DESC
					) AS uniqueLehreinheitgruppen_bezeichnung
				) AS lehreinheitgruppen_bezeichnung,
                stg.studiengang_kz,
                upper(stg.typ || stg.kurzbz) AS "stg_typ_kurzbz",    
                stg.bezeichnung AS "stg_bezeichnung", 
                stgtyp.bezeichnung AS "stg_typ_bezeichnung",
				sw.softwaretyp_kurzbz,
				sw.software_kurzbz,
				sw.version,
				sw_typ.bezeichnung[(' . $this->_getLanguageIndex() . ')] AS softwaretyp_bezeichnung,
				(SELECT bezeichnung[(' . $this->_getLanguageIndex() . ')] 
					FROM extension.tbl_software_softwarestatus
					JOIN extension.tbl_softwarestatus USING (softwarestatus_kurzbz)
					WHERE software_id = swlv.software_id
					ORDER BY software_status_id DESC
					LIMIT 1
				) AS softwarestatus_bezeichnung
            FROM
				extension.tbl_software_lv swlv
				JOIN lehre.tbl_lehrveranstaltung 		lv USING(lehrveranstaltung_id)
				JOIN extension.tbl_software 			sw USING (software_id)
				JOIN extension.tbl_softwaretyp 			sw_typ USING (softwaretyp_kurzbz)
				JOIN public.tbl_organisationseinheit 	oe USING (oe_kurzbz)
				JOIN public.tbl_studiengang          	stg ON stg.studiengang_kz = lv.studiengang_kz
				JOIN public.tbl_studiengangstyp 		stgtyp ON stgtyp.typ = stg.typ
            WHERE 1 = 1 
            ';

		$params = [];

		if (isset($studiensemester_kurzbz) && is_string($studiensemester_kurzbz))
		{
			/* filter studiensemester */
			$qry.= ' AND swlv.studiensemester_kurzbz =  ? ';
			$params[]= $studiensemester_kurzbz;
		}

		if (isset($oes) && is_array($oes))
		{
			/* filter organisationseinheit */
			$qry.= ' AND stg.oe_kurzbz IN ? ';
			$params[]= $oes;
		}

		return $this->execQuery($qry, $params);
	}

	/**
	 * Save multiple Software-Lehrveranstaltungs-Zuordnungen
	 * @param $batch
	 * @return mixed
	 */
	public function insertBatch($batch)
	{
		// Get the user UID
		$uid = getAuthUid();

		// Add 'insertvon' to each entry in the batch
		foreach ($batch as &$item) {
			$item['insertvon'] = $uid;
		}

		// Check class properties
		if (is_null($this->dbTable)) return error('The given database table name is not valid', EXIT_MODEL);

		// Insert data
		$insert = $this->db->insert_batch($this->dbTable, $batch);

		if ($insert)
		{
			return success();
		} else
		{
			return error($this->db->error(), EXIT_DATABASE);
		}
	}

	/**
	 * Updates multiple Software-Lehrveranstaltungs-Zuordnungen
	 *
	 * @param array $batch The batch of data to be updated.
	 * @return array An array containing success or error message.
	 */

	public function updateBatch($batch)
	{
		// Check class properties
		if (is_null($this->dbTable)) return error('The given database table name is not valid', EXIT_MODEL);

		// Get the user UID
		$uid = getAuthUid();

		// Add 'updatevon' to each entry in the batch
		foreach ($batch as &$item) {
			$item['updatevon'] = $uid;
			$item['updateamum'] = date('Y-m-d H:i:s');
		}

		// Update data
		$updatedRows = $this->db->update_batch($this->dbTable, $batch, 'software_lv_id');

		if ($updatedRows)
		{
			return success($updatedRows);
		}
		else
		{
			return error($this->db->error(), EXIT_DATABASE);
		}
	}

	public function getSwLizenzenSumAndPercentageShareByOeAndStudienjahr($software_id, $studiensemester_kurzbz_arr)
	{
		$qry = '
			-- Query data and sum lizenzanzahl by oe
			WITH groupedLizenzen AS (
				SELECT 
					lv.oe_kurzbz,
					swlv.studiensemester_kurzbz,
					CASE
						WHEN oe.organisationseinheittyp_kurzbz = \'Kompetenzfeld\' THEN (\'KF \' || oe.bezeichnung)
						WHEN oe.organisationseinheittyp_kurzbz = \'Department\' THEN (\'DEP \' || oe.bezeichnung)
						ELSE (oe.organisationseinheittyp_kurzbz || \' \' || oe.bezeichnung)
					END AS "lv_oe_bezeichnung",
					SUM(swlv.lizenzanzahl) AS sum_lizenzen
				FROM
					extension.tbl_software_lv               swlv
					JOIN lehre.tbl_lehrveranstaltung 	lv USING(lehrveranstaltung_id)
					JOIN extension.tbl_software 		sw USING (software_id)
					JOIN extension.tbl_softwaretyp 		sw_typ USING (softwaretyp_kurzbz)
					JOIN public.tbl_organisationseinheit 	oe USING (oe_kurzbz)
					JOIN public.tbl_studiengang          	stg ON stg.studiengang_kz = lv.studiengang_kz
				WHERE 
					swlv.software_id = ?
					AND swlv.studiensemester_kurzbz IN ?
				GROUP BY 
					lv.oe_kurzbz, swlv.studiensemester_kurzbz, oe.organisationseinheittyp_kurzbz, oe.bezeichnung
			),
			-- Overall sum of all oes, later used to calculate percentage share
			totalLizenzen AS (
				SELECT SUM(sum_lizenzen) AS sum_lizenzen FROM groupedLizenzen
			)
				
			SELECT 
				groupedLizenzen.oe_kurzbz,
				groupedLizenzen.lv_oe_bezeichnung,
				groupedLizenzen.studiensemester_kurzbz,
				-- Sum by oe
				groupedLizenzen.sum_lizenzen, 
				-- Percentage share by oe
				COALESCE(ROUND ((groupedLizenzen.sum_lizenzen/NULLIF(totalLizenzen.sum_lizenzen::decimal, 0)) * 100, 2), 0) AS percentage_share
			FROM 
				groupedLizenzen, totalLizenzen 
			ORDER BY
				studiensemester_kurzbz DESC, lv_oe_bezeichnung
		';

		return $this->execQuery($qry, [$software_id, $studiensemester_kurzbz_arr]);
	}

	private function _getLanguageIndex()
	{
		$this->load->model('system/Sprache_model', 'SpracheModel');
		$this->SpracheModel->addSelect('index');
		$result = $this->SpracheModel->loadWhere(array('sprache' => getUserLanguage()));

		// Return language index
		return hasData($result) ? getData($result)[0]->index : 1;
	}
}
