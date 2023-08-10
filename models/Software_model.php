<?php
class Software_model extends DB_Model
{
	private $_uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_software';
		$this->pk = 'software_id';
	}

	/**
	 * Insert new Software plus new Softwarestatus.
	 * Rollback on error.
	 *
	 * @param $software array
	 * @param $softwarestatus_kurzbz string
	 * @return mixed
	 */
	public function insertSoftwarePlus($software, $softwarestatus_kurzbz, $softwareImageIds)
	{
		$uid = getAuthUID();

		// Start DB transaction
		$this->db->trans_start(false);

		// Insert Software
		$result = $this->insert($software);

		// Store just inserted software_id
		$lastInsert_id = getData($result);

		// Insert Softwarestatus
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwarestatus_model', 'SoftwarestatusModel');
		$this->SoftwareSoftwarestatusModel->insert(
			array(
				'software_id' => $lastInsert_id,
				'datum' => 'NOW()',
				'softwarestatus_kurzbz' => $softwarestatus_kurzbz,
				'uid' => $uid
			)
		);

		// Assign images to software
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareimageSoftware_model', 'SoftwareimageSoftwareModel');
		foreach ($softwareImageIds as $softwareimage_id)
		{
			$this->SoftwareimageSoftwareModel->insert(
				array('software_id' => $lastInsert_id, 'softwareimage_id' => $softwareimage_id, 'insertvon' => $uid)
			);
		}

		// Transaction complete
		$this->db->trans_complete();

		if ($this->db->trans_status() === false)
		{
			$this->db->trans_rollback();
			return error('Fehler beim Hinzufügen der Software', EXIT_ERROR);
		}

		return success($lastInsert_id);
	}

	/**
	 * Update Software plus insert new Softwarestatus.
	 * Rollback on error.
	 *
	 * @param $software array
	 * @param $softwarestatus_kurzbz string
	 * @return mixed
	 */
	public function updateSoftwarePlus($software, $softwarestatus_kurzbz, $softwareImageIds = null)
	{
		$uid = getAuthUID();

		// Start DB transaction
		$this->db->trans_start(false);

		// Update Software
		$this->update($software['software_id'], $software);

		// Insert newer Softwarestatus
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwarestatus_model', 'SoftwarestatusModel');
		$this->SoftwareSoftwarestatusModel->changeSoftwarestatus(
			array($software['software_id']),
			$softwarestatus_kurzbz
		);

		// if image ids passed - handle image assignments
		if (isset($softwareImageIds) && is_array($softwareImageIds))
		{
			// get already assigned images
			$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareimageSoftware_model', 'SoftwareimageSoftwareModel');
			$this->SoftwareimageSoftwareModel->addSelect('softwareimage_id');
			$softwareImageSoftwareRes = $this->SoftwareimageSoftwareModel->loadWhere(
				array('software_id' => $software['software_id'])
			);

			$assignedSoftwareImageIds = array();
			$softwareImageSoftware = hasData($softwareImageSoftwareRes) ? getData($softwareImageSoftwareRes) : array();
			foreach ($softwareImageSoftware as $sw_image)
			{
				$assignedSoftwareImageIds[] = $sw_image->softwareimage_id;
			}

			$softwareImageIdsToAdd = array_diff($softwareImageIds, $assignedSoftwareImageIds);
			$softwareImageIdsToDelete = array_diff($assignedSoftwareImageIds, $softwareImageIds);

			// add new image assignments
			foreach ($softwareImageIdsToAdd as $softwareimage_id)
			{
				$this->SoftwareimageSoftwareModel->insert(
					array('software_id' => $software['software_id'], 'softwareimage_id' => $softwareimage_id, 'insertvon' => $uid)
				);
			}

			// delete removed image assignments
			foreach ($softwareImageIdsToDelete as $softwareimage_id)
			{
				$this->SoftwareimageSoftwareModel->delete(
					array('software_id' => $software['software_id'], 'softwareimage_id' => $softwareimage_id)
				);
			}
		}

		// Transaction complete
		$this->db->trans_complete();

		if ($this->db->trans_status() === false)
		{
			$this->db->trans_rollback();
			return error('Fehler beim Update der Software', EXIT_ERROR);
		}

		return success();
	}

	/**
	 * Gets all parents of a software.
	 * @param $software_id
	 * @return object
	 */
	public function getParents($software_id)
	{
		$query=
		"WITH RECURSIVE software(software_id, software_id_parent) as
		(
			SELECT software_id, software_id_parent FROM extension.tbl_software
			WHERE software_id=?
			UNION ALL
			SELECT s.software_id, s.software_id_parent FROM extension.tbl_software s, software
			WHERE s.software_id=software.software_id_parent
		)
		SELECT software_id
		FROM software";

		return $this->execQuery($query, array($software_id));
	}


	/**
	 * Gets dependencies of a software (needed e.g. for checks if a software can be deleted).
	 * @param software_id
	 * @return object success or error
	 */
	public function getSoftwareDependencies($software_id)
	{
		return $this->execQuery('
			SELECT
				sw_image.softwareimage_id, sw_child.software_id_parent
			FROM
				extension.tbl_software sw
				LEFT JOIN extension.tbl_softwareimage_software sw_image USING (software_id)
				LEFT JOIN extension.tbl_software sw_child ON sw.software_id = sw_child.software_id_parent
			WHERE
				sw.software_id = ?',
			array(
				$software_id
			)
		);
	}
}
