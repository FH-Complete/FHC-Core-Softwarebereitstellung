<?php
// Add Header-Menu-Entry to Main Page
$config['navigation_header']['*']['Administration']['children']['SoftwareManagement'] = array(
	'link' => site_url('extensions/FHC-Core-Softwarebereitstellung/SoftwareManagement'),
	'sort' => 30,
	'description' => 'Software Management',
	'expand' => false,
	'requiredPermissions' => 'extension/software_verwalten:rw'
);

// Add Side-Menu-Entry to Main Page
$config['navigation_menu']['extensions/FHC-Core-Softwarebereitstellung/*'] = array(
	'Lizenzmanagement' => array(
		'link' => site_url('extensions/FHC-Core-Softwarebereitstellung/SoftwareManagement'),
		'description' => 'Software-Lizenzmanagement',
		'requiredPermissions' => 'extension/software_verwalten:rw'
	)
);
