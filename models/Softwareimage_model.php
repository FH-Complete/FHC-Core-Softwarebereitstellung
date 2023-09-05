<?php
class Softwareimage_model extends DB_Model
{

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_softwareimage';
		$this->pk = 'softwareimage_id';
	}
}
