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
				'getLizenzserverByKurzbz' => 'basis/mitarbeiter:r'
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
	public function getLizenzserver()
	{
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
	public function createLizenzserver()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data, $new = true);

		if (isError($result)) $this->terminateWithJsonError(getError($result));

		// Return if Softwarelizenzserver already exixts
		$result = $this->SoftwarelizenzserverModel->load(array(
			'lizenzserver_kurzbz' => $data['lizenzserver']['lizenzserver_kurzbz']
		));

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

		if (!isset($data['lizenzserver_kurzbz'])) $this->terminateWithJsonError('Lizenzserver fehlt');

		// Delete Softwarelizenzserver
		$result = $this->SoftwarelizenzserverModel->delete(
			array('lizenzserver_kurzbz' => $data['lizenzserver_kurzbz']));

		return $this->outputJson($result);
	}

	/**
	 * Get Softwarelizenzserver by autofill query for lizenzserver_kurzbz.
	 */
	public function getLizenzserverByKurzbz()
	{
		$lizenzserver_kurzbz = $this->input->get('lizenzserver_kurzbz');

		$this->SoftwarelizenzserverModel->addSelect('lizenzserver_kurzbz');
		$this->SoftwarelizenzserverModel->addOrder('lizenzserver_kurzbz');
		$result = $this->SoftwarelizenzserverModel->loadWhere(
			"lizenzserver_kurzbz ILIKE '%".$this->SoftwarelizenzserverModel->escapeLike($lizenzserver_kurzbz)."%'"
		);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der Lizenzserver: '.getError($result));
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
	 * Performs Lizenzserver validation checks.
	 * @return object success if Lizenzserver data valid, error otherwise
	 */
	private function _validate($data, $new = false)
	{
		// Validate form data
		if (isset($data['lizenzserver']) && !isEmptyArray($data['lizenzserver']))
		{
			$this->load->library('form_validation');

			$this->form_validation->set_data($data['lizenzserver']);

			$this->form_validation->set_rules(
				'lizenzserver_kurzbz',
				'Lizenzserver Kurzbezeichnung',
				array(
					'required',
					'alpha_numeric',
					array(
					'kurzbzVerwendet',
						function($lizenzserver_kurzbz) use ($new)
						{
							return $this->_checkLizenzserverKurzbzExists($lizenzserver_kurzbz, $new);
						}
					)
				),
				array(
					'required' => 'Pflichtfeld',
					'alpha_numeric' => 'Sonderzeichen vorhanden',
					'kurzbzVerwendet' => 'Kann nicht geändert werden'
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
				return error($this->form_validation->error_array());
			}
		}
		else
			return error('Lizenzserver nicht übergeben');

		// On success
		return success();
	}

	/**
	 * Check if Lizenzserver Kurzbz already exists
	 * @param lizenzserver_kurzbz
	 * @param new if true, new Lizenzserver is inserted
	 * @return bool valid or not
	 */
	private function _checkLizenzserverKurzbzExists($lizenzserver_kurzbz, $new)
	{
		$this->SoftwarelizenzserverModel->addSelect('1');
		$result = $this->SoftwarelizenzserverModel->load(array('lizenzserver_kurzbz' => $lizenzserver_kurzbz));

		if (isError($result)) return false;

		// If new Lizenzserver, there cannot be entry with same entry. If old one is updated/deleted, a entry with same kurzbz has to exist.
		return ($new && !hasData($result)) || (!$new && hasData($result));
	}
}
