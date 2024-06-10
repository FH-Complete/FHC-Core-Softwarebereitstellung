<?php
class Softwarelizenztyp_model extends DB_Model
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_softwarelizenztyp';
		$this->pk = array('softwarelizenztyp_kurzbz');
		$this->hasSequence = false;
	}
}
