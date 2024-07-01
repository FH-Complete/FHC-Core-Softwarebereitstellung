<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Softwareanforderung functions
 */
class Softwareanforderung extends FHCAPI_Controller
{
	private $_uid;
	const BERECHTIGUNG_SOFTWAREANFORDERUNG = 'extension/software_bestellen';
	const STUDIENSEMESTER_DROPDOWN_STARTDATE = '2024-09-01'; // Dropdown starts from this studiensemester up to all future ones

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'saveSoftwareLv' => 'extension/software_bestellen:rw',
				'checkAndGetExistingSwLvZuordnungen' => 'extension/software_bestellen:rw',
				'autocompleteSwSuggestions' => 'extension/software_bestellen:rw',
				'autocompleteLvSuggestionsByStudsem' => 'extension/software_bestellen:rw',
				'getAktAndFutureSemester' => 'extension/software_bestellen:rw',
				'getAllSemester' => 'extension/software_bestellen:rw',
				'getLehrveranstaltungen' => 'extension/software_bestellen:rw'
			)
		);

		$this->_setAuthUID(); // sets property uid

		// Load models
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareLv_model', 'SoftwareLvModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Software_model', 'SoftwareModel');
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Save one or more Software-Lehrveranstaltung-Zuordnungen
	 */
	public function saveSoftwareLv(){

		// Check if posted SW LV Zuordnungen already exists
		$result = $this->_checkAndGetExistingSwLvZuordnungen();

		// Return if at least one SW LV Zuordnung exists
		if(count($result) > 0)
		{
			$this->terminateWithValidationErrors(['swLvExistCheck' => $this->p->t('global', 'mindEineZuorndungExistiertSchon')]);
		}

		// Ohterwise insert batch
		$result = $this->SoftwareLvModel->insertBatch($this->input->post());

		// Terminate on error
		$data = $this->getDataOrTerminateWithError($result, FHCAPI_Controller::ERROR_TYPE_DB);

		// On success
		$this->terminateWithSuccess($data);
	}

	/**
	 * Check given selections if already exist and returns existing Software-Lv-Zuordnungen.
	 */
	public function checkAndGetExistingSwLvZuordnungen(){

		// Check if posted SW LV Zuordnungen already exists
		$result = $this->_checkAndGetExistingSwLvZuordnungen();

		// On success
		$this->terminateWithSuccess($result);
	}

	/**
	 * Autocomplete Software Suggestions.
	 * @return void
	 */
	public function autocompleteSwSuggestions($query = '')
	{
		$query = strtolower(urldecode($query));

		// Get data
		$this->SoftwareModel->addOrder('software_kurzbz');
		$result = $this->SoftwareModel->loadWhere("software_kurzbz ILIKE '%".$this->SoftwareModel->escapeLike($query)."%'");

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}

	/**
	 * Autocomplete Lehrveranstaltungen Suggestions
	 * @return void
	 */
	public function autocompleteLvSuggestionsByStudsem($query = '')
	{
		$query = strtolower(urldecode($query));

		// Get OES, where user has BERECHTIGUNG_SOFTWAREANFORDERUNG
		$oe_permissions = $this->permissionlib->getOE_isEntitledFor(self::BERECHTIGUNG_SOFTWAREANFORDERUNG);
		if(!$oe_permissions) $oe_permissions = [];

		// Get results for given lv search string
		// Filter query by studiensemester and permitted oes
		$this->load->model('education/Lehrveranstaltung_model', 'LehrveranstaltungModel');
		$result = $this->LehrveranstaltungModel->getAutocompleteSuggestions(
			$query,
			$this->input->get('studiensemester_kurzbz'),
			$oe_permissions
		);

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}

	/**
	 * Get acutal and future Studiensemester
	 */
	public function getAktAndFutureSemester(){
		$this->load->model('organisation/Studiensemester_model', 'StudiensemesterModel');
		$result = $this->StudiensemesterModel->getAktAndFutureSemester();

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}

	/**
	 * Get all Studiensemester starting by config date up to all in the future
	 */
	public function getAllSemester(){
		$this->load->model('organisation/Studiensemester_model', 'StudiensemesterModel');
		$this->StudiensemesterModel->addOrder('start');
		$result = $this->StudiensemesterModel->loadWhere(array(
			'start >= ' => self::STUDIENSEMESTER_DROPDOWN_STARTDATE,
		));

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}


	/**
	 * Get all Lehrveranstaltungen of a given Studiensemester limited to
	 * the OEs for which the user has the necessary permissions
	 */
	public function getLehrveranstaltungen()
	{
		$this->addMeta('input get', $this->input->get());
		// Get OES, where user has BERECHTIGUNG_SOFTWAREANFORDERUNG
		$oe_permissions = $this->permissionlib->getOE_isEntitledFor(self::BERECHTIGUNG_SOFTWAREANFORDERUNG);
		if(!$oe_permissions) $oe_permissions = [];

		// Get all Lvs
		// Filter query by studiensemester and permitted oes
		$this->load->model('education/Lehrveranstaltung_model', 'LehrveranstaltungModel');
		$result = $this->LehrveranstaltungModel->getLvsByStudiensemesterAndOes(
			$this->input->get('studiensemester_kurzbz'),
			$oe_permissions
		);


		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->addMeta('data', $data);
		$this->terminateWithSuccess($data);
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
	 * Check if posted SW LV Zuordnungen already exists.
	 *
	 * @return array
	 */
	private function _checkAndGetExistingSwLvZuordnungen(){

		$existingZuordnungen = [];

		foreach($this->input->post() as $item)
		{
			$result = $this->SoftwareLvModel->loadWhere(array(
				'software_id' => $item['software_id'],
				'lehrveranstaltung_id' => $item['lehrveranstaltung_id'],
				'studiensemester_kurzbz' => $item['studiensemester_kurzbz'],
			));

			if (hasData($result))
			{
				$existingZuordnungen[]= getData($result)[0];
			}
		}

		return $existingZuordnungen;
	}
}
