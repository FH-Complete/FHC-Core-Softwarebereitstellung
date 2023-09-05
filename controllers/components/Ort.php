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
				'autofill' => 'basis/mitarbeiter:r',
				'getImageort' => 'basis/mitarbeiter:r',
				'updateImageort' => 'basis/mitarbeiter:r',
				'deleteImageort' => 'basis/mitarbeiter:r',
				'getOrteBySoftware' => 'basis/mitarbeiter:r',
				'getOrteByImage' => 'basis/mitarbeiter:r'
			)
		);

		$this->load->model('ressource/Ort_model', 'OrtModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareimageOrt_model', 'SoftwareimageOrtModel');

		$this->_setAuthUID(); // sets property uid
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Get Ort by autofill select query.
	 */
	public function autofill()
	{
		$ort_kurzbz = $this->input->get('ort_kurzbz');
		$this->OrtModel->addOrder('ort_kurzbz');
		$result = $this->OrtModel->loadWhere("ort_kurzbz ILIKE '%".$this->OrtModel->escapeLike($ort_kurzbz)."%'");

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der Orte: '.getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 * Get Softwareimageort.
	 */
	public function getImageort(){
		$softwareimageort_id = $this->input->get('softwareimageort_id');

		$result = $this->SoftwareimageOrtModel->load(array('softwareimageort_id' => $softwareimageort_id));

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen des zugeordnenten Ortes');
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Update Softwareimageorte.
	 * Handles array of Softwareimageorte, updates with same verfuegbarkeit_start and same verfuegbarkeit_ende.
	 *
	 * @return mixed
	 */
	public function updateImageort()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		foreach ($data['softwareimageorte_id'] as $softwareimageort_id)
		{
			// Update image
			$result = $this->SoftwareimageOrtModel->update(
				array(
					'softwareimageort_id' => $softwareimageort_id,
				),
				array(
					'verfuegbarkeit_start' => $data['verfuegbarkeit_start'],
					'verfuegbarkeit_ende' => $data['verfuegbarkeit_ende']
				)
			);

			if (isError($result))
			{
				$this->terminateWithJsonError(getError($result));
			}
		}

		return $this->outputJsonSuccess('Gespeichert');
	}

	/**
	 * Delete Softwareimageort.
	 */
	public function deleteImageort()
	{
		$data = json_decode($this->input->raw_input_stream, true);

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
			$this->terminateWithJsonError('Fehler beim Holen der Orte: '.getError($result));
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result) : []);
	}

	/**
	 *	Get Räume that are assigned to given Softwareimage.
	 */
	public function getOrteByImage(){
		$softwareimage_id = $this->input->get('softwareimage_id');

		$result = $this->SoftwareimageOrtModel->loadWhere(array('softwareimage_id' => $softwareimage_id));

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der zugeordnenten Orte');
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
