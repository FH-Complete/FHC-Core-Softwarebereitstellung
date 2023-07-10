<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Software functions
 */
class Software extends Auth_Controller
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'index' => 'basis/mitarbeiter:r',
				'getDataPrefill' => 'basis/mitarbeiter:r',
				'createSoftware' => 'basis/mitarbeiter:rw'
			)
		);

		// Loads WidgetLib
		$this->load->library('WidgetLib');

		$this->load->model('system/Sprache_model', 'SpracheModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Softwaretyp_model', 'SoftwaretypModel');

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
	 *
	 * @param
	 * @return object success or error
	 */
	public function createSoftware()
	{
		$this->load->library('form_validation');

		$_POST = json_decode($this->input->raw_input_stream, true);

		$this->form_validation->set_rules('software_kurzbz', 'Software Kurzbezeichnung', 'required');
		$this->form_validation->set_rules('softwaretyp_kurzbz', 'Softwaretyp', 'required');
		$this->form_validation->set_rules('aktiv', 'Aktiv', 'required');

		if ($this->form_validation->run() == false)
		{
			return $this->outputJsonError($this->form_validation->error_array());
		}

		$this->outputJson(success(true));
	}

	/**
	 * Gets language index of currently logged in user.
	 * @return object int (the index, start at 1)
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
