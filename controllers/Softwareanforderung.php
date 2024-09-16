<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Overview on Software
 */
class Softwareanforderung extends Auth_Controller
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'index' => 'extension/software_bestellen:r'
			)
		);
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	public function index()
	{
		$this->load->view('extensions/FHC-Core-Softwarebereitstellung/softwareanforderung.php');
	}
}

