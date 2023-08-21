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

	/**
	 * Insert new Softwareimage and insert also Räume that were assigned to that image.
	 * Rollback on error.
	 *
	 * @param $softwareimage array
	 * @param $orte_kurzbz array
	 * @return mixed
	 */
	public function insertSoftwareimage($softwareimage, $orte_kurzbz)
	{
		// Start DB transaction
		$this->db->trans_start(false);

		// Insert Softwareimage
		$result = $this->insert($softwareimage);

		// Store just inserted softwareimage_id
		$lastInsert_id = getData($result);

		// Assign Räume to Softwareimage
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareimageOrt_model', 'SoftwareimageOrtModel');
		foreach ($orte_kurzbz as $ort_kurzbz)
		{
			$this->SoftwareimageOrtModel->insert(
				array(
					'softwareimage_id' => $lastInsert_id,
					'ort_kurzbz' => $ort_kurzbz
				)
			);
		}

		// Transaction complete
		$this->db->trans_complete();

		if ($this->db->trans_status() === false)
		{
			$this->db->trans_rollback();
			return error('Fehler beim Hinzufügen des Softwareimages', EXIT_ERROR);
		}

		return success($lastInsert_id);
	}

}
