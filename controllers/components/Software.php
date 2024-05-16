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
				'index' => 'admin:rw',
				'getSoftwareMetadata' => 'admin:rw',
				'getSoftware' => 'admin:rw',
				'getSoftwareByKurzbz' => 'admin:rw',
				'getSoftwareByImage' => 'admin:rw',
				'getSoftwareByOrt' => 'admin:rw',
				'getOeSuggestions' => 'admin:rw',
				'getStatus' => 'admin:rw',
				'getLanguageIndex' => 'admin:rw',
				'getLastSoftwarestatus' => 'admin:rw',
				'changeSoftwarestatus' => 'admin:rw',
				'deleteSoftware' => 'admin:rw',
				'getSoftwarelizenztypen' => 'admin:rw'
			)
		);

		$this->_setAuthUID(); // sets property uid

		// load models
		$this->load->model('system/Sprache_model', 'SpracheModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Software_model', 'SoftwareModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwaretyp_model', 'SoftwaretypModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwarestatus_model', 'SoftwarestatusModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareSoftwarestatus_model', 'SoftwareSoftwarestatusModel');

		// Load libraries
		$this->load->library('extensions/FHC-Core-Softwarebereitstellung/SoftwareLib');
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

		if (isError($softwaretypRes)) $this->terminateWithJsonError(getError($softwaretypRes));

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
			$this->terminateWithJsonError(getError($result));
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
			$this->terminateWithJsonError(getError($result));
		}

		if (hasData($result))
		{
			$software = getData($result)[0];
			$extendedSoftware['software'] = $software;

			if (isset($software->software_id_parent))
			{
				// get parent
				$this->SoftwareModel->addSelect('software_id, software_kurzbz, version');
				$parentResult = $this->SoftwareModel->load($software->software_id_parent);

				if (isError($result))
				{
					$this->terminateWithJsonError(getError($result));
				}
				if (hasData($parentResult)) $extendedSoftware['software_parent'] = getData($parentResult)[0];
			}
		}

		$this->outputJsonSuccess($extendedSoftware);
	}

	/**
	 * Get Software by software_kurzbz
	 */
	public function getSoftwareByKurzbz()
	{
		$software_kurzbz = $this->input->get('software_kurzbz');

		$this->SoftwareModel->addSelect('software_id, software_kurzbz, version');
		$this->SoftwareModel->addOrder('software_kurzbz');
		$this->SoftwareModel->addOrder('version', 'DESC');
		$this->SoftwareModel->addOrder('software_id', 'DESC');
		$result = $this->SoftwareModel->loadWhere("software_kurzbz ILIKE '%".$this->SoftwareModel->escapeLike($software_kurzbz)."%'");

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Get Software by Image
	 */
	public function getSoftwareByImage()
	{
		$softwareimage_id = $this->input->get('softwareimage_id');
		$language_index = $this->_getLanguageIndex();

		$result = $this->SoftwareModel->getSoftwareByImage($softwareimage_id, $language_index);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Get Software by Ort.
	 */
	public function getSoftwareByOrt()
	{
		$ort_kurzbz = $this->input->get('ort_kurzbz');
		$language_index = $this->_getLanguageIndex();

		$result = $this->SoftwareModel->getSoftwareByOrt($ort_kurzbz, $language_index);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Get OE suggestions by query string. Use it for autoselect dropdowns.
	 */
	public function getOeSuggestions()
	{
		$eventQuery = $this->input->get('eventQuery');

		// load models
		$this->load->model('organisation/Organisationseinheit_model', 'OrganisationseinheitModel');

		$result = $this->OrganisationseinheitModel->getAutocompleteSuggestions($eventQuery);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
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
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 *
	 * @param
	 * @return object success or error
	 */
	public function getLanguageIndex()
	{
		$this->outputJsonSuccess($this->_getLanguageIndex());
	}

	/**
	 * Get last Softwarestatus of given Software.
	 */
	public function getLastSoftwarestatus()
	{
		$software_id = $this->input->get('software_id');

		$result = $this->SoftwareSoftwarestatusModel->getLastSoftwarestatus($software_id);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Insert Softwarestatus after it has been changed.
	 */
	public function changeSoftwarestatus()
	{
		$data = $this->getPostJson();

		// Change status of given software ids
		$result = $this->SoftwareSoftwarestatusModel->changeSoftwarestatus($data->software_ids, $data->softwarestatus_kurzbz);

		// On error
		if (isError($result)) $this->terminateWithJsonError(getError($result));

		// For certain status...
		$parentArray = [];

		if ($data->softwarestatus_kurzbz === 'endoflife' || $data->softwarestatus_kurzbz === 'nichtverfuegbar')
		{
			//...transfer status also to any child software, if it exists
			$result = $this->softwarelib->changeChildrenSoftwarestatus($data->software_ids, $data->softwarestatus_kurzbz);

			if (hasData($result))
			{
				$parentArray = array_keys(getData($result));
			}

			if (isError($result)) $this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(['parentArray' => $parentArray]);
	}

	/**
	 * Deletes a software after performing necessary checks.
	 */
	public function deleteSoftware()
	{
		$this->load->library('form_validation');

		$softwareData = json_decode($this->input->raw_input_stream, true);

		$this->form_validation->set_data($softwareData);

		$this->form_validation->set_rules(
			'software_id',
			'Software Id',
			array(
				'required',
				array(
					'dependencies',
					function($software_id)
					{
						return $this->_checkSoftwareDependencies($software_id);
					}
				)
			)
		);

		// return error array if there were errors
		if ($this->form_validation->run() == false){
			return $this->outputJsonError(array_values($this->form_validation->error_array()));
		}


		// delete software
		return $this->outputJson($this->SoftwareModel->delete(array('software_id' => $softwareData['software_id'])));
	}

	/* Get all Softwarelizenztypen */
	public function getSoftwarelizenztypen(){
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwarelizenztyp_model', 'SoftwarelizenztypModel');
		$result = $this->SoftwarelizenztypModel->load();

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

	/**
	 * Gets language index of currently logged in user.
	 * @return int (the index, start at 1)
	 */
	private function _getLanguageIndex()
	{
		$defaultIdx = 1;

		$userLang = getUserLanguage();
		$this->SpracheModel->addSelect('sprache, index');
		$langRes = $this->SpracheModel->loadWhere(array('sprache' => $userLang));

		return hasData($langRes) ? getData($langRes)[0]->index : $defaultIdx;
	}

	/**
	 * Check dependencies of a software.
	 * @param software_id
	 * @return bool true if there are no dependencies, false if there is at least one dependency
	 */
	private function _checkSoftwareDependencies($software_id)
	{
		$dependenciesRes = $this->SoftwareModel->getSoftwareDependencies($software_id);
		$dependantFields = array();

		// software should exist
		if (!hasData($dependenciesRes)) return false;

		$dependencies = getData($dependenciesRes);

		foreach ($dependencies as $dependency)
		{
			foreach ($dependency as $field => $value)
			{
				if (!is_null($value) && !in_array($field, $dependantFields)) $dependantFields[] = $field;
			}
		}

		// check fails if there are dependencies
		if (!isEmptyArray($dependantFields))
		{
			$this->form_validation->set_message('dependencies', 'Software hat Abhängigkeiten: '.implode(', ', $dependantFields));
			return false;
		}

		return true;
	}
}
