<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Softwareanforderung functions
 */
class Softwareanforderung extends FHCAPI_Controller
{
	private $_uid;
	const BERECHTIGUNG_SOFTWAREANFORDERUNG = 'extension/software_bestellen';
	const NOT_ZUORDENBARE_STATI = ['endoflife', 'nichtverfuegbar'];

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'getSwLvsRequestedByLv' => 'extension/software_bestellen:rw',
				'getSwLvsRequestedByTpl' => 'extension/software_bestellen:rw',
				'updateSwLvs' => 'extension/software_bestellen:rw',
				'deleteSwLvs' => 'extension/software_bestellen:rw',
				'checkAndGetExistingSwLvs' => 'extension/software_bestellen:rw',
				'getLvsByStgOe' => 'extension/software_bestellen:rw',
				'getLvsForTplRequests' => 'extension/software_bestellen:rw',
				'saveSwRequestByLvs' => 'extension/software_bestellen:rw',
				'saveSwRequestByTpl' => 'extension/software_bestellen:rw',
				'updateLizenzanzahl' => 'extension/software_bestellen:rw',
				'autocompleteSwSuggestions' => 'extension/software_bestellen:rw',
				'autocompleteLvSuggestionsByStudsem' => 'extension/software_bestellen:rw',
				'getAktAndFutureSemester' => 'extension/software_bestellen:rw',
				'getVorrueckStudiensemester' => 'extension/software_bestellen:rw',
				'getOtoboUrl' => 'extension/software_bestellen:rw',
				'checkIfBearbeitungIsGesperrt' => 'extension/software_bestellen:rw'
			)
		);

		$this->_setAuthUID(); // sets property uid

		// Load models
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareLv_model', 'SoftwareLvModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Software_model', 'SoftwareModel');
		$this->load->model('education/Lehrveranstaltung_model', 'LehrveranstaltungModel');

		// Load config
		$this->load->config('extensions/FHC-Core-Softwarebereitstellung/softwarebereitstellung');

		// Load libraries
		$this->load->library('extensions/FHC-Core-Softwarebereitstellung/SoftwareLib');

		// Load language phrases
		$this->loadPhrases([
			'ui',
			'global'
		]);
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Get all Software-Lehrveranstaltung-Zuordnungen of selected Studiensemester and Organisationseinheiten
	 * the user has permission to view. Permission is checked against lv oes.
	 */
	public function getSwLvsRequestedByTpl(){
		// Get OES, where user has BERECHTIGUNG_SOFTWAREANFORDERUNG
		$entitledOes = $this->permissionlib->getOE_isEntitledFor(self::BERECHTIGUNG_SOFTWAREANFORDERUNG);
		if(!$entitledOes) $entitledOes = [];

		// Get all Software-Lehrveranstaltung-Zuordnungen
		$result = $this->SoftwareLvModel->getSwLvs(
			$this->input->get('studiensemester_kurzbz'),
			$entitledOes,
			null,
			true
		);

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}

	/**
	 * Get all Software-Lehrveranstaltung-Zuordnungen of selected Studiensemester and Organisationseinheiten
	 * the user has permission to view. Permission is checked against lv's stg oes.
	 */
	public function getSwLvsRequestedByLv(){
		// Get OES, where user has BERECHTIGUNG_SOFTWAREANFORDERUNG
		$entitledOes = $this->permissionlib->getOE_isEntitledFor(self::BERECHTIGUNG_SOFTWAREANFORDERUNG);
		if(!$entitledOes) $entitledOes = [];

		// Get all Software-Lehrveranstaltung-Zuordnungen
		$result = $this->SoftwareLvModel->getSwLvs(
			$this->input->get('studiensemester_kurzbz'),
			null,
			$entitledOes,
			false
		);

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}

	/**
	 * Get all Lehrveranstaltungen of a given Studiensemester limited to
	 * the OEs for which the user has the necessary permissions
	 */
	public function getLvsByStgOe()
	{
		// Get OES, where user has BERECHTIGUNG_SOFTWAREANFORDERUNG
		$entitledOes = $this->permissionlib->getOE_isEntitledFor(self::BERECHTIGUNG_SOFTWAREANFORDERUNG);
		if(!$entitledOes) $entitledOes = [];

		// Get all Lvs
		// Filter query by studiensemester and permitted oes
		$result = $this->LehrveranstaltungModel->getLvs(
			$this->input->get('studiensemester_kurzbz'),
			null,
			$entitledOes,	// check against stg oes
			$this->input->get('lv_ids') ?  $this->input->get('lv_ids') : null  // Set to null if not provided
		);

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}

	/**
	 * Get all Lehrveranstaltungen of a given Studiensemester limited to
	 * the OEs for which the user has the necessary permissions
	 */
	public function getLvsForTplRequests()
	{
		// Get OES, where user has BERECHTIGUNG_SOFTWAREANFORDERUNG
		$entitledOes = $this->permissionlib->getOE_isEntitledFor(self::BERECHTIGUNG_SOFTWAREANFORDERUNG);
		if(!$entitledOes) $entitledOes = [];

		// Get all Lvs
		// Filter query by studiensemester and permitted oes
		$result = $this->LehrveranstaltungModel->getTemplateLvTree(
			$this->input->get('studiensemester_kurzbz'),
			$entitledOes
		);

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}

	/**
	 * Save one or more Software-Lehrveranstaltung-Zuordnungen
	 */
	public function saveSwRequestByLvs(){

		$this->_validateLizenzanzahl($this->input->post());

		// Check if posted SW LV Zuordnungen already exists
		$result = $this->_checkAndGetExistingSwLvs($this->input->post());

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
	 * Save one or more LV-Template-SW Zuordnungen and also their Lehrveranstaltungen-SW-Zuordnungen.
	 * LV-Templates are saved with lizenzanzahl null.
	 */
	public function saveSwRequestByTpl(){

		$this->_validateLizenzanzahl($this->input->post('postData'));

		$lehrveranstaltung_template_id =  $this->input->post('template')['lehrveranstaltung_id'];

		// Check if posted SW LV Zuordnungen already exists
		$result = $this->_checkAndGetExistingSwLvs($this->input->post('postData'));

		// Return if at least one SW LV Zuordnung exists
		if(count($result) > 0)
		{
			$this->terminateWithValidationErrors(['swLvExistCheck' => $this->p->t('global', 'mindEineZuorndungExistiertSchon')]);
		}

		// Create LV-Template-SW Zuordnung for each SW in postData
		$data = [];
		$uniqueSoftwareIds = [];  // To track unique software IDs
		foreach ($this->input->post('postData') as $post) {
			// Add post
			$data[] = $post;

			// If new software_id found in post
			if (!in_array($post['software_id'], $uniqueSoftwareIds)) {

				// Add software_id to the unique list
				$uniqueSoftwareIds[] = $post['software_id'];

				// Create a new object for the LV-Template-SW Zuordnung
				$templateData = [
					'software_id' => $post['software_id'],
					'lehrveranstaltung_id' => $lehrveranstaltung_template_id,
					'studiensemester_kurzbz' => $post['studiensemester_kurzbz'], // Keep the same semester
					'lizenzanzahl' => null  // Hardcoded to null
				];

				// Add the new object to the data array
				$data[] = $templateData;
			}
		}

		// Insert LV-SW-Zuordnungen
		$result = $this->SoftwareLvModel->insertBatch($data);


		// Terminate on error
		$data = $this->getDataOrTerminateWithError($result, FHCAPI_Controller::ERROR_TYPE_DB);

		// On success
		$this->terminateWithSuccess($data);
	}

	/**
	 * Update one or more Software-Lehrveranstaltung-Zuordnungen
	 */
	public function updateLizenzanzahl()
	{
		$this->_validateLizenzanzahl($this->input->post());

		// Update batch
		$result = $this->SoftwareLvModel->updateBatch($this->input->post());

		// On error
		$this->getDataOrTerminateWithError($result, FHCAPI_Controller::ERROR_TYPE_DB);

		// On success
		$this->terminateWithSuccess();
	}

	/**
	 * Updates changed Software for given Template Lvs or standalone LV after some checks:
	 * No update if Bearbeitung is gesperrt.
	 * No update if SW is already assigend.
	 * If given software_lv_id is a template, all zugehoerige Lvs are retrieved and SW is changed for all.
	 * If given software_lv_id is standalone lv, SW is changed for this lv.
	 */
	public function updateSwLvs(){
		$software_lv_id = $this->input->post('software_lv_id');
		$updated_software_id = $this->input->post('software_id');
		$studiensemester_kurzbz = $this->input->post('studiensemester_kurzbz');

		// Check if deletion is allowed
		if ($this->softwarelib->checkIfBearbeitungIsGesperrt($studiensemester_kurzbz)) exit;

		// Get Lehrveranstaltung and Software by software_lv_id
		$this->SoftwareLvModel->addSelect('lehrveranstaltung_id, software_id');
		$result = $this->SoftwareLvModel->load($software_lv_id);

		if (hasData($result))
		{
			$lehrveranstaltung_id = getData($result)[0]->lehrveranstaltung_id;
			$software_id = getData($result)[0]->software_id;
		}

		// Check if posted SW LV Zuordnungen already exists
		$result = $this->_checkAndGetExistingSwLvs([
			[
				'lehrveranstaltung_id' => $lehrveranstaltung_id,
				'software_id' => $updated_software_id,
				'studiensemester_kurzbz' => $studiensemester_kurzbz
			]
		]);

		// Return if at least one SW LV Zuordnung exists
		if(count($result) > 0)
		{
			$this->terminateWithValidationErrors(['selectedSw' => $this->p->t('global', 'zuordnungExistiertBereits')]);
		}

		// Check if Lehrveranstaltung is a Quellkurs
		$result = $this->LehrveranstaltungModel->checkIsTemplate($lehrveranstaltung_id);
		$isTemplate = $this->getDataOrTerminateWithError($result);

		$updateSoftwareLvIds = [];

		// If is Quellkurs
		if ($isTemplate)
		{
			// Get zugehörige Lv-Sw-Zuordnungen
			$this->LehrveranstaltungModel->addSelect('lehrveranstaltung_id');
			$result = $this->LehrveranstaltungModel->loadWhere([
				'lehrveranstaltung_template_id' => $lehrveranstaltung_id
			]);

			$assignedLvIds = hasData($result) ? getData($result) : [];

			// Get software_lv_id from zugehörige Lv-Sw-Zuordnungen
			if (count($assignedLvIds) > 0)
			{
				$this->SoftwareLvModel->addSelect('software_lv_id');
				$result = $this->SoftwareLvModel->loadWhere('
					lehrveranstaltung_id IN (' . implode(', ',
						array_column($assignedLvIds, 'lehrveranstaltung_id')) . ') AND
					software_id = '. $this->db->escape($software_id). ' AND
					studiensemester_kurzbz = '. $this->db->escape($studiensemester_kurzbz)
				);

				$assignedSwLvIds = hasData($result) ? getData($result) : [];

				// Store software_lv_ids for update
				$updateSoftwareLvIds = array_merge(
					[$this->input->post('software_lv_id')], // template
					array_column($assignedSwLvIds, 'software_lv_id') // zugehörige lvs
				);
			}
		}
		// Else is not a Quellkurs. Its a single Lehrveranstaltung.
		else
		{
			// Store software_lv_id for update
			$updateSoftwareLvIds = [$this->input->post('software_lv_id')];	// lv
		}

		// Prepare data for batch update
		$updateData = [];
		foreach ($updateSoftwareLvIds as $id) {
			$updateData[] = [
				'software_lv_id' => $id,
				'software_id' => $updated_software_id
			];
		}

		if (!empty($updateData)) {
			// Update batch
			$result = $this->SoftwareLvModel->updateBatch($updateData);

			// On error
			$this->getDataOrTerminateWithError($result, FHCAPI_Controller::ERROR_TYPE_DB);
		}

		// On success
		$this->terminateWithSuccess();
	}

	/**
	 * Deletes requested Software for given Template Lvs or standalone LV after some checks:
	 * No update if Bearbeitung is gesperrt.
	 * No update if SW is already assigend.
	 * If given software_lv_id is a template, all zugehoerige Lvs are retrieved and SW is deleted for all.
	 * If given software_lv_id is standalone lv, SW is deleted for this lv.
	 */
	public function deleteSwLvs(){
		$software_lv_id = $this->input->post('software_lv_id');
		$studiensemester_kurzbz = $this->input->post('studiensemester_kurzbz');

		// Check if deletion is allowed
		$bearbeitungIsGesperrt = $this->softwarelib->checkIfBearbeitungIsGesperrt($studiensemester_kurzbz);

		if ($bearbeitungIsGesperrt) exit;	// There is a frontend check too, no more explanation needed.

		// Get Lehrveranstaltung and Software by software_lv_id
		$lehrveranstaltung_id = null;
		$software_id = null;

		$this->SoftwareLvModel->addSelect('lehrveranstaltung_id, software_id');
		$result = $this->SoftwareLvModel->load($software_lv_id);

		if (hasData($result))
		{
			$lehrveranstaltung_id = getData($result)[0]->lehrveranstaltung_id;
			$software_id = getData($result)[0]->software_id;
		}

		// Check if Lehrveranstaltung is a Quellkurs
		$result = $this->LehrveranstaltungModel->checkIsTemplate($lehrveranstaltung_id);
		$isTemplate = $this->getDataOrTerminateWithError($result);

		// If is Quellkurs
		if ($isTemplate)
		{
			// Get zugehörige Lv-Sw-Zuordnungen
			$this->LehrveranstaltungModel->addSelect('lehrveranstaltung_id');
			$result = $this->LehrveranstaltungModel->loadWhere([
				'lehrveranstaltung_template_id' => $lehrveranstaltung_id
			]);

			$assignedLvIds = hasData($result) ? getData($result) : [];

			// Get software_lv_id from zugehörige Lv-Sw-Zuordnungen
			if (count($assignedLvIds) > 0)
			{
				$this->SoftwareLvModel->addSelect('software_lv_id');
				$result = $this->SoftwareLvModel->loadWhere('
					lehrveranstaltung_id IN (' . implode(', ',
						array_column($assignedLvIds, 'lehrveranstaltung_id')) . ') AND
					software_id = '. $this->db->escape($software_id). ' AND
					studiensemester_kurzbz = '. $this->db->escape($studiensemester_kurzbz)
				);

				$assignedSwLvIds = hasData($result) ? getData($result) : [];

				// Store software_lv_ids for deletion
				$deleteSoftwareLvIds = array_merge(
					[$this->input->post('software_lv_id')], // template
					array_column($assignedSwLvIds, 'software_lv_id') // zugehörige lvs
				);
			}
		}
		// Else is not a Quellkurs. Its a single Lehrveranstaltung.
		else
		{
			// Store software_lv_id for deletion
			$deleteSoftwareLvIds = [$this->input->post('software_lv_id')];	// lv
		}

		// Delete software_lv_ids
		$deleted = [];
		foreach ($deleteSoftwareLvIds as $software_lv_id) {
			$this->SoftwareLvModel->delete(['software_lv_id' => $software_lv_id]);

			$deleted[]= $software_lv_id;
		}

		$this->terminateWithSuccess($deleted);
	}

	/**
	 * Check given selections if already exist and returns existing Software-Lv-Zuordnungen.
	 */
	public function checkAndGetExistingSwLvs(){

		// Check if posted SW LV Zuordnungen already exists
		$result = $this->_checkAndGetExistingSwLvs($this->input->post());

		// On success
		$this->terminateWithSuccess($result);
	}

	/**
	 * Autocomplete Software Suggestions.
	 * @return void
	 */
	public function autocompleteSwSuggestions($query = '')
	{
		$result = $this->SoftwareModel->getAutocompleteSuggestions(
			$query,
			self::NOT_ZUORDENBARE_STATI
		);
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
		$entitledOes = $this->permissionlib->getOE_isEntitledFor(self::BERECHTIGUNG_SOFTWAREANFORDERUNG);
		if(!$entitledOes) $oe_permissions = [];

		// Get results for given lv search string
		// Filter query by studiensemester and permitted oes
		$this->load->model('education/Lehrveranstaltung_model', 'LehrveranstaltungModel');
		$result = $this->LehrveranstaltungModel->getAutocompleteSuggestions(
			$query,
			$this->input->get('studiensemester_kurzbz'),
			$entitledOes,
			'lv'
		);

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}

	public function getOtoboUrl()
	{
		if ($this->config->item('otobo_url'))
		{
			$this->terminateWithSuccess($this->config->item('otobo_url'));
		}
		else
		{
			$this->terminateWithError($this->p->t('ui', 'errorUnbekannteUrl'));
		}

	}

	public function checkIfBearbeitungIsGesperrt(){
		$result = $this->softwarelib->checkIfBearbeitungIsGesperrt($this->input->post('studiensemester_kurzbz'));

		$this->terminateWithSuccess($result); // return true or false
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
	 * Get Studiensemester one year next to selected Studiensemester (e.g. SS2024 -> get SS2025)
	 */
	public function getVorrueckStudiensemester(){
		$this->load->model('organisation/Studiensemester_model', 'StudiensemesterModel');

		$result = $this->StudiensemesterModel->getNextFrom($this->input->get('studiensemester_kurzbz'));
		$result = $this->StudiensemesterModel->getNextFrom(hasData($result) ? getData($result)[0]->studiensemester_kurzbz : '');

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data[0]->studiensemester_kurzbz);
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
	private function _checkAndGetExistingSwLvs($data){

		$existingZuordnungen = [];

		foreach($data as $item)
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

	/**
	 * Performs software validation checks.
	 * @return object success if software data valid, error otherwise
	 */
	private function _validateLizenzanzahl($data)
	{
		// load ci validation lib
		$this->load->library('form_validation');

		foreach ($data as $key => $post)
		{
			$data['lizenzanzahl'. $key] = $post['lizenzanzahl'];

			$this->form_validation->set_rules('lizenzanzahl'. $key, 'Lizenz-Anzahl', 'required');
		}

		// Run validation on $data
		$this->form_validation->set_data($data);

		// Return error array if there were errors
		if ($this->form_validation->run() == false)
		{
			$this->terminateWithValidationErrors($this->form_validation->error_array());
		}
	}
}
