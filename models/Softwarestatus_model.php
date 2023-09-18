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
				ORDER BY 
				CASE
					WHEN softwarestatus_kurzbz= \'inbearbeitung\' THEN 1
					WHEN softwarestatus_kurzbz= \'zumtestenbereit\' THEN 2
					WHEN softwarestatus_kurzbz= \'veroeffentlicht\' THEN 3
				 	WHEN softwarestatus_kurzbz= \'endoflife\' THEN 4
				 	WHEN softwarestatus_kurzbz= \'nichtverfuegbar\' THEN 5
					ELSE 6
			  	END',
            array($language_index)
        );
    }
}
