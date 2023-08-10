<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Software functions
 */
class Ort extends Auth_Controller
{
	private $_uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'autofill' => 'basis/mitarbeiter:r',
				'getOrteBySoftware' => 'basis/mitarbeiter:r'
			)
		);

		$this->load->model('ressource/Ort_model', 'OrtModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareimageOrt_model', 'SoftwareimageOrtModel');

		$this->_setAuthUID(); // sets property uid
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Get Ort by autofill select query.
	 */
	public function autofill()
	{
		$ort_kurzbz = $this->input->get('ort_kurzbz');
		$this->OrtModel->addOrder('ort_kurzbz');
		$result = $this->OrtModel->loadWhere("ort_kurzbz ILIKE '%".$this->OrtModel->escapeLike($ort_kurzbz)."%'");

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der Orte: '.getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Get Räume of a Software
	 */
	public function getOrteBySoftware()
	{
		$software_id = $this->input->get('software_id');
		$result = $this->SoftwareimageOrtModel->getOrteBySoftware($software_id);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der Orte: '.getError($result));
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
