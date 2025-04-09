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
				'index' => [
					'extension/software_bestellen:rw',
					'extension/software_verwalten:rw'
				]
			)
		);

		$this->load->library('PermissionLib');
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Everything has a beginning
	 */
	public function index()
	{
		if ($this->permissionlib->isBerechtigt('extension/software_bestellen:rw'))
		{
			$this->load->view('extensions/FHC-Core-Softwarebereitstellung/softwareanforderung.php');
		}

		if ($this->permissionlib->isBerechtigt('extension/software_verwalten:rw'))
		{
			$this->load->view('extensions/FHC-Core-Softwarebereitstellung/softwareManagement.php');
		}
	}
}

