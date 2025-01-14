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
	public function getLastSoftwarestatus($software_id = null, $date = null){

		if (is_numeric($software_id))
		{
			$this->addOrder('datum, software_status_id', 'DESC'); // software_status_id important if many changes at same date
			$this->addLimit(1);
			return $this->loadWhere(array('software_id' => $software_id));
		}
		else
		{
			$qry = '
				SELECT
				  DISTINCT ON (software_id) *
				FROM
				  extension.tbl_software_softwarestatus
				WHERE 1 = 1
			';

			if (!is_null($date))
			{
				$qry.= " AND datum = DATE '" . $date . "'";
			}

			$qry.= '	
				ORDER BY
				  software_id,
				  software_status_id DESC
			';

			return $this->execQuery($qry);
		}
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
