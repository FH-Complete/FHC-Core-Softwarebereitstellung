<?php
class Softwaretyp_model extends DB_Model
{

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_softwaretyp';
		$this->pk = 'softwaretyp_kurzbz';
	}

	public function getBezeichnungByLanguageIndex($language_index)
	{
		return $this->execQuery(
			'
				SELECT softwaretyp_kurzbz, bezeichnung[?] AS bezeichnung
				FROM extension.tbl_softwaretyp
				ORDER BY softwaretyp_kurzbz',
			array($language_index)
		);
	}
}
