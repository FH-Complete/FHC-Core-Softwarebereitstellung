<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Software functions
 */
class Image extends FHCAPI_Controller
{
	private $_uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'createImage' => 'admin:rw',
				'updateImage' => 'admin:rw',
				'copyImageAndOrte' => 'admin:rw',
			)
		);

		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwareimage_model', 'SoftwareimageModel');

		$this->_setAuthUID(); // sets property uid
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods


	/**
	 * Insert new Softwareimage.
	 */
	public function createImage()
	{
		// Validate data
		$this->_validate();

		// Insert image
		$result = $this->SoftwareimageModel->insert($this->input->post('softwareimage'));

		// On error
		$result = $this->checkForErrors($result, FHCAPI_Controller::ERROR_TYPE_DB);

		// On success
		$this->terminateWithSuccess($result);
	}

	/**
	 * Update Softwareimage.
	 */
	public function updateImage()
	{
		if (!isset($this->input->post('softwareimage')['softwareimage_id']))
			$this->terminateWithError('SoftwareimageId fehlt');

		// Validate data
		$this->_validate($this->input->post('softwareimage')['softwareimage_id']);

		// Update image
		$result = $this->SoftwareimageModel->update(
			$this->input->post('softwareimage')['softwareimage_id'],
			$this->input->post('softwareimage')
		);

		// On error
		$result = $this->checkForErrors($result, FHCAPI_Controller::ERROR_TYPE_DB);

		// On success
		$this->terminateWithSuccess($result);
	}

	/**
	 * Copy exixting Softwareimage and Orte, that are assigend to that image.
	 * Check for different Bezeichnung.
	 *
	 * @return mixed
	 */
	public function copyImageAndOrte()
	{
		if (!isset($this->input->post('softwareimage')['softwareimage_id']))
			$this->terminateWithError('SoftwareimageId fehlt');

		// Validate data
		$this->_validate();

		// Insert image
		$result = $this->SoftwareimageModel->copyImageAndOrteOf($this->input->post('softwareimage'));

		// On error
		$result = $this->checkForErrors($result, FHCAPI_Controller::ERROR_TYPE_DB);

		// On success
		$this->terminateWithSuccess($result);
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
	 * @return object error if invalid, success otherwise
	 */
	private function _validate($current_softwareimage_id = null)
	{
		// replace empty string by null for dates
		if (isset($this->input->post('softwareimage')['verfuegbarkeit_start'])
			&& isEmptyString($this->input->post('softwareimage')['verfuegbarkeit_start'])
		)
			$this->input->post('softwareimage')['verfuegbarkeit_start'] = null;

		if (isset($this->input->post('softwareimage')['verfuegbarkeit_ende'])
			&& isEmptyString($this->input->post('softwareimage')['verfuegbarkeit_ende'])
		)
			$this->input->post('softwareimage')['verfuegbarkeit_ende'] = null;

		// Validate form data
		$verfuegbarkeit_start = isset($this->input->post('softwareimage')['verfuegbarkeit_start'])
			? $this->input->post('softwareimage')['verfuegbarkeit_start']
			: null;

		$this->load->library('form_validation');

		$this->form_validation->set_data($this->input->post('softwareimage'));
		$this->form_validation->set_rules(
			'bezeichnung',
			'Softwareimage Bezeichnung',
			array(
				'required',
				array(
					'imageVerwendet',
					function($bezeichnung) use ($current_softwareimage_id)
					{
						return $this->_checkImageBezeichnungVerwendet($bezeichnung, $current_softwareimage_id);
					}
				)
			),
			array(
				'required' => 'Pflichtfeld',
				'imageVerwendet' => 'Existiert bereits'
			)
		);
		$this->form_validation->set_rules(
			'verfuegbarkeit_ende',
			'Verfügbarkeit Ende',
			array(
				array(
					'imageVerfuegbarkeit',
					function($verfuegbarkeit_ende) use ($verfuegbarkeit_start)
					{
						return $this->_checkImageVerfuegbarkeit($verfuegbarkeit_start, $verfuegbarkeit_ende);
					}
				)
			),
			array('imageVerfuegbarkeit' => 'Datumende vor Datumstart')
		);

		// On error
		if ($this->form_validation->run() == false)
		{
			$this->terminateWithValidationErrors($this->form_validation->error_array());
		}
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Validation methods

	/**
	 * Check if Verfügbarkeit is valid.
	 * @param verfuegbarkeit_start
	 * @param verfuegbarkeit_ende
	 * @return bool valid or not
	 */
	private function _checkImageVerfuegbarkeit($verfuegbarkeit_start, $verfuegbarkeit_ende)
	{
		if (isEmptyString($verfuegbarkeit_start) || isEmptyString($verfuegbarkeit_ende)) return true;

		$start = strtotime($verfuegbarkeit_start);
		$ende = strtotime($verfuegbarkeit_ende);

		return $start && $ende && $start <= $ende;
	}

	/**
	 * Check if Image Bezeichnung is already used.
	 * @param bezeichnung
	 * @param current_softwareimage_id id of currently edited software (will be excluded)
	 * @return bool valid or not
	 */
	private function _checkImageBezeichnungVerwendet($bezeichnung, $current_softwareimage_id = null)
	{
		$params = array('bezeichnung' => $bezeichnung);
		if (is_numeric($current_softwareimage_id)) $params['softwareimage_id !='] = $current_softwareimage_id;

		// Return if Imagebezeichnung already exixts
		$result = $this->SoftwareimageModel->loadWhere($params);

		return !hasData($result);
	}
}
