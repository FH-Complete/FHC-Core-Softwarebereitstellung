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

		<!-- Navigation component -->
		<core-navigation-cmpt v-bind:add-side-menu-entries="appSideMenuEntries"></core-navigation-cmpt>

		<div id="content">
			<div>
						{{optionsbar.includeHierarchy}}
				<options-bar-cmpt
					@custom-change="handleCustomChange">
				</options-bar-cmpt>
				<!-- Filter component -->
				<core-filter-cmpt
					title="Software Verwaltung"
					filter-type="SoftwareManagement"
					:tabulator-options="softwareManagementTabulatorOptions"
					:tabulator-events="softwareManagementTabulatorEventHandlers"
					@nw-new-entry="newSideMenuEntryHandler">
				</core-filter-cmpt>
			</div>
		</div>
	</div>

<?php $this->load->view('templates/FHC-Footer', $includesArray); ?>
