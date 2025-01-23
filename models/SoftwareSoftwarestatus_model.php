<?php
class SoftwareSoftwarestatus_model extends DB_Model
{

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_software_softwarestatus';
		$this->pk = 'software_status_id';
	}

	/**
	 * Get last Softwarestatus by Software ID or for all Software. Can be restricted by date additionally.
	 *
	 * @param $software_id integer
	 * @return mixed
	 */
	public function getLastSoftwarestatus($software_id = null, $date = null, $softwarestatus_kurzbz = null)
	{
		$params = [];

		$qry = '
			SELECT
			  	swswstat.*,
			  	swstat.softwarestatus_kurzbz,
			  	swstat.bezeichnung [(' . $this->_getLanguageIndex() . ')] AS softwarestatus_bezeichnung
			FROM
			  	extension.tbl_software_softwarestatus swswstat
			  	JOIN extension.tbl_softwarestatus swstat USING (softwarestatus_kurzbz)
			WHERE
			  	(
					swswstat.software_id,
					swswstat.software_status_id
			  	) 	IN (
					SELECT
					  software_id,
					  MAX(software_status_id)
					FROM
					  extension.tbl_software_softwarestatus
					GROUP BY
					  software_id
			  )
		';

		if (is_array($softwarestatus_kurzbz)){
			$qry.= ' AND softwarestatus_kurzbz IN ?';
			$params[]= $softwarestatus_kurzbz;
		}

		if (is_numeric($software_id))
		{
			$qry.= ' AND software_id = ?';
			$params[]= $software_id;
		}
		elseif (is_array($software_id)){
			$qry.= ' AND software_id IN ?';
			$params[]= $software_id;
		}

		if (!is_null($date)){
			$qry.= ' AND datum = DATE ?';
			$params[]= $date;
		}

		return $this->execQuery($qry, $params);
	}

	/**
	 * Insert Softwarestatus after check to avoid double entries.
	 * Inserts only if last softwarestatus is different from given softwarestatus (avoid double entries).
	 *
	 * @param $software_id_arr array
	 * @param $softwarestatus_kurzbz string
	 * @return mixed
	 */
	public function changeSoftwarestatus($software_id_arr, $softwarestatus_kurzbz)
    {
		// Avoid inserting multiple times the same softwarestatus
		$qry = '
			SELECT software_id FROM (
			    -- Get last status of each given software
				SELECT DISTINCT ON (software_id) *
				FROM extension.tbl_software_softwarestatus
				WHERE software_id IN ?
				ORDER BY software_id, datum DESC, software_status_id DESC
			) tmp
			-- Keep only where last softwarestatus is different from given softwarestatus
			WHERE softwarestatus_kurzbz != ?
		';

		$result = $this->execQuery($qry, array($software_id_arr, $softwarestatus_kurzbz));

		if (hasData($result))
		{
			// Get UID
			$uid = getAuthUID();

			// Insert newer Softwarestatus
			foreach (getData($result) as $software)
			{
				$this->insert(
					array(
						'software_id' => $software->software_id,
						'datum' => 'NOW()',
						'softwarestatus_kurzbz' => $softwarestatus_kurzbz,
						'uid' => $uid
					)
				);
			}
		}

		return success();
    }
}
