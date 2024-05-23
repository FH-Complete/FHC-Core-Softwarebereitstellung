<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Software functions
 */
class Image extends Auth_Controller
{
	private $_uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'getImage' => 'extension/software_verwalten:rw',
				'deleteImage' => 'extension/software_verwalten:rw',
				'getImagesBySoftware' => 'extension/software_verwalten:rw',
				'getImagesByBezeichnung' => 'extension/software_verwalten:rw'
			)
		);

		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwareimage_model', 'SoftwareimageModel');

		// Load language phrases
		$this->loadPhrases([
				'ui',
				'global'
		]);

		$this->_setAuthUID(); // sets property uid
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Get Softwareimage.
	 */
	public function getImage()
	{
		$softwareimage_id = $this->input->get('softwareimage_id');

		$result = $this->SoftwareimageModel->load($softwareimage_id);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Delete Softwareimage.
	 */
	public function deleteImage()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		if (!isset($data['softwareimage_id'])) $this->terminateWithJsonError($this->p->t('ui', 'errorFelderFehlen'));

		// Exit if Image has zugeordnete Software
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareimageSoftware_model', 'SoftwareimageSoftwareModel');

		$result = $this->SoftwareimageSoftwareModel->loadWhere(['softwareimage_id' => $data['softwareimage_id']]);

		if (hasData($result))
		{
			$this->terminateWithJsonError($this->p->t('global', 'loeschenNichtMoeglichSoftwareBereitsZugeordnet'));
		}


		// Delete Softwareimage
		$result = $this->SoftwareimageModel->delete($data['softwareimage_id']);

		return $this->outputJson($result);
	}

	/**
	 * Get all Images containing a Bezeichnung.
	 */
	public function getImagesBySoftware()
	{
		$software_id = $this->input->get('software_id');
		$this->SoftwareimageModel->addSelect('softwareimage_id, bezeichnung AS image_bezeichnung');
		$this->SoftwareimageModel->addJoin('extension.tbl_softwareimage_software sw_image', 'softwareimage_id');
		$this->SoftwareimageModel->addOrder('image_bezeichnung');
		$this->SoftwareimageModel->addOrder('softwareimage_id', 'DESC');
		$result = $this->SoftwareimageModel->loadWhere(array('software_id' => $software_id));

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Get all Images containing a Bezeichnung.
	 */
	public function getImagesByBezeichnung()
	{
		$image_bezeichnung = $this->input->get('image_bezeichnung');

		$this->SoftwareimageModel->addSelect('softwareimage_id, bezeichnung AS image_bezeichnung');
		$this->SoftwareimageModel->addOrder('image_bezeichnung');
		$this->SoftwareimageModel->addOrder('softwareimage_id', 'DESC');
		$result = $this->SoftwareimageModel->loadWhere("bezeichnung ILIKE '%".$this->SoftwareimageModel->escapeLike($image_bezeichnung)."%'");

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Retrieve the UID of the logged user and checks if it is valid
	 */
	private function _setAuthUID()
	{
		$this->_uid = getAuthUID();

		if (!$this->_uid) show_error('User authentification failed');
	}
}
