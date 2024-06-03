<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Overview on Software
 */
class Softwareliste extends Auth_Controller
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'index' => 'extension/softwareliste:r',
				'softwareSuche' => 'extension/softwareliste:r'
			)
		);
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Everything has a beginning
	 */
	public function index()
	{
		$this->load->view('extensions/FHC-Core-Softwarebereitstellung/softwareliste.php');
	}

	public function softwareSuche($ort_kurzbz)
	{
		$this->load->view(
			'extensions/FHC-Core-Softwarebereitstellung/softwareliste.php',
			['ort_kurzbz' => $ort_kurzbz]
		);
	}
}

