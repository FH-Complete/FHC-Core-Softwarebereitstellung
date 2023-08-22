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
	public function insertSoftwareimageAndOrte($softwareimage, $orte_kurzbz)
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

	/**
	 * Update Softwareimage, add new Räume assigned to Softwareimage and delete Räume that were removed.
	 * Rollback on error.
	 *
	 * @param $softwareimage array
	 * @param $orte_kurzbz array
	 * @return mixed
	 */
	public function updateSoftwareimageAndOrte($softwareimage, $orte_kurzbz)
	{
		// Start DB transaction
		$this->db->trans_start(false);

		// Update Softwareimage
		$this->update($softwareimage['softwareimage_id'], $softwareimage);

		// Add new Räume assigned to Softwareimage and delete Räume that were removed
		if (isset($orte_kurzbz) && is_array($orte_kurzbz))
		{
			$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareimageOrt_model', 'SoftwareimageOrtModel');

			// Step 1: Add new Räume
			foreach ($orte_kurzbz as $ort_kurzbz) {
				$qry = "
					INSERT INTO extension.tbl_softwareimage_ort (softwareimage_id, ort_kurzbz) 
					SELECT ?, ?
					WHERE ? NOT IN  (SELECT ort_kurzbz FROM extension.tbl_softwareimage_ort WHERE softwareimage_id = ?);
				";

				$this->SoftwareimageOrtModel->execQuery($qry,
					array(
						$softwareimage['softwareimage_id'],
						$ort_kurzbz,
						$ort_kurzbz,
						$softwareimage['softwareimage_id']
					)
				);
			}

			// Step 2: Delete Räume
			$qry = "
					DELETE FROM extension.tbl_softwareimage_ort
					WHERE softwareimage_id = ? 
					  AND ort_kurzbz NOT IN ?;
				";

			$this->SoftwareimageOrtModel->execQuery($qry,
				array(
					$softwareimage['softwareimage_id'],
					$orte_kurzbz,
				)
			);
		}

		// Transaction complete
		$this->db->trans_complete();

		if ($this->db->trans_status() === false)
		{
			$this->db->trans_rollback();
			return error('Fehler beim Update des Softwareimages', EXIT_ERROR);
		}

		return success();
	}


}
