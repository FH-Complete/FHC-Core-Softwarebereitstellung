<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Software functions
 */
class Lizenzserver extends Auth_Controller
{
	private $_uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'getLizenzserver' => 'basis/mitarbeiter:r',
				'createLizenzserver' => 'basis/mitarbeiter:r',
				'updateLizenzserver' => 'basis/mitarbeiter:r',
				'deleteLizenzserver' => 'basis/mitarbeiter:r',
			)
		);

		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwarelizenzserver_model', 'SoftwarelizenzserverModel');

		$this->_setAuthUID(); // sets property uid
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Get Softwarelizenzserver.
	 */
	public function getLizenzserver(){
		$lizenzserver_kurzbz = $this->input->get('lizenzserver_kurzbz');

		$result = $this->SoftwarelizenzserverModel->load(array('lizenzserver_kurzbz' => $lizenzserver_kurzbz));

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen des Lizenzservers');
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Insert new Softwarelizenzserver.
	 *
	 * @return mixed
	 */
	public function createLizenzserver(){
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data);

		if (isError($result)) $this->terminateWithJsonError(getError($result));

		// Return if Softwarelizenzserver already exixts
		$result = $this->SoftwarelizenzserverModel->load(array(
			'lizenzserver_kurzbz' => $data['lizenzserver']['lizenzserver_kurzbz']
		));

		if (hasData($result))
		{
			$this->terminateWithJsonError('Kurzbezeichnung wird bereits verwendet. Wählen Sie eine neue Kurzbezeichnung.');
		}

		// Insert Softwarelizenzserver
		if (!$result = $this->SoftwarelizenzserverModel->insert($data['lizenzserver']))
		{
			$this->terminateWithJsonError('Fehler beim Anlegen des Softwarelizenzservers.');
		}

		// On success
		return $this->outputJson($result);
	}

	/**
	 * Update Softwarelizenzserver.
	 *
	 * @return mixed
	 */
	public function updateLizenzserver()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		// Update Softwarelizenzserver
		$result = $this->SoftwarelizenzserverModel->update(
			array('lizenzserver_kurzbz' => $data['lizenzserver']['lizenzserver_kurzbz']),
			$data['lizenzserver']
		);

		return $this->outputJson($result);
	}

	/**
	 * Delete Softwarelizenzserver.
	 */
	public function deleteLizenzserver()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		// Delete Softwarelizenzserver
		$result = $this->SoftwarelizenzserverModel->delete(
			array('lizenzserver_kurzbz' =>$data['lizenzserver_kurzbz']));

		return $this->outputJson($result);
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

	private function _validate($data)
	{
		// Validate form data
		if (isset($data['lizenzserver']) && is_object($data['lizenzserver']))
		{
			$this->load->library('form_validation');

			$this->form_validation->set_data($data['lizenzserver']);
			$this->form_validation->set_rules('lizenzserver_kurzbz', 'Lizenzserver Kurzbezeichnung', 'required', array('required' => '%s fehlt'));

			// On error
			if ($this->form_validation->run() == false)
			{
				return error($this->form_validation->error_array());
			}
		}

		// On success
		return success();
	}
}
