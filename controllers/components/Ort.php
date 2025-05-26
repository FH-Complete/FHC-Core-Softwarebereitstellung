<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Software functions
 */
class Ort extends Auth_Controller
{
	private $_uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'autofill' => array('extension/software_verwalten:rw','extension/softwareliste:r'),
				'getOrte' => 'extension/software_verwalten:rw',
				'getImageort' => 'extension/software_verwalten:rw',
				'deleteImageort' => 'extension/software_verwalten:rw',
				'getOrteBySoftware' => array('extension/software_verwalten:rw','extension/softwareliste:r'),
				'getOrteByImage' => 'extension/software_verwalten:rw'
			)
		);

		$this->load->model('ressource/Ort_model', 'OrtModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareimageOrt_model', 'SoftwareimageOrtModel');

		// Load language phrases
		$this->loadPhrases([
			'ui'
		]);

		$this->_setAuthUID(); // sets property uid
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Get Ort by autofill select query.
	 */
	public function autofill()
	{
		$query = $this->input->get('query');
		$this->OrtModel->addOrder('ort_kurzbz');
		$result = $this->OrtModel->loadWhere("ort_kurzbz ILIKE '%".$this->OrtModel->escapeLike($query)."%'");

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	public function getOrte()
	{
		$this->OrtModel->addOrder('ort_kurzbz');
		$result = $this->OrtModel->load();

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Get Softwareimageort.
	 */
	public function getImageort()
	{
		$softwareimageort_id = $this->input->get('softwareimageort_id');

		$result = $this->SoftwareimageOrtModel->load(array('softwareimageort_id' => $softwareimageort_id));

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Delete Softwareimageort.
	 */
	public function deleteImageort()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		if (!isset($data['softwareimageort_id'])) return $this->outputJsonError($this->p->t('ui', 'errorFelderFehlen'));

		// Delete softwareimageort
		return $this->outputJson($this->SoftwareimageOrtModel->delete(array(
			'softwareimageort_id' => $data['softwareimageort_id']
		)));
	}

	/**
	 * Get Räume of a Software
	 */
	public function getOrteBySoftware()
	{
		$software_id = $this->input->get('software_id');
		$result = $this->SoftwareimageOrtModel->getOrteBySoftware($software_id);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 *	Get Räume that are assigned to given Softwareimage.
	 */
	public function getOrteByImage()
	{
		$softwareimage_id = $this->input->get('softwareimage_id');

		$result = $this->SoftwareimageOrtModel->getOrteByImage($softwareimage_id);

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
