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
				'getImage' => 'basis/mitarbeiter:r',
				'updateImageAndOrte' => 'basis/mitarbeiter:r',
				'createImageAndOrte' => 'basis/mitarbeiter:r',
				'deleteImage' => 'basis/mitarbeiter:r',
				'getImagesBySoftware' => 'basis/mitarbeiter:r',
				'getImagesByBezeichnung' => 'basis/mitarbeiter:r'
			)
		);

		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwareimage_model', 'SoftwareimageModel');

		$this->_setAuthUID(); // sets property uid
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Get Softwareimage.
	 */
	public function getImage(){
		$softwareimage_id = $this->input->get('softwareimage_id');

		$result = $this->SoftwareimageModel->load($softwareimage_id);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen des Softwareimages');
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Inserts Softwareimage and inserts Räume that were assigned to that image.
	 *
	 * @return mixed
	 */
	public function createImageAndOrte(){
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		// Insert image and assign Räume to that image
		$result = $this->SoftwareimageModel->insertSoftwareimageAndOrte(
			$data['softwareimage'],
			$data['orte_kurzbz']
		);

		return $this->outputJson($result);
	}

	/**
	 * Update Softwareimage, add new Räume assigned to Softwareimage and delete Räume that were removed.
	 *
	 * @return mixed
	 */
	public function updateImageAndOrte()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		// Update image
		$result = $this->SoftwareimageModel->updateSoftwareimageAndOrte(
			$data['softwareimage'],
			$data['orte_kurzbz']
		);

		return $this->outputJson($result);
	}

	/**
	 * Delete Softwareimage.
	 */
	public function deleteImage()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
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
			$this->terminateWithJsonError('Fehler beim Holen der Images: '.getError($result));
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
			$this->terminateWithJsonError('Fehler beim Holen der Images: '.getError($result));
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
	/**
	 * Performs validation checks.
	 * @return object
	 */
	private function _validate($data)
	{
		// Validate form data
		if (isset($data['softwareimage']) && is_object($data['softwareimage']))
		{
			$this->load->library('form_validation');

			$this->form_validation->set_data($data['softwareimage']);
			$this->form_validation->set_rules('bezeichnung', 'Softwareimage Bezeichnung', 'required', array('required' => '%s fehlt'));

			// On error
			if ($this->form_validation->run() == false)
			{
				return error($this->form_validation->error_array());
			}
		}

		// Validate other vars
		if (isset($data['softwareimage_id']) && !is_numeric($data['softwareimage_id']))
		{
			return error('Error on softwareimage_id');
		}

		// On success
		return success();
	}
}
