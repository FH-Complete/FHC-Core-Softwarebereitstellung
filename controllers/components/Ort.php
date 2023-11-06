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
				'getOrte' => 'basis/mitarbeiter:r',
				'getImageort' => 'basis/mitarbeiter:r',
				'insertImageort' => 'basis/mitarbeiter:r',
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

	public function getOrte()
	{
		$this->OrtModel->addOrder('ort_kurzbz');
		$result = $this->OrtModel->load();

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der Orte: '.getError($result));
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
			$this->terminateWithJsonError('Fehler beim Holen des zugeordnenten Ortes');
		}

		$this->outputJsonSuccess(hasData($result) ? getData($result)[0] : []);
	}

	/**
	 * Insert new Softwareimageorte.
	 * Handles array of Orte with same softwareimage_id, verfuegbarkeit_start and verfuegbarkeit_ende.
	 *
	 * @return mixed
	 */
	public function insertImageort()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data, $new = true);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

		foreach ($data['ort_kurzbz'] as $ort_kurzbz)
		{
			// Update image
			$result = $this->SoftwareimageOrtModel->insert(
				array(
					'softwareimage_id' => $data['softwareimage_id'],
					'ort_kurzbz' => $ort_kurzbz,
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
	 * Update Softwareimageorte.
	 * Handles array of Softwareimageorte, updates with same verfuegbarkeit_start and same verfuegbarkeit_ende.
	 *
	 * @return mixed
	 */
	public function updateImageort()
	{
		$data = json_decode($this->input->raw_input_stream, true);

		// Validate data
		$result = $this->_validate($data);

		if (isError($result))
		{
			$this->terminateWithJsonError(getError($result));
		}

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

		if (!isset($data['softwareimageort_id'])) return $this->outputJsonError('Imageort fehlt');

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
	public function getOrteByImage()
	{
		$softwareimage_id = $this->input->get('softwareimage_id');

		$result = $this->SoftwareimageOrtModel->getOrteByImage($softwareimage_id);

		if (isError($result))
		{
			$this->terminateWithJsonError('Fehler beim Holen der zugeordneten Orte');
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
	 * Performs validation checks.
	 * @return object error if invalid, success otherwise
	 */
	private function _validate($data, $new = false)
	{
		$this->load->library('form_validation');

		$verfuegbarkeit_start = isset($data['verfuegbarkeit_start']) ? $data['verfuegbarkeit_start'] : null;

		// reform data because ci validator can't handle arrays'
		$ortFieldname = $new ? 'ort_kurzbz' : 'softwareimageorte_id';
		$data[$ortFieldname] = isset($data[$ortFieldname]) && !isEmptyArray($data[$ortFieldname]) ? true : null;
		//var_dump($data['ort_kurzbz']);
		// Validate form data
		$this->form_validation->set_data($data);
		$this->form_validation->set_rules(
			$ortFieldname,
			'Orte',
			'required',
			array('required' => 'Pflichtfeld')
		);
		$this->form_validation->set_rules(
			'verfuegbarkeit_ende',
			'Verfügbarkeit Ende',
			array(
				array(
					'orteVerfuegbarkeit',
					function($verfuegbarkeit_ende) use ($verfuegbarkeit_start)
					{
						return $this->_checkOrteVerfuegbarkeit($verfuegbarkeit_start, $verfuegbarkeit_ende);
					}
				)
			),
			array('orteVerfuegbarkeit' => 'Datumende vor Datumstart')
		);

		// On error
		if ($this->form_validation->run() == false)
		{
			return error($this->form_validation->error_array());
		}

		// On success
		return success();
	}

	/**
	 * Check if Verfügbarkeit is valid.
	 * @param verfuegbarkeit_start
	 * @param verfuegbarkeit_ende
	 * @return bool valid or not
	 */
	private function _checkOrteVerfuegbarkeit($verfuegbarkeit_start, $verfuegbarkeit_ende)
	{
		if (isEmptyString($verfuegbarkeit_start) || isEmptyString($verfuegbarkeit_ende)) return true;

		$start = strtotime($verfuegbarkeit_start);
		$ende = strtotime($verfuegbarkeit_ende);

		return $start && $ende && $start <= $ende;
	}
}
