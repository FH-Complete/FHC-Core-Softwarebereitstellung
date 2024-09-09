<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Software functions
 */
class Software extends FHCAPI_Controller
{
	private $_uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'createSoftware' => 'extension/software_verwalten:rw',
				'updateSoftware' => 'extension/software_verwalten:rw',
				'getStudienjahre' => 'extension/software_verwalten:rw',
				'getAktOrNextStudienjahr' => 'extension/software_verwalten:rw',
				'getSwLizenzenSumAndPercentageShareByOeAndStudienjahr' => 'extension/software_verwalten:rw'
			)
		);

		$this->_setAuthUID(); // sets property uid

		// load models
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Software_model', 'SoftwareModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareLv_model', 'SoftwareLvModel');

		// Load libraries
		$this->load->library('extensions/FHC-Core-Softwarebereitstellung/SoftwareLib');


		// Load language phrases
		$this->loadPhrases([
			'ui'
		]);

	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods
	/**
	 * Creates a software after performing necessary checks.
	 */
	public function createSoftware()
	{
		$this->_validate();

		// Insert Software and Softwarestatus
		$result = $this->SoftwareModel->insertSoftwarePlus(
			$this->input->post('software'),
			$this->input->post('softwarestatus')['softwarestatus_kurzbz'],
			$this->input->post('softwareImageIds')
		);

		// On error
		$result = $this->getDataOrTerminateWithError($result, FHCAPI_Controller::ERROR_TYPE_DB);

		// On success
		$this->terminateWithSuccess($result);
	}

	/**
	 * Updates a software after performing necessary checks.
	 */
	public function updateSoftware()
	{
		$this->_validate();

		// Update Software and inserts newer Softwarestatus
		$result = $this->SoftwareModel->updateSoftwarePlus(
			$this->input->post('software'),
			$this->input->post('softwarestatus')['softwarestatus_kurzbz'],
			$this->input->post('softwareImageIds')
		);

		// On error
		if (isError($result)) $this->TerminateWithError($result, FHCAPI_Controller::ERROR_TYPE_DB);

		// For certain status...
		$parentArray = [];

		if ($this->input->post('softwarestatus')['softwarestatus_kurzbz'] === 'endoflife' ||
			$this->input->post('softwarestatus')['softwarestatus_kurzbz'] === 'nichtverfuegbar')
		{
			//...transfer status also to any child software, if it exists
			$result = $this->softwarelib->changeChildrenSoftwarestatus(
				$this->input->post('softwarestatus')['software_id'],
				$this->input->post('softwarestatus')['softwarestatus_kurzbz']
			);

			if (hasData($result))
			{
				$parentArray = array_keys(getData($result));
			}

			if (isError($result)) $this->TerminateWithError($result, FHCAPI_Controller::ERROR_TYPE_DB);
		}

		// On success
		$this->terminateWithSuccess(['parentArray' => $parentArray]);
	}

	// Get current Studienjahr
	public function getAktOrNextStudienjahr(){
		$this->load->model('organisation/Studienjahr_model', 'StudienjahrModel');
		$result = $this->StudienjahrModel->getAktOrNextStudienjahr();

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data[0]);
	}

	// Get all Studienjahre
	public function getStudienjahre(){
		$this->load->model('organisation/Studienjahr_model', 'StudienjahrModel');
		$this->StudienjahrModel->addOrder('studienjahr_kurzbz');
		$result = $this->StudienjahrModel->loadWhere(array(
			'studienjahr_kurzbz >= ' => self::STUDIENJAHR_DROPDOWN_STARTDATE,
		));

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}

	public function getSwLizenzenSumAndPercentageShareByOeAndStudienjahr(){

		// Get SS and WS Studiensemester of given Studienjahr
		$this->load->model('organisation/Studiensemester_model', 'StudiensemesterModel');
		$this->StudiensemesterModel->addOrder('start');
		$result = $this->StudiensemesterModel->loadWhere(array(
			'studienjahr_kurzbz' => $this->input->post('studienjahr_kurzbz')
		));

		// Return if no Studiensemester are assigend to Studienjahr yet
		if (!hasData($result))
		{
			$this->terminateWithSuccess([]);
		}

		// SS and WS of given Studienjahr
		$data = $this->getDataOrTerminateWithError($result);

		// Get Lizenzanzahl sum and percetage share by OE for both studiensemester
		$result = $this->SoftwareLvModel->getSwLizenzenSumAndPercentageShareByOeAndStudienjahr(
			$this->input->post('software_id'),
			array_column($data, 'studiensemester_kurzbz')
		);

		// Return
		$data = $this->getDataOrTerminateWithError($result);
		$this->terminateWithSuccess($data);
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Performs software validation checks.
	 * @return object success if software data valid, error otherwise
	 */
	private function _validate()
	{
		// load ci validation lib
		$this->load->library('form_validation');

		// Extract nested data
		$software = $this->input->post('software');

		// Set up the validation rules
		$this->form_validation->set_data($software); // Set data to validate

		// Set up the validation rules
		$this->form_validation->set_rules('softwaretyp_kurzbz', 'Softwaretyp', 'required');
		$this->form_validation->set_rules('anzahl_lizenzen', 'Lizenz-Anzahl', 'required');
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
				'software_exists' => $this->p->t('ui', 'existiertBereitsInKombinationMitDerVersion')
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
			array('cyclic_dependency' => $this->p->t('ui', 'nichtGleichzeitigUntergeordnetUndUebergeordnet'))
		);
		$this->form_validation->set_rules('lizenzkosten', 'Lizenzkosten', 'decimal');

		// return error array if there were errors
		if ($this->form_validation->run() == false)
		{
			$this->terminateWithValidationErrors($this->form_validation->error_array());
		}
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
	 * Check if there is a software with a certain kurzbz and a version.
	 * @param software_kurzbz
	 * @param software
	 * @return object success or error
	 */
	private function _checkSoftwareExists($software_kurzbz, $software)
	{
		if (!isset($software['version'])) $software['version'] = null;

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
}
