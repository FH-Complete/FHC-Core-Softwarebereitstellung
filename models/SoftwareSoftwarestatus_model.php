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
     * Update Status
     */
    public function updateStatus($software_id_arr, $softwarestatus_kurzbz)
    {
        return $this->execQuery('
            UPDATE extension.tbl_software_softwarestatus
            SET softwarestatus_kurzbz = ?
            WHERE software_id IN ?',
            array(
                $softwarestatus_kurzbz,
                $software_id_arr
            )
        );
    }
}
