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
	public function getAllSwLvsByOesAndStudiensemester($studiensemester_kurzbz = null, $oes = null)
	{
		$params = [];
		$qry = '
			SELECT DISTINCT ON (lv_oe_kurzbz, stg_bezeichnung, lehrveranstaltung_id)
			    le.studiensemester_kurzbz,
                lv.oe_kurzbz AS "lv_oe_kurzbz",
                CASE
                    WHEN oe.organisationseinheittyp_kurzbz = \'Kompetenzfeld\' THEN (\'KF \' || oe.bezeichnung)
                    WHEN oe.organisationseinheittyp_kurzbz = \'Department\' THEN (\'DEP \' || oe.bezeichnung)
                    ELSE (oe.organisationseinheittyp_kurzbz || \' \' || oe.bezeichnung)
                END AS "lv_oe_bezeichnung",
                stg.studiengang_kz,
                upper(stg.typ || stg.kurzbz) AS "stg_typ_kurzbz",    
                stg.bezeichnung AS "stg_bezeichnung",
                lv.semester,   
                lv.lehrveranstaltung_id,
                lv.bezeichnung AS "lv_bezeichnung",
		    	swlv.software_lv_id,
			    swlv.software_id,
			    swlv.lizenzanzahl AS "anzahl_lizenzen",
				swlv.insertvon,
				swlv.insertamum::date,
				swlv.updatevon,
				swlv.updateamum::date,        
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
				lehre.tbl_lehrveranstaltung     		lv 
				JOIN lehre.tbl_lehreinheit           	le USING (lehrveranstaltung_id)
				JOIN public.tbl_organisationseinheit 	oe USING (oe_kurzbz)
				JOIN public.tbl_studiengang          	stg ON stg.studiengang_kz = lv.studiengang_kz
				JOIN extension.tbl_software_lv 	 		swlv ON (
					swlv.studiensemester_kurzbz = le.studiensemester_kurzbz AND
					swlv.lehrveranstaltung_id = lv.lehrveranstaltung_id
                    )
				JOIN extension.tbl_software sw USING (software_id)
				JOIN extension.tbl_softwaretyp sw_typ USING (softwaretyp_kurzbz)
            WHERE
				/* filter negative studiengaenge */
                stg.studiengang_kz > 0 ';

		if (isset($studiensemester_kurzbz) && is_string($studiensemester_kurzbz))
		{
			/* filter studiensemester */
			$qry.= ' AND le.studiensemester_kurzbz =  ? ';
			$params[]= $studiensemester_kurzbz;
		}

		if (isset($oes) && is_array($oes))
		{
			/* filter organisationseinheit */
			$qry.= ' AND lv.oe_kurzbz IN ? ';
			$params[]= $oes;
		}

		$qry.= '
                /* filter active lehrveranstaltungen */
                AND lv.aktiv = TRUE
                /* filter active organisationseinheiten */
                AND oe.aktiv = TRUE
		';

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

	private function _getLanguageIndex()
	{
		$this->load->model('system/Sprache_model', 'SpracheModel');
		$this->SpracheModel->addSelect('index');
		$result = $this->SpracheModel->loadWhere(array('sprache' => getUserLanguage()));

		// Return language index
		return hasData($result) ? getData($result)[0]->index : 1;
	}
}