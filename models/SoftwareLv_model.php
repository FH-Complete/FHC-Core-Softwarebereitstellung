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
	 * @param $studiensemester_kurzbz    Filter by Studiensemester
	 * @param null $lv_oes Filter by lv oes
	 * @param null $stg_oes Filter by lv's stg oes
	 * @param null | bool $assignedByTpl
	 * If true, only SwLvs that were requested by Quellkurs are returned.
	 * If false, only SwLvs that were requested by Lv (NOT by Quellkurs) are returned.
	 * @return mixed
	 */
	public function getSwLvs($studiensemester_kurzbz = null, $lv_oes = null, $stg_oes = null, $requestedByTpl = null)
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
			    lv.lehrtyp_kurzbz,
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
				(SELECT softwarestatus_kurzbz
					FROM extension.tbl_software_softwarestatus
					JOIN extension.tbl_softwarestatus USING (softwarestatus_kurzbz)
					WHERE software_id = swlv.software_id
					ORDER BY software_status_id DESC
					LIMIT 1
				),
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
				JOIN public.tbl_studiengangstyp 		stgtyp ON stgtyp.typ = stg.typ';

		if (is_bool($requestedByTpl))
		{
			/* filter studiensemester */
			$qry.= ' LEFT JOIN extension.tbl_software_lv swlv1 ON swlv1.lehrveranstaltung_id = lv.lehrveranstaltung_template_id AND swlv1.software_id = swlv.software_id';
		}

		$qry.= ' WHERE 1 = 1 
            ';

		$params = [];

		if (isset($studiensemester_kurzbz) && is_string($studiensemester_kurzbz))
		{
			/* filter studiensemester */
			$qry.= ' AND swlv.studiensemester_kurzbz =  ? ';
			$params[]= $studiensemester_kurzbz;
		}

		if ($requestedByTpl === true)
		{
			/* filter templates and their assigned lvs that were requested via Quellkurs  */
			$qry.= ' AND (swlv1.software_lv_id IS NOT NULL OR lv.lehrtyp_kurzbz = \'tpl\')';
		}

		if ($requestedByTpl === false)
		{
			/* filter lvs that where not requested via Quellkurs */
			$qry.= ' AND swlv1.software_lv_id IS NULL AND lv.lehrtyp_kurzbz = \'lv\'';
		}

		if (isset($lv_oes) && is_array($lv_oes))
		{
			/* filter by lv organisationseinheit */
			$qry.= ' AND lv.oe_kurzbz IN ?';
			$params[]= $lv_oes;
		}

		if (isset($stg_oes) && is_array($stg_oes))
		{
			/* filter by lv studiengangs organisationseinheit */
			$qry.= ' AND stg.oe_kurzbz IN ?';
			$params[]= $stg_oes;
		}

		return $this->execQuery($qry, $params);
	}

	/**
	 * Get all Software-Lehrveranstaltungs-Zuordnungen of given Template.
	 * Returns all assigned SwLvs - not Quellkurs itself.
	 *
	 * @param $lehrveranstaltung_template_id
	 * @param $software_id
	 * @param $studiensemester_kurzbz
	 */
	public function getSwLvsByTemplate($lehrveranstaltung_template_id, $software_id, $studiensemester_kurzbz)
	{
		// Get zugehörige Lv-Sw-Zuordnungen
		$this->load->model('education/Lehrveranstaltung_model', 'LehrveranstaltungModel');
		$this->LehrveranstaltungModel->addSelect('lehrveranstaltung_id');
		$result = $this->LehrveranstaltungModel->loadWhere([
			'lehrveranstaltung_template_id' => $lehrveranstaltung_template_id
		]);

		if(hasData($result))
		{
			$this->addSelect('software_lv_id, lehrveranstaltung_id, software_id, studiensemester_kurzbz, studiengang_kz, stg.oe_kurzbz AS "stg_oe_kurzbz", lv.bezeichnung');
			$this->addJoin('lehre.tbl_lehrveranstaltung lv', 'lehrveranstaltung_id');
			$this->addJoin('public.tbl_studiengang stg', 'studiengang_kz');
			return $this->loadWhere('
				lehrtyp_kurzbz = \'lv\' AND
				lehrveranstaltung_id IN (' . implode(', ',
				array_column(getData($result), 'lehrveranstaltung_id')) . ') AND
				software_id = ' . $this->db->escape($software_id) . ' AND
				studiensemester_kurzbz = ' . $this->db->escape($studiensemester_kurzbz)
			);
		}
	}

	/**
	 * Save multiple Software-Lehrveranstaltungs-Zuordnungen
	 * @param $batch
	 * @return mixed
	 */
	public function insertBatch($batch)
	{
		// If running in CLI mode, use 'system', else get the user UID
		$uid =  php_sapi_name() === 'cli' ? 'system' : getAuthUid();

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

	public function getUnassignedStandardLvsByTemplate($studiensemester_kurzbz){
		$qry = '
			WITH CTE_ValidTemplates AS (
				-- Get all templates that exist in tbl_software_lv and also fetch the software_id from tbl_software_lv
				SELECT
					lv.lehrveranstaltung_id AS tpl_lehrveranstaltung_id,
					swlv.software_id,
					swlv.studiensemester_kurzbz
				FROM lehre.tbl_lehrveranstaltung lv
				JOIN extension.tbl_software_lv swlv USING (lehrveranstaltung_id)
    			WHERE lv.lehrtyp_kurzbz = \'tpl\'
    			AND swlv.studiensemester_kurzbz = ?
			),
			CTE_MissingChildLvs AS (
				-- Find child rows of valid templates, and join with software_id from CTE_ValidTemplates
				SELECT 
					lv.lehrveranstaltung_id,
					tpl.software_id,
					tpl.studiensemester_kurzbz
				FROM lehre.tbl_lehrveranstaltung lv
				JOIN CTE_ValidTemplates tpl
					ON lv.lehrveranstaltung_template_id = tpl.tpl_lehrveranstaltung_id
				WHERE NOT EXISTS (
					SELECT 1
					FROM extension.tbl_software_lv swlv
					WHERE swlv.lehrveranstaltung_id = lv.lehrveranstaltung_id
					AND swlv.studiensemester_kurzbz = ?
				)
			)
			
			-- Final output: Missing child lvs along with the software_id from the corresponding template
			SELECT 
				lv.*,
				cte.software_id,
				cte.studiensemester_kurzbz,
				sw.software_kurzbz,
				stg.oe_kurzbz AS "stg_oe_kurzbz" -- OE of LV-Stg
			FROM lehre.tbl_lehrveranstaltung lv
			JOIN CTE_MissingChildLvs cte USING (lehrveranstaltung_id)
			JOIN extension.tbl_software sw USING (software_id)
			JOIN public.tbl_studiengang stg USING (studiengang_kz)
			ORDER BY lv.studiengang_kz;
		';

		return $this->execQuery($qry, [$studiensemester_kurzbz, $studiensemester_kurzbz]);
	}

	/**
	 * Get SwLvs with lizenzpflichtige Software (not open source), where lizenzanzahl is 0
	 * @return mixed
	 */
	public function getWhereLizenzanzahl0()
	{
		$this->load->model('organisation/Studienjahr_model', 'StudienjahrModel');
		$result = $this->StudienjahrModel->getCurrStudienjahr();
		$studienjahr_kurzbz = getData($result)[0]->studienjahr_kurzbz;

		$this->load->model('organisation/Studiensemester_model', 'StudiensemesterModel');
		$this->StudiensemesterModel->addSelect('studiensemester_kurzbz');
		$result = $this->StudiensemesterModel->loadWhere(['studienjahr_kurzbz' => $studienjahr_kurzbz]);
		$studiensemester = array_column(getData($result), 'studiensemester_kurzbz');

		$qry = '
			SELECT swlv.*, lv.*, sw.*, stg.studiengang_kz, stg.oe_kurzbz AS "stg_oe_kurzbz" -- OE of LV-Stg
			FROM extension.tbl_software_lv swlv
			JOIN lehre.tbl_lehrveranstaltung lv USING (lehrveranstaltung_id)
			JOIN extension.tbl_software sw USING (software_id)
			JOIN public.tbl_studiengang stg USING (studiengang_kz)
			WHERE studiensemester_kurzbz IN ?
			AND lizenzanzahl = 0
			-- ignore open source software, as they are supposed to have 0
			AND (sw.lizenzart != \'opensource\' OR sw.lizenzart IS NULL)
			ORDER BY lv.studiengang_kz;;
		';

		return $this->execQuery($qry, [$studiensemester]);
	}

	/**
	 * Get SwLvs entries where the Softwarestatus was changed to 'End of Life' or 'Nicht verfügbar' yesterday.
	 *
	 * @param string $date Can be 'TODAY', 'YESTERDAY' or '2025-01-10'
	 */
	public function getExpiredSwStatusSwLvs($date = 'YESTERDAY')
	{
		// Get expired softwarestatus from config
		$expiredSwStatus = [];
		if ($this->config->item('expired_sw_status') && is_array($this->config->item('expired_sw_status')))
		{
			$expiredSwStatus = $this->config->item('expired_sw_status');
		}

		$this->load->model('organisation/Studienjahr_model', 'StudienjahrModel');
		$result = $this->StudienjahrModel->getCurrStudienjahr();
		$studienjahr_kurzbz = getData($result)[0]->studienjahr_kurzbz;

		$this->load->model('organisation/Studiensemester_model', 'StudiensemesterModel');
		$this->StudiensemesterModel->addSelect('studiensemester_kurzbz');
		$result = $this->StudiensemesterModel->loadWhere(['studienjahr_kurzbz' => $studienjahr_kurzbz]);
		$studiensemester = array_column(getData($result), 'studiensemester_kurzbz');

		$qry = '
			-- Get SW where status was changed to endoflife or nichtverfuegbar yesterday
			WITH latest_expired_status AS (
			  	SELECT DISTINCT ON (software_id) software_id, softwarestatus_kurzbz
			  	FROM extension.tbl_software_softwarestatus
			  	WHERE datum = ?
				AND softwarestatus_kurzbz IN ?
			  	ORDER BY software_id, software_status_id DESC
			)

			-- Get SwLvs, where SW will expire
			SELECT DISTINCT ON (swlv.software_id, swlv.lehrveranstaltung_id, swlv.studiensemester_kurzbz)
			  sw.software_kurzbz,
			  lv.bezeichnung,
			  lv.orgform_kurzbz,
			  lv.oe_kurzbz,
			  stg.oe_kurzbz AS "stg_oe_kurzbz",
			  swstat.softwarestatus_kurzbz
			FROM extension.tbl_software_lv swlv
			  JOIN extension.tbl_software sw USING (software_id)
			  JOIN lehre.tbl_lehrveranstaltung lv USING (lehrveranstaltung_id)
			  JOIN public.tbl_studiengang stg USING (studiengang_kz)
			  JOIN extension.tbl_software_softwarestatus swswstat USING (software_id)
			  JOIN extension.tbl_softwarestatus swstat USING (softwarestatus_kurzbz)
			  -- Join to SW where status was changed to endoflife or nichtverfuegbar yesterday
			  JOIN latest_expired_status ls ON swlv.software_id = ls.software_id
			  	AND swstat.softwarestatus_kurzbz = ls.softwarestatus_kurzbz
			WHERE
			  -- Filter only Winter- and Sommersemester of actual Studienjahr
			  swlv.studiensemester_kurzbz IN ?
			  -- Filter only type Lehrveranstaltung (not templates)
			  AND lv.lehrtyp_kurzbz = \'lv\';
		';

		return $this->execQuery($qry, [$date, $expiredSwStatus, $studiensemester]);
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
