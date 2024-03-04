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
				'getSoftwareByImage' => 'basis/mitarbeiter:r',
				'getSoftwareByOrt' => 'basis/mitarbeiter:r',
				'getOeSuggestions' => 'basis/mitarbeiter:r',
				'getStatus' => 'basis/mitarbeiter:r',
				'getLanguageIndex' => 'basis/mitarbeiter:r',
				'getLastSoftwarestatus' => 'basis/mitarbeiter:r',
				'changeSoftwarestatus' => 'basis/mitarbeiter:rw',
				'createSoftware' => 'basis/mitarbeiter:rw',
				'updateSoftware' => 'basis/mitarbeiter:rw',
				'deleteSoftware' => 'basis/mitarbeiter:rw'
			)
		);

		$this->_setAuthUID(); // sets property uid

		// load models
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
				$this->SoftwareModel->addSelect('software_id, software_kurzbz, version');
				$parentResult = $this->SoftwareModel->load($software->software_id_parent);

				if (isError($result))
				{
					$this->terminateWithJsonError('Fehler beim Holen der parent Software');
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
			$this->terminateWithJsonError('Fehler beim Holen der Software: '.getError($result));
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
			$this->terminateWithJsonError('Fehler beim Holen der zugeordneten Software: '.getError($result));
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
			$this->terminateWithJsonError('Fehler beim Suchen der Software: '.getError($result));
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
			$this->terminateWithJsonError('Fehler beim Holen des Softwarestatus: '.getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Insert Softwarestatus after it has been changed.
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
		$validationRes = $this->_validate($software);

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
		$validationRes = $this->_validate($software);

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
			),
			array(
				'required' => 'Software fehlt'
			)
		);

		// return error array if there were errors
		if ($this->form_validation->run() == false){
			return $this->outputJsonError(array_values($this->form_validation->error_array()));
		}


		// delete software
		return $this->outputJson($this->SoftwareModel->delete(array('software_id' => $softwareData['software_id'])));
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Performs software validation checks.
	 * @return object success if software data valid, error otherwise
	 */
	private function _validate($software)
	{
		// load ci validation lib
		$this->load->library('form_validation');

		// validate data with ci lib
		$this->form_validation->set_data($software);

		$this->form_validation->set_rules('softwaretyp_kurzbz', 'Softwaretyp', 'required', array('required' => 'Pflichtfeld'));
		$this->form_validation->set_rules(
			'software_kurzbz',
			'Software Kurzbezeichnung',
			array(
				'required',
				array(
					'software_exists',
					function($software_kurzbz) use ($software)
					{
						return $this->_checkSoftwareExists($software_kurzbz, $software);
					}
				)
			),
			array(
				'required' => 'Pflichtfeld',
				'software_exists' => 'Software mit dieser Version existiert bereits'
			)
		);
		$this->form_validation->set_rules(
			'software_id_parent',
			'Parent Software Id',
			array(
				array(
					'cyclic_dependency',
					function($software_id_parent) use ($software)
					{
						return $this->_checkCyclicDependency($software_id_parent, $software);
					}
				)
			),
			array('cyclic_dependency' => 'Software kann einer anderen Software nicht gleichzeitig untergeordnet und übergeordnet sein')
		);
		$this->form_validation->set_rules(
			'lizenzkosten',
			'Lizenzkosten',
			'decimal',
			array('decimal' => 'Ungültig')
		);

		// return error array if there were errors
		if ($this->form_validation->run() == false) return error($this->form_validation->error_array());

		// return success if valid
		return success();
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
		$defaultIdx = 1;

		$userLang = getUserLanguage();
		$this->SpracheModel->addSelect('sprache, index');
		$langRes = $this->SpracheModel->loadWhere(array('sprache' => $userLang));

		return hasData($langRes) ? getData($langRes)[0]->index : $defaultIdx;
	}

	/**
	 * Check if there is a software with a certain kurzbz and a version.
	 * @param software_kurzbz
	 * @param software
	 * @return object success or error
	 */
	private function _checkSoftwareExists($software_kurzbz, $software)
	{
		if (!isset($software['version'])) return true;

		$params = array(
			'software_kurzbz' => $software_kurzbz,
			'version' => $software['version']
		);

		// if update (software id is present) - check only entries other than the one updating
		if (isset($software['software_id'])) $params['software_id !='] = $software['software_id'];

		// check if there is already a software with the kurzbz and version
		$this->SoftwareModel->addSelect('1');
		$softwareRes = $this->SoftwareModel->loadWhere(
			$params
		);

		return isSuccess($softwareRes) && !hasData($softwareRes);
	}

	/**
	 * Check if there is a cyclic dependency, so a parent software is a child software at the same time.
	 * @param software_id_parent
	 * @param software
	 */
	private function _checkCyclicDependency($software_id_parent, $software)
	{
		if (isset($software_id_parent) && isset($software['software_id']))
		{
			// get parents of software parents
			$softwareRes = $this->SoftwareModel->getParents($software_id_parent);

			$swParents = getData($softwareRes);

			foreach ($swParents as $swParent)
			{
				// if one of the software parents has the software as a parent -> error
				if ($swParent->software_id == $software['software_id']) return false;
			}
		}
		return true;
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
