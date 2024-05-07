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

		$software['insertvon'] = $uid;

		// Insert Software
		$result = $this->insert($software);

		// Store just inserted software_id
		$lastInsert_id = getData($result);

		// Insert Softwarestatus
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareSoftwarestatus_model', 'SoftwareSoftwarestatusModel');
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
			return error($this->db->error(), EXIT_DATABASE);
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

		$software['updateamum'] = date('Y-m-d H:i:s');
		$software['updatevon'] = $uid;

		// Update Software
		$this->update($software['software_id'], $software);

		// Insert newer Softwarestatus
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareSoftwarestatus_model', 'SoftwareSoftwarestatusModel');
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
			return error($this->db->error(), EXIT_DATABASE);
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
	 * Get all children software of given software.
	 *
	 * @param $software_id
	 * @return mixed
	 */
	public function getChildren($software_id){
		$query = "
			WITH RECURSIVE software(software_id, software_id_parent) as
			(
				SELECT software_id, software_id_parent FROM extension.tbl_software
				WHERE software_id = ? 
				UNION ALL
				SELECT s.software_id, s.software_id_parent FROM extension.tbl_software s
    			JOIN software ON s.software_id_parent = software.software_id 
			)
			
			SELECT software_id
			FROM software s
			WHERE software_id != ?;
		";

		return $this->execQuery($query, array($software_id, $software_id));
	}

	/**
	 * Get Software by Image. (Zugeordnete Software)
	 */
	public function getSoftwareByImage($softwareimage_id, $language_index)
	{
		$qry = '
			SELECT
				swisw.software_id,
				sw.softwaretyp_kurzbz,
				sw.software_kurzbz,
				sw.version,
				(
					SELECT DISTINCT ON (swswstat.software_id) swstat.bezeichnung[?]
					FROM extension.tbl_software_softwarestatus swswstat
					JOIN extension.tbl_softwarestatus swstat USING (softwarestatus_kurzbz)
					WHERE swswstat.software_id = swisw.software_id
					ORDER BY swswstat.software_id, swswstat.datum DESC, swswstat.software_status_id DESC
				) AS softwarestatus_bezeichnung
			FROM extension.tbl_softwareimage_software swisw
			JOIN extension.tbl_software sw USING (software_id)
			WHERE swisw.softwareimage_id = ?
			ORDER BY sw.softwaretyp_kurzbz, sw.software_kurzbz, sw.version;';

		return $this->execQuery($qry, array($language_index, $softwareimage_id));
	}

	/**
	 * Get Software by Ort.
	 *
	 * Software is assinged to Images. Images are assigned to Orte.
	 * Therefore only Software can be returned, that is assigned to an image, which was assigned to the
	 * given Ort.
	 */
	public function getSoftwareByOrt($ort_kurzbz, $language_index)
	{
		$qry = '
			SELECT
			    ? AS ort_kurzbz,
				sw.software_kurzbz,
				sw.software_id,
				swt.bezeichnung[?] AS "softwaretyp_bezeichnung",
				swi.bezeichnung AS "image_bezeichnung",
			    sw.version,
			    sw.hersteller,
			    sw.os,
				(
					SELECT DISTINCT ON (swswstat.software_id) swstat.bezeichnung[?]
					FROM extension.tbl_software_softwarestatus swswstat
					JOIN extension.tbl_softwarestatus swstat USING (softwarestatus_kurzbz)
					WHERE swswstat.software_id = swisw.software_id
					ORDER BY swswstat.software_id, swswstat.datum DESC, swswstat.software_status_id DESC
				) AS softwarestatus_bezeichnung
			FROM extension.tbl_softwareimage_software swisw
			JOIN extension.tbl_software sw USING (software_id)
			JOIN extension.tbl_softwaretyp swt USING (softwaretyp_kurzbz)
			JOIN extension.tbl_softwareimage swi USING (softwareimage_id)
			WHERE softwareimage_id IN (
				SELECT softwareimage_id
				FROM extension.tbl_softwareimage_ort
				WHERE ort_kurzbz = ?
			)
			ORDER BY software_kurzbz';

		return $this->execQuery($qry, array($ort_kurzbz, $language_index, $language_index, $ort_kurzbz)
		);
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
				sw_image.softwareimage_id AS "Softwareimage", sw_child.software_id_parent AS "Übergeordnete Software"
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

	/**
	 * Get software licenses with expiration within the specified interval.
	 * @param string | null $interval The time interval to check for license expiration.
	 * @return mixed The result of the query or an error message if interval is null.
	 */
	public function getSoftwareLizenzlaufzeitendeInInterval($interval = null)
	{
		if (is_null($interval))
		{
			return error('Fehler bei Ermittlung der Zeit vor Lizenzlaufzeitende');
		}

		$this->addSelect('
			software_id,
			swt.bezeichnung[(' . $this->_getLanguageIndex() . ')],
			software_kurzbz,
			lizenzlaufzeit'
		);
		$this->addJoin('extension.tbl_softwaretyp swt', 'softwaretyp_kurzbz');

		return $this->loadWhere(
			'lizenzlaufzeit = ( NOW() + INTERVAL '. $this->escape($interval). ' )::DATE'
		);
	}

	private function _getLanguageIndex()
	{
		$this->load->model('system/Sprache_model', 'SpracheModel');
		$this->SpracheModel->addSelect('index');
		$result = $this->SpracheModel->loadWhere(array('sprache' => getUserLanguage()));

		// Return language index
		return hasData($result) ? getData($result)[0]->index : 1;
	}
}
