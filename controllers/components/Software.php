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
				'getSoftware' => 'basis/mitarbeiter:r',
				'getStatus' => 'basis/mitarbeiter:r',
				'getLastSoftwarestatus' => 'basis/mitarbeiter:r',
				'changeSoftwarestatus' => 'basis/mitarbeiter:rw',
				'createSoftware' => 'basis/mitarbeiter:rw',
				'updateSoftware' => 'basis/mitarbeiter:rw',
				'deleteSoftware' => 'basis/mitarbeiter:rw'
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

        // Get all Softwarestatus
        $softwarestatus_arr = array();

        $result = $this->SoftwarestatusModel->loadByLanguage($language_index);

        if (isError($result))
        {
            $this->terminateWithJsonError('Fehler beim Holen der Softwarestatus');
        }

        if (hasData($result))
        {
            foreach (getData($result) as $softwarestatus)
            {
                $softwarestatus_arr[$softwarestatus->softwarestatus_kurzbz] = $softwarestatus->bezeichnung;
            }
        }

		$dataPrefill = array(
			'softwaretyp' => $softwaretypes,
            'softwarestatus' => $softwarestatus_arr
		);

		$this->outputJsonSuccess($dataPrefill);
	}

    /**
     * Get Software
     *
     * @param
     * @return object success or error
     */
    public function getSoftware($software_id)
    {
        $result = $this->SoftwareModel->load($software_id);

        if (isError($result))
        {
            $this->terminateWithJsonError('Fehler beim Holen der Software');
        }
        $this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
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
	 * Get last Softwarestatus of given Software.
	 *
	 * @param $software_id integer
	 */
	public function getLastSoftwarestatus($software_id)
	{
		$result = $this->SoftwareSoftwarestatusModel->getLastSoftwarestatus($software_id);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen des Softwarestatus');
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

		$data = json_decode($this->input->raw_input_stream, true);
        $software = $data['software'];
        $softwarestatus = $data['softwarestatus'];

		// validate data
		$this->form_validation->set_data($software);

		$this->form_validation->set_rules('software_kurzbz', 'Software Kurzbezeichnung', 'required', array('required' => '%s fehlt'));
		$this->form_validation->set_rules('softwaretyp_kurzbz', 'Softwaretyp', 'required', array('required' => '%s fehlt'));

		if ($this->form_validation->run() == false)
			return $this->outputJsonError($this->form_validation->error_array());

		if (isset($software['version']))
		{
			// check if there is already a software with the kurzbz and version
			$this->SoftwareModel->addSelect('1');
			$softwareRes = $this->SoftwareModel->loadWhere(array(
				'software_kurzbz' => $software['software_kurzbz'],
				'version' => $software['version'])
			);

			if (isError($softwareRes) || hasData($softwareRes))
				return $this->outputJsonError(array('Software Kurzbezeichnung mit dieser Version existiert bereits'));
		}

		$software['insertvon'] = $this->_uid;

		// Insert Software and Softwarestatus
        $result = $this->SoftwareModel->insertSoftwarePlus($software, $softwarestatus['softwarestatus_kurzbz']);

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

		// check/delete dependencies before deleting software

		// delete software_status
		$softwareSoftwarestatusRes = $this->SoftwareSoftwarestatusModel->delete(array('software_id' => $softwareData['software_id']));

		if (isError($softwareSoftwarestatusRes)) return $this->outputJsonError(array(getError($softwareSoftwarestatusRes)));

		// delete software itself
		return $this->outputJson($this->SoftwareModel->delete(array('software_id' => $softwareData['software_id'])));
	}

	/**
	 * Updates a software after performing necessary checks.
	 */
	public function updateSoftware()
	{
        $data = $this->getPostJson();
        $software = $data->software;
        $softwarestatus = $data->softwarestatus;

		// Update Software and inserts newer Softwarestatus
        $result = $this->SoftwareModel->updateSoftwarePlus(
            $software,
            $softwarestatus->softwarestatus_kurzbz
        );

        if (isError($result)) $this->terminateWithJsonError('Fehler beim Ändern der Software');

        $this->outputJsonSuccess('Success');
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
