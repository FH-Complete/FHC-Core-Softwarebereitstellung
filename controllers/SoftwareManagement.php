<?php

if (! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Overview on Software
 */
class SoftwareManagement extends Auth_Controller
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'index' => 'extension/software_verwalten:rw'
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
		$this->load->view('extensions/FHC-Core-Softwarebereitstellung/softwareManagement.php');
	}
}

