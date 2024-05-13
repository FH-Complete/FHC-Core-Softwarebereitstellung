<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Software functions
 */
class Lizenzserver extends FHCAPI_Controller
{
	private $_uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'createLizenzserver' => 'admin:rw',
				'updateLizenzserver' => 'admin:rw'
			)
		);

		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwarelizenzserver_model', 'SoftwarelizenzserverModel');

		$this->_setAuthUID(); // sets property uid
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Insert new Softwarelizenzserver.
	 *
	 * @return mixed
	 */
	public function createLizenzserver()
	{
		// Validate data
		$this->_validate(true);

		// Insert Softwarelizenzserver
		$result = $this->SoftwarelizenzserverModel->insert($this->input->post('lizenzserver'));

		// On error
		$result = $this->getDataOrTerminateWithError($result, FHCAPI_Controller::ERROR_TYPE_DB);

		// On success
		$this->terminateWithSuccess($result);
	}

	/**
	 * Update Softwarelizenzserver.
	 *
	 * @return mixed
	 */
	public function updateLizenzserver()
	{
		// Validate data
		$this->_validate();

		// Update Softwarelizenzserver
		$result = $this->SoftwarelizenzserverModel->update(
			array('lizenzserver_kurzbz' => $this->input->post('lizenzserver')['lizenzserver_kurzbz']),
			$this->input->post('lizenzserver')
		);

		// On error
		$result = $this->getDataOrTerminateWithError($result, FHCAPI_Controller::ERROR_TYPE_DB);

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
	 * Performs Lizenzserver validation checks.
	 * @return object success if Lizenzserver data valid, error otherwise
	 */
	private function _validate($new = false)
	{
		if ($this->input->post('lizenzserver'))
		{
			// Validate form data
			$this->load->library('form_validation');

			$this->form_validation->set_data($this->input->post('lizenzserver'));

			$this->form_validation->set_rules(
				'lizenzserver_kurzbz',
				'Lizenzserver Kurzbezeichnung',
				array(
					'required',
					'alpha_numeric',
					array(
						'aenderungUnzulaessig',
						function ($lizenzserver_kurzbz) use ($new) {
							return $this->_checkLizenzserverKurzbzUnveraendert($lizenzserver_kurzbz, $new);
						}
					),
					array(
						'kurzbzVerwendet',
						function ($lizenzserver_kurzbz) use ($new) {
							return $this->_checkLizenzserverKurzbzExists($lizenzserver_kurzbz, $new);
						}
					)
				),
				array(
					'required' => 'Pflichtfeld',
					'alpha_numeric' => 'Nur alphanumerische Zeichen',
					'aenderungUnzulaessig' => 'Feld nicht mehr änderbar',
					'kurzbzVerwendet' => 'Existiert bereits',

				)
			);

			$this->form_validation->set_rules(
				'ipadresse',
				'IP Adresse',
				'valid_ip',
				array('valid_ip' => 'Ungültig')
			);

			// On error
			if ($this->form_validation->run() == false)
			{
				$this->terminateWithValidationErrors($this->form_validation->error_array());
			}
		}
		else
		{
			$this->terminateWithValidationErrors(['lizenzserver_kurzbz'=>'Pflichtfeld']);
		}
	}


	/**
	 * Check to avoid changing Lizenzserver Kurzbz.
	 * @param lizenzserver_kurzbz
	 * @param new
	 * @return bool
	 */
	private function _checkLizenzserverKurzbzUnveraendert($lizenzserver_kurzbz, $new)
	{
		if ($new) return true;

		$this->SoftwarelizenzserverModel->addSelect('1');
		$result = $this->SoftwarelizenzserverModel->load(array('lizenzserver_kurzbz' => $lizenzserver_kurzbz));

		if (isError($result)) return false;

		// If old one is updated/deleted, a entry with same kurzbz has to exist.
		return hasData($result);
	}

	/**
	 * Check if Lizenzserver Kurzbz already exists
	 * @param lizenzserver_kurzbz
	 * @param new if true, new Lizenzserver is inserted
	 * @return bool valid or not
	 */
	private function _checkLizenzserverKurzbzExists($lizenzserver_kurzbz, $new)
	{
		if (!$new) return true;

		$this->SoftwarelizenzserverModel->addSelect('1');
		$result = $this->SoftwarelizenzserverModel->load(array('lizenzserver_kurzbz' => $lizenzserver_kurzbz));

		if (isError($result)) return false;

		// If new Lizenzserver, there cannot be entry with same entry. If old one is updated/deleted, a entry with same kurzbz has to exist.
		return !hasData($result);
	}
}
