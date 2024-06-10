<?php
class Softwarelizenzserver_model extends DB_Model
{

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_softwarelizenzserver';
		$this->pk = array('lizenzserver_kurzbz');
		$this->hasSequence = false;
	}
}
