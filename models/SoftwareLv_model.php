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
}
