<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Software functions
 */
class Software extends Auth_Controller
{
	private $_uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'index' => 'basis/mitarbeiter:r',
				'getSoftwareMetadata' => 'basis/mitarbeiter:r',
				'getSoftware' => 'basis/mitarbeiter:r',
				'getSoftwareByKurzbz' => 'basis/mitarbeiter:r',
				'getStatus' => 'basis/mitarbeiter:r',
				'getLastSoftwarestatus' => 'basis/mitarbeiter:r',
				'changeSoftwarestatus' => 'basis/mitarbeiter:rw',
				'createSoftware' => 'basis/mitarbeiter:rw',
				'updateSoftware' => 'basis/mitarbeiter:rw',
				'deleteSoftware' => 'basis/mitarbeiter:rw'
			)
		);

		$this->load->model('system/Sprache_model', 'SpracheModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Software_model', 'SoftwareModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwaretyp_model', 'SoftwaretypModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwarestatus_model', 'SoftwarestatusModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareSoftwarestatus_model', 'SoftwareSoftwarestatusModel');


		// Loads phrases system
		//~ $this->loadPhrases(
			//~ array(
				//~ 'global',
				//~ 'ui',
				//~ 'filter'
			//~ )
		//~ );

		$this->_setAuthUID(); // sets property uid
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 *
	 * @param
	 * @return object success or error
	 */
	public function getSoftwareMetadata()
	{
		$language_index = $this->_getLanguageIndex();
		$softwaretypRes = $this->SoftwaretypModel->getBezeichnungByLanguageIndex($language_index);

		if (isError($softwaretypRes)) $this->terminateWithJsonError('Fehler beim Holen der Softwaretypen: '.getError($result));

		$softwaretypes = array();

		if (hasData($softwaretypRes))
		{
			foreach (getData($softwaretypRes) as $st)
			{
				$softwaretypes[$st->softwaretyp_kurzbz] = $st->bezeichnung;
			}
		}

		// Get all Softwarestatus
		$softwarestatus_arr = array();

		$result = $this->SoftwarestatusModel->loadByLanguage($language_index);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der Softwarestatus: '.getError($result));
		}

		if (hasData($result))
		{
			foreach (getData($result) as $softwarestatus)
			{
				$softwarestatus_arr[$softwarestatus->softwarestatus_kurzbz] = $softwarestatus->bezeichnung;
			}
		}

		$softwareMetadata = array(
			'softwaretyp' => $softwaretypes,
			'softwarestatus' => $softwarestatus_arr
		);

		$this->outputJsonSuccess($softwareMetadata);
	}

	/**
	 * Get Software
	 */
	public function getSoftware()
	{
		$software_id = $this->input->get('software_id');

		$extendedSoftware = array();

		$result = $this->SoftwareModel->load($software_id);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der Software');
		}

		if (hasData($result))
		{
			$software = getData($result)[0];
			$extendedSoftware['software'] = $software;

			if (isset($software->software_id_parent))
			{
				// get parent
				$this->SoftwareModel->addSelect('software_kurzbz');
				$parentResult = $this->SoftwareModel->load($software->software_id_parent);

				if (isError($result))
				{
					$this->terminateWithJsonError('Fehler beim Holen der parent Software');
				}
				if (hasData($parentResult)) $extendedSoftware['software_kurzbz_parent'] = getData($parentResult)[0]->software_kurzbz;
			}
		}

		$this->outputJsonSuccess($extendedSoftware);
	}

	/**
	 * Get Software by software_kurzbz.
	 */
	public function getSoftwareByKurzbz()
	{
		$software_kurzbz = $this->input->get('software_kurzbz');
		$this->SoftwareModel->addSelect("software_id, software_kurzbz");
		$result = $this->SoftwareModel->loadWhere("software_kurzbz ILIKE '%".$this->SoftwareModel->escapeLike($software_kurzbz)."%'");

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der Software: '.getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Get Softwarestatus.
	 */
	public function getStatus()
	{
		$language_index = $this->_getLanguageIndex();
		$result = $this->SoftwarestatusModel->loadByLanguage($language_index);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der Softwarestatus: '.getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Get last Softwarestatus of given Software.
	 *
	 * @param $software_id integer
	 */
	public function getLastSoftwarestatus($software_id)
	{
		$result = $this->SoftwareSoftwarestatusModel->getLastSoftwarestatus($software_id);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen des Softwarestatus: '.getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Insert Softwarestatus after it has been changed.
	 *
	 * @param
	 * @return object success or error
	 */
	public function changeSoftwarestatus()
	{
		$data = $this->getPostJson();

		$result = $this->SoftwareSoftwarestatusModel->changeSoftwarestatus($data->software_ids, $data->softwarestatus_kurzbz);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Ändern des Softwarestatus: '.getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Creates a software after performing necessary checks.
	 */
	public function createSoftware()
	{
		$data = json_decode($this->input->raw_input_stream, true);
		$software = $data['software'];
		$softwarestatus = $data['softwarestatus'];
		$softwareImageIds = $data['softwareImageIds'];

		// validate data
		$validationRes = $this->_validateSoftware($software);

		// return error if invalid
		if (isError($validationRes)) return $this->outputJsonError(getError($validationRes));

		$software['insertvon'] = $this->_uid;

		// Insert Software and Softwarestatus
		$result = $this->SoftwareModel->insertSoftwarePlus(
			$software,
			$softwarestatus['softwarestatus_kurzbz'],
			$softwareImageIds
		);

		return $this->outputJson($result);
	}

	/**
	 * Updates a software after performing necessary checks.
	 */
	public function updateSoftware()
	{
		$data = json_decode($this->input->raw_input_stream, true);
		$software = $data['software'];
		$softwarestatus = $data['softwarestatus'];
		$softwareImageIds = $data['softwareImageIds'];

		// validate data
		$validationRes = $this->_validateSoftware($software);

		// return error if invalid
		if (isError($validationRes)) return $this->outputJsonError(getError($validationRes));

		// Update Software and inserts newer Softwarestatus
		$result = $this->SoftwareModel->updateSoftwarePlus(
			$software,
			$softwarestatus['softwarestatus_kurzbz'],
			$softwareImageIds
		);

		return $this->outputJson($result);
	}

	/**
	 * Deletes a software after performing necessary checks.
	 */
	public function deleteSoftware()
	{
		$this->load->library('form_validation');

		$softwareData = json_decode($this->input->raw_input_stream, true);

		// validate data
		$this->form_validation->set_data($softwareData);

		$this->form_validation->set_rules(
			'software_id',
			'Software ID',
			'required|numeric',
			array('required' => '%s fehlt', 'numeric' => '%s ungültig')
		);

		if ($this->form_validation->run() == false)
			return $this->outputJsonError($this->form_validation->error_array());

		// delete software
		return $this->outputJson($this->SoftwareModel->delete(array('software_id' => $softwareData['software_id'])));
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Performs software validation checks.
	 * @return object success if software data valid, error otherwise
	 */
	private function _validateSoftware($software)
	{
		// load ci validation lib
		$this->load->library('form_validation');

		// any errors will be stored here
		$errorMessages = array();

		// validate data with ci lib
		$this->form_validation->set_data($software);

		$this->form_validation->set_rules('software_kurzbz', 'Software Kurzbezeichnung', 'required', array('required' => '%s fehlt'));
		$this->form_validation->set_rules('softwaretyp_kurzbz', 'Softwaretyp', 'required', array('required' => '%s fehlt'));

		if ($this->form_validation->run() == false) $errorMessages = array_merge($errorMessages, $this->form_validation->error_array());

		if (isset($software['version']))
		{
			$params = array(
				'software_kurzbz' => $software['software_kurzbz'],
				'version' => $software['version']
			);

			// if update, software id is present - check only entries other than the one updating
			if (isset($software['software_id'])) $params['software_id !='] = $software['software_id'];

			// check if there is already a software with the kurzbz and version
			$this->SoftwareModel->addSelect('1');
			$softwareRes = $this->SoftwareModel->loadWhere(
				$params
			);

			if (isError($softwareRes) || hasData($softwareRes)) $errorMessages[] = 'Software Kurzbezeichnung mit dieser Version existiert bereits';
		}

		// return error array if there were errors
		if (!isEmptyArray($errorMessages)) return error($errorMessages);

		// return success if valid
		return success($errorMessages);
	}

	/**
	 * Retrieve the UID of the logged user and checks if it is valid
	 */
	private function _setAuthUID()
	{
		$this->_uid = getAuthUID();

		if (!$this->_uid) show_error('User authentification failed');
	}

	/**
	 * Gets language index of currently logged in user.
	 * @return int (the index, start at 1)
	 */
	private function _getLanguageIndex()
	{
		$idx = 1;
		$this->SpracheModel->addSelect('sprache, index');
		$langRes = $this->SpracheModel->load();

		if (hasData($langRes))
		{
			$userLang = getUserLanguage();
			$lang = getData($langRes);

			foreach ($lang as $l)
			{
				if ($l->sprache == $userLang) $idx = $l->index;
			}
		}

		return $idx;
	}
}
