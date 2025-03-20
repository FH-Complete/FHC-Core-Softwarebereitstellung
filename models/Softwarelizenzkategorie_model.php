<?php
class Softwarelizenzkategorie_model extends DB_Model
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_softwarelizenzkategorie';
		$this->pk = array('lizenzkategorie_kurzbz');
		$this->hasSequence = false;
	}
}
