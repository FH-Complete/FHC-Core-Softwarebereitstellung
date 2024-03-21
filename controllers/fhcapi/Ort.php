<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

class Ort extends FHCAPI_Controller
{
	private $_uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'insertImageort' => 'admin:rw',
				'updateImageort' => 'admin:rw',
			)
		);

		$this->load->model('ressource/Ort_model', 'OrtModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareimageOrt_model', 'SoftwareimageOrtModel');

		$this->_setAuthUID(); // sets property uid
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Insert new Softwareimageorte.
	 * Handles array of Orte with same softwareimage_id, verfuegbarkeit_start and verfuegbarkeit_ende.
	 *
	 * @return mixed
	 */
	public function insertImageort()
	{
		// Validate data
		$this->_validate(true);

		foreach ($this->input->post('ort_kurzbz') as $ort_kurzbz)
		{
			// Update image
			$result = $this->SoftwareimageOrtModel->insert(
				array(
					'softwareimage_id' => $this->input->post('softwareimage_id'),
					'ort_kurzbz' => $ort_kurzbz,
					'verfuegbarkeit_start' => $this->input->post('verfuegbarkeit_start'),
					'verfuegbarkeit_ende' => $this->input->post('verfuegbarkeit_ende')
				)
			);

		// On error
		$this->checkForErrors($result, FHCAPI_Controller::ERROR_TYPE_DB);
		}

		// On success
		$this->terminateWithSuccess();
	}

	/**
	 * Update Softwareimageorte.
	 * Handles array of Softwareimageorte, updates with same verfuegbarkeit_start and same verfuegbarkeit_ende.
	 *
	 * @return mixed
	 */
	public function updateImageort()
	{
		// Validate data
		$this->_validate();

		foreach ($this->input->post('softwareimageorte_id') as $softwareimageort_id)
		{
			// Update image
			$result = $this->SoftwareimageOrtModel->update(
				array(
					'softwareimageort_id' => $softwareimageort_id,
				),
				array(
					'verfuegbarkeit_start' => $this->input->post('verfuegbarkeit_start'),
					'verfuegbarkeit_ende' => $this->input->post('verfuegbarkeit_ende')
				)
			);

			// On error
			$this->checkForErrors($result, FHCAPI_Controller::ERROR_TYPE_DB);
		}

		// On success
		$this->terminateWithSuccess();
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
	private function _validate($new = false)
	{
		$data = $this->input->post();
		$this->load->library('form_validation');

		$verfuegbarkeit_start = isset($data['verfuegbarkeit_start']) ? $data['verfuegbarkeit_start'] : null;

		// reform data because ci validator can't handle arrays'
		$ortFieldname = $new ? 'ort_kurzbz' : 'softwareimageorte_id';
		$data[$ortFieldname] = isset($data[$ortFieldname]) && !isEmptyArray($data[$ortFieldname]) ? true : null;

		// Validate form data
		$this->form_validation->set_data($data);
		$this->form_validation->set_rules(
			$ortFieldname,
			'Orte',
			'required',
			array('required' => 'Pflichtfeld')
		);
		$this->form_validation->set_rules(
			'verfuegbarkeit_ende',
			'Verfügbarkeit Ende',
			array(
				array(
					'orteVerfuegbarkeit',
					function($verfuegbarkeit_ende) use ($verfuegbarkeit_start)
					{
						return $this->_checkOrteVerfuegbarkeit($verfuegbarkeit_start, $verfuegbarkeit_ende);
					}
				)
			),
			array('orteVerfuegbarkeit' => 'Datumende vor Datumstart')
		);

		// On error
		if ($this->form_validation->run() == false)
		{
			$this->terminateWithValidationErrors($this->form_validation->error_array());
		}
	}

	/**
	 * Check if Verfügbarkeit is valid.
	 * @param verfuegbarkeit_start
	 * @param verfuegbarkeit_ende
	 * @return bool valid or not
	 */
	private function _checkOrteVerfuegbarkeit($verfuegbarkeit_start, $verfuegbarkeit_ende)
	{
		if (isEmptyString($verfuegbarkeit_start) || isEmptyString($verfuegbarkeit_ende)) return true;

		$start = strtotime($verfuegbarkeit_start);
		$ende = strtotime($verfuegbarkeit_ende);

		return $start && $ende && $start <= $ende;
	}
}
