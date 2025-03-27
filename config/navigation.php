<?php
// Add Header-Menu-Entry to Main Page
$config['navigation_header']['*']['Lehre']['children']['SoftwareManagement'] = array(
	'link' => site_url('extensions/FHC-Core-Softwarebereitstellung/SoftwareManagement'),
	'sort' => 30,
	'description' => 'Softwarebereitstellung',
	'expand' => false,
	'requiredPermissions' => 'extension/software_verwalten:rw'
);

// Add Side-Menu-Entry to Main Page
$config['navigation_menu']['extensions/FHC-Core-Softwarebereitstellung/*'] = array(
	'Softwarebereitstellung' => array(
		'link' => site_url('extensions/FHC-Core-Softwarebereitstellung/Softwareanforderung'),
		'description' => 'Softwarebereitstellung',
		'requiredPermissions' => 'extension/software_bestellen:rw'
	),
	'Softwareverwaltung' => array(
		'link' => site_url('extensions/FHC-Core-Softwarebereitstellung/SoftwareManagement'),
		'description' => 'Software-Lizenzmanagement',
		'requiredPermissions' => 'extension/software_verwalten:rw'
	)
);
