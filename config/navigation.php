<?php
// Add Header-Menu-Entry to Main Page
$config['navigation_header']['*']['Lehre']['children']['SoftwareManagement'] = array(
	'link' => site_url('extensions/FHC-Core-Softwarebereitstellung/SoftwareManagement'),
	'sort' => 30,
	'description' => 'Software Management',
	'expand' => false,
	'requiredPermissions' => 'extension/software_verwalten:rw'
);

// Add Side-Menu-Entry to Main Page
$config['navigation_menu']['extensions/FHC-Core-Softwarebereitstellung/*'] = array(
	'Softwareanforderung' => array(
		'link' => site_url('extensions/FHC-Core-Softwarebereitstellung/Softwareanforderung'),
		'description' => 'Softwareanforderung',
		'requiredPermissions' => 'extension/software_bestellen:rw'
	),
	'Lizenzmanagement' => array(
		'link' => site_url('extensions/FHC-Core-Softwarebereitstellung/SoftwareManagement'),
		'description' => 'Software-Lizenzmanagement',
		'requiredPermissions' => 'extension/software_verwalten:rw'
	)
);
