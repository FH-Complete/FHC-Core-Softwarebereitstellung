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

	public function copyImageAndOrteOf($softwareimage)
	{
		// Start DB transaction
		$this->db->trans_start(false);

		// Extract Softwareimage ID to be copied
		$softwareimage_id_toBeCopied = $softwareimage['softwareimage_id'];

		// Remove from given
		unset($softwareimage["softwareimage_id"]);
		// Insert Image
		$result = $this->insert($softwareimage);

		// Store just inserted software_id
		$lastInsert_id = getData($result);

		// Load model
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareimageOrt_model', 'SoftwareimageOrtModel');

		// Get zugeordnete Räume of given Image...
		$this->SoftwareimageOrtModel->addSelect('ort_kurzbz');
		$result = $this->SoftwareimageOrtModel->loadWhere(array(
			'softwareimage_id' => $softwareimage_id_toBeCopied)
		);

		// ...and copy them to new image
		if (hasData($result))
		{
			foreach (getData($result) as $obj)
			{
				$softwareimageort = (array)$obj;
				$softwareimageort['softwareimage_id'] = $lastInsert_id;

				$this->SoftwareimageOrtModel->insert($softwareimageort);
			}
		}

		// Transaction complete
		$this->db->trans_complete();

		if ($this->db->trans_status() === false)
		{
			$this->db->trans_rollback();
			return error('Fehler beim Kopieren des Softwareimages', EXIT_ERROR);
		}

		return success($lastInsert_id);
	}
}
