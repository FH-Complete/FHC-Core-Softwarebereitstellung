<?php
class Software_model extends DB_Model
{

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_software';
		$this->pk = 'software_id';
	}
}
