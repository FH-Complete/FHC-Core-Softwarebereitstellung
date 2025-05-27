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
				'getLizenzserver' => 'extension/software_verwalten:rw',
				'deleteLizenzserver' => 'extension/software_verwalten:rw',
				'getLizenzserverSuggestions' => 'extension/software_verwalten:rw'
			)
		);

		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwarelizenzserver_model', 'SoftwarelizenzserverModel');

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
	 * Get Softwarelizenzserver.
	 */
	public function getLizenzserver()
	{
		$lizenzserver_kurzbz = $this->input->get('lizenzserver_kurzbz');

		$result = $this->SoftwarelizenzserverModel->load(array('lizenzserver_kurzbz' => $lizenzserver_kurzbz));

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Delete Softwarelizenzserver.
	 */
	public function deleteLizenzserver()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		if (!isset($data['lizenzserver_kurzbz'])) $this->terminateWithJsonError($this->p->t('ui', 'errorFelderFehlen'));

		// Exit if Lizenzserver has zugeordnete Software
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Software_model', 'SoftwareModel');

		$result = $this->SoftwareModel->loadWhere(['lizenzserver_kurzbz' => $data['lizenzserver_kurzbz']]);

		if (hasData($result))
		{
			$this->terminateWithJsonError($this->p->t('global', 'loeschenNichtMoeglichSoftwareBereitsZugeordnet'));
		}

		// Delete Softwarelizenzserver
		$result = $this->SoftwarelizenzserverModel->delete(
			array('lizenzserver_kurzbz' => $data['lizenzserver_kurzbz']));

		return $this->outputJson($result);
	}

	/**
	 * Get Softwarelizenzserver by autofill query for lizenzserver_kurzbz.
	 */
	public function getLizenzserverSuggestions()
	{
		$query = $this->input->get('query');

		$this->SoftwarelizenzserverModel->addSelect('lizenzserver_kurzbz');
		$this->SoftwarelizenzserverModel->addOrder('lizenzserver_kurzbz');
		$result = $this->SoftwarelizenzserverModel->loadWhere(
			"lizenzserver_kurzbz ILIKE '%".$this->SoftwarelizenzserverModel->escapeLike($query)."%'"
		);

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
