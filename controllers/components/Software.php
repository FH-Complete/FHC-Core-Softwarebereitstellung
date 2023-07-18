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
				'getDataPrefill' => 'basis/mitarbeiter:r',
				'getStatus' => 'basis/mitarbeiter:r',
				'updateStatus' => 'basis/mitarbeiter:r',
				'createSoftware' => 'basis/mitarbeiter:rw'
			)
		);

		// Loads WidgetLib
		$this->load->library('WidgetLib');

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
	public function getDataPrefill()
	{
		$language_index = $this->_getLanguageIndex();
		$softwaretypRes = $this->SoftwaretypModel->getBezeichnungByLanguageIndex($language_index);

		if (isError($softwaretypRes)) $this->terminateWithJsonError('Fehler beim Holen der Softwaretypen');

		$softwaretypes = array();

		if (hasData($softwaretypRes))
		{
			foreach (getData($softwaretypRes) as $st)
			{
				$softwaretypes[$st->softwaretyp_kurzbz] = $st->bezeichnung;
			}
		}

		$dataPrefill = array(
			'softwaretyp' => $softwaretypes
		);

		$this->outputJsonSuccess($dataPrefill);
	}

	/**
	 * Get Softwarestatus
	 *
	 * @param
	 * @return object success or error
	 */
	public function getStatus()
	{
		$language_index = $this->_getLanguageIndex();
		$result = $this->SoftwarestatusModel->loadByLanguage($language_index);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der Softwarestatus');
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Update Status
	 *
	 * @param
	 * @return object success or error
	 */
	public function updateStatus()
	{
		$data = $this->getPostJson();

		$result = $this->SoftwareSoftwarestatusModel->updateStatus($data->software_ids, $data->softwarestatus_kurzbz);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Ändern des Softwarestatus');
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Creates a software after performing necessary checks.
	 */
	public function createSoftware()
	{
		$this->load->library('form_validation');

		$softwareData = json_decode($this->input->raw_input_stream, true);
		//var_dump($softwareData);

		$this->form_validation->set_data($softwareData);

		$this->form_validation->set_rules('software_kurzbz', 'Software Kurzbezeichnung', 'required', array('required' => '%s fehlt'));
		$this->form_validation->set_rules('softwaretyp_kurzbz', 'Softwaretyp', 'required', array('required' => '%s fehlt'));

		if ($this->form_validation->run() == false)
		{
			return $this->outputJsonError($this->form_validation->error_array());
		}
		else
		{
			if (isset($softwareData['version']))
			{
				// check if there is already a software with the kurzbz and version
				$this->SoftwareModel->addSelect('1');
				$softwareRes = $this->SoftwareModel->loadWhere(array(
					'software_kurzbz' => $softwareData['software_kurzbz'],
					'version' => $softwareData['version'])
				);

				if (isError($softwareRes) || hasData($softwareRes))
					return $this->outputJsonError(array('Software Kurzbezeichnung mit dieser Version existiert bereits'));
			}

			$softwareData['insertvon'] = $this->_uid;

			return $this->outputJson($this->SoftwareModel->insert($softwareData));
		}
	}

	/**
	 * Updates a software after performing necessary checks.
	 */
	public function updateSoftware()
	{
		return $this->outputJsonSuccess(true);
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
