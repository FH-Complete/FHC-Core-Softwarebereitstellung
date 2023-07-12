<?php
class Softwarestatus_model extends DB_Model
{

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_softwarestatus';
		$this->pk = 'softwarestatus_kurzbz';
	}

    /**
     * Get Softwarestatus by Users Language
     * @param $language_index
     * @return mixed
     */
    public function loadByLanguage($language_index)
    {
        return $this->execQuery(
            '
				SELECT softwarestatus_kurzbz, bezeichnung[?] AS bezeichnung
				FROM extension.tbl_softwarestatus
				',
            array($language_index)
        );
    }
}
