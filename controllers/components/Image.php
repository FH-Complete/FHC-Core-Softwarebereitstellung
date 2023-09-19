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
				'createImage' => 'basis/mitarbeiter:rw',
				'updateImage' => 'basis/mitarbeiter:rw',
				'deleteImage' => 'basis/mitarbeiter:rw',
				'copyImageAndOrte' => 'basis/mitarbeiter:rw',
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
	public function getImage()
	{
		$softwareimage_id = $this->input->get('softwareimage_id');

		$result = $this->SoftwareimageModel->load($softwareimage_id);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen des Softwareimages');
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Insert new Softwareimage.
	 */
	public function createImage()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		// Return if Imagebezeichnung already exixts
		$result = $this->SoftwareimageModel->load(array('bezeichnung' => $data['softwareimage']['bezeichnung']));

		if (hasData($result))
		{
			$this->terminateWithJsonError('Bezeichnung wird bereits verwendet. Wählen Sie eine neue Bezeichnung.');
		}

		// Insert image
		$result = $this->SoftwareimageModel->insert(
			$data['softwareimage']
		);

		return $this->outputJson($result);
	}

	/**
	 * Update Softwareimage.
	 *
	 * @return mixed
	 */
	public function updateImage()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		// Update image
		$result = $this->SoftwareimageModel->update($data['softwareimage']['softwareimage_id'],
			$data['softwareimage']
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
	 * Copy exixting Softwareimage and Orte, that are assigend to that image.
	 * Check for different Bezeichnung.
	 *
	 * @return mixed
	 */
	public function copyImageAndOrte(){
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data);

		if (isError($result)) $this->terminateWithJsonError(getError($result));

		// Return if Imagebezeichnung already exixts
		$result = $this->SoftwareimageModel->load(array('bezeichnung' => $data['softwareimage']['bezeichnung']));

		if (hasData($result))
		{
			$this->terminateWithJsonError('Bezeichnung wird bereits verwendet. Wählen Sie eine neue Bezeichnung.');
		}

		// Insert image
		$result = $this->SoftwareimageModel->copyImageAndOrteOf($data['softwareimage']);

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
		if (isset($data['softwareimage']) && !isEmptyArray($data['softwareimage']))
		{
			$softwareimage = $data['softwareimage'];
			$this->load->library('form_validation');

			$this->form_validation->set_data($softwareimage);
			$this->form_validation->set_rules('bezeichnung', 'Softwareimage Bezeichnung', 'required', array('required' => '%s fehlt'));
			$this->form_validation->set_rules('softwareimage_id', 'Softwareimage ID', 'numeric', array('numeric' => '%s ungültig'));
			$this->form_validation->set_rules(
				'verfuegbarkeit_start',
				'Verfügbarkeit Start',
				'callback_checkImageVerfuegbarkeit['.$softwareimage['verfuegbarkeit_ende'].']',
				array('checkImageVerfuegbarkeit' => 'Verfügbarkeit ungültig, oder %s größer als Verfügbarkeit Ende')
			);

			// On error
			if ($this->form_validation->run() == false)
			{
				return error($this->form_validation->error_array());
			}
		}

		// On success
		return success();
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Validation methods

	/**
	 * Check if Verfügbarkeit is valid.
	 * @param verfuegbarkeit_start
	 * @param verfuegbarkeit_ende
	 * @return bool valid or not
	 */
	public function checkImageVerfuegbarkeit($verfuegbarkeit_start, $verfuegbarkeit_ende)
	{
		$start = strtotime($verfuegbarkeit_start);
		$ende = strtotime($verfuegbarkeit_ende);

		return $start && $ende && $start < $ende;
	}
}
