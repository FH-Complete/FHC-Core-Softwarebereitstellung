<?php
	$includesArray = array(
		'title' => 'Software Verwaltung',
		'axios027' => true,
		'bootstrap5' => true,
		'fontawesome6' => true,
		'vue3' => true,
		'filtercomponent' => true,
		'navigationcomponent' => true,
		'tabulator5' => true,
		//~ 'phrases' => array(
			//~ 'global' => array('mailAnXversandt'),
			//~ 'ui' => array('bitteEintragWaehlen')
		//~ ),
		'customJSModules' => array('public/extensions/FHC-Core-Softwarebereitstellung/js/apps/SoftwareManagement.js')
	);

	$this->load->view('templates/FHC-Header', $includesArray);
?>

	<div id="main">
		<software-management-cmpt></software-management-cmpt>
	</div>

<?php $this->load->view('templates/FHC-Footer', $includesArray); ?>
