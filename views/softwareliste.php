<?php
	$includesArray = array(
		'title' => 'Softwareliste',
		'vue3' => true,
		'axios027' => true,
		'bootstrap5' => true,
		'tabulator5' => true,
		'fontawesome6' => true,
		'primevue3' => true,
		'customJSs' => array('vendor/vuejs/vuedatepicker_js/vue-datepicker.iife.js'),
		'customJSModules' => array('public/extensions/FHC-Core-Softwarebereitstellung/js/apps/SoftwareManagement.js'),
		'customCSSs' => array(
			'vendor/vuejs/vuedatepicker_css/main.css',
			'public/extensions/FHC-Core-Softwarebereitstellung/css/SoftwareManagement.css',
			'public/css/Fhc.css'
		)
	);

	$this->load->view('templates/FHC-Header', $includesArray);
?>

	<div id="main">
		<softwareliste-layout></softwareliste-layout>
	</div>

<?php $this->load->view('templates/FHC-Footer', $includesArray); ?>
