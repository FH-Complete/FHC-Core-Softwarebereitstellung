<?php
class SoftwareimageSoftware_model extends DB_Model
{

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_softwareimage_software';
		$this->pk = array('software_id', 'softwareimage_id');
		$this->hasSequence = false;
	}
}
