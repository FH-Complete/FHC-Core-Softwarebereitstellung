<?php
if (! defined('BASEPATH')) exit('No direct script access allowed');

class SoftwareLib
{
	private $_ci; // Code igniter instance
	const PERMISSION_SOFTWARE_VERWALTEN = 'extension/software_verwalten';
	const PERMISSION_SOFTWARE_BESTELLEN = 'extension/software_bestellen';

	public function __construct()
	{
		$this->_ci =& get_instance();

		$this->_ci->load->model('extensions/FHC-Core-Softwarebereitstellung/Software_model', 'SoftwareModel');
		$this->_ci->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareLv_model', 'SoftwareLvModel');
		$this->_ci->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareSoftwarestatus_model', 'SoftwareSoftwarestatusModel');

		// Load config
		$this->_ci->load->config('extensions/FHC-Core-Softwarebereitstellung/softwarebereitstellung');

		$this->_ci->load->library('MailLib');
	}

	/**
	 * Check softwareIds, if they have child software, and change their status.
	 *
	 * @param $softwareIds
	 * @param $softwarestatusKurzbz
	 * @return mixed	success object with result array, where key is the parent softwareId, and value the child softwareId.
	 */
	public function changeChildrenSoftwarestatus($softwareIds, $softwarestatusKurzbz){

		$result = $this->getParentChildMap($softwareIds);

		if (hasData($result))
		{
			$childrenArray = array_merge(...array_values(getData($result)));

			$res = $this->_ci->SoftwareSoftwarestatusModel->changeSoftwarestatus(
				$childrenArray,
				$softwarestatusKurzbz
			);

			if (isError($res)) return error($res);
		}

		return success(getData($result));
	}

	/**
	 * Checks given softwareIds if they are parent and, if so, retrieves their children.
	 * @param $softwareIds Array | Number
	 * @return mixed success object with result array, where key is the parent softwareId, and value the child softwareId.
	 */
	public function getParentChildMap($softwareIds){
		if (!is_array($softwareIds))
		{
			$softwareIds = [$softwareIds];
		}

		$result = [];

		foreach ($softwareIds as $software_id)
		{
			$children = $this->_ci->SoftwareModel->getChildren($software_id);

			if (hasData($children))
			{
				$result[$software_id]= array_column(getData($children), 'software_id');
			}
		}

		return success($result);
	}

	/**
	 * Check if the planning deadline of actual Studienjahr has expired.
	 *
	 * @param $studiensemester_kurzbz
	 * @return bool
	 */
	public function isPlanningDeadlinePast()
	{
		$planungDeadline = $this->getPlanungDeadline();
		if (isError($planungDeadline)) return getError($planungDeadline);

		$today = new DateTime();
		$today->setTime(0, 0, 0);

		return getData($planungDeadline) < $today;
	}

	/**
	 * Check if today is exactly 2 weeks before Planning Deadline.
	 *
	 * @param null $studiensemester_kurzbz
	 * @return bool
	 */
	public function isTwoWeeksBeforePlanningDeadline()
	{
		$planungDeadline = $this->getPlanungDeadline();

		if (isError($planungDeadline)) return getError($planungDeadline);
		$planungDeadline = getData($planungDeadline);

		$twoWeeksBeforeDeadline = $planungDeadline->sub(new DateInterval('P2W'));

		$today = new DateTime();
		$today->setTime(0, 0, 0);

		return $today === $twoWeeksBeforeDeadline;
	}

	/**
	 * Check if today is exactly 2 weeks before upcoming Studiensemester starts.
	 *
	 * @return bool
	 * @throws Exception
	 */
	public function isTwoWeeksBeforeNextSemesterstart()
	{
		$this->_ci->load->model('organisation/Studiensemester_model', 'StudiensemesterModel');
		$result = $this->_ci->StudiensemesterModel->getNext();
		$nextSem = getData($result)[0];

		$nextSemStart = new DateTime($nextSem->start);
		$twoWeeksBeforeNextSemStart = $nextSemStart->sub(new DateInterval('P2W'));

		$today = new DateTime();
		$today->setTime(0, 0, 0);

		return $today === $twoWeeksBeforeNextSemStart;
	}

	/**
	 * Get Planungsdeadline of next Studienjahr.
	 *
	 * @param $studiensemester_kurzbz
	 * @return mixed
	 */
	public function getPlanungDeadline()
	{
		// Get next Studienjahr
		$this->_ci->load->model('organisation/Studienjahr_model', 'StudienjahrModel');
		$result = $this->_ci->StudienjahrModel->getNextStudienjahr();
		$studienjahr_kurzbz = getData($result)[0]->studienjahr_kurzbz;
		$startstudienjahr = substr($studienjahr_kurzbz, 0, 4);

		// Get Planungsdeadline of requested Studienjahr
		if ($this->_ci->config->item('planung_deadline'))
		{
			$planungDeadline = new DateTime();
			$planungDeadline->setDate(
				$startstudienjahr,
				$this->_ci->config->item('planung_deadline')['month'],
				$this->_ci->config->item('planung_deadline')['day']
			);
			$planungDeadline->setTime(0,0,0);

			return success($planungDeadline);
		}
		else
		{
			return error('missing config planung_deadline');
		}
	}

	public function addStudiensemesterOfNextStudjahr($softwareLvIds)
	{
		// NOTE: Mixed data: SWLV data of given swlvId, but studiensemester is from Next year!
		$this->_ci->SoftwareLvModel->addSelect('software_lv_id');
		$this->_ci->SoftwareLvModel->addSelect('lehrveranstaltung_id');
		$this->_ci->SoftwareLvModel->addSelect('software_id');
		$this->_ci->SoftwareLvModel->addSelect('lizenzanzahl');
		$this->_ci->SoftwareLvModel->addSelect('
			(
				SELECT studiensemester_kurzbz
				FROM public.tbl_studiensemester
				WHERE studiensemester_kurzbz > extension.tbl_software_lv.studiensemester_kurzbz
				ORDER BY studiensemester_kurzbz
				LIMIT 1
	  		) AS studiensemester_kurzbz
		');

		return $this->_ci->SoftwareLvModel->loadWhere('
			software_lv_id IN ('. implode(', ', $softwareLvIds). ')
		');
	}
	// -----------------------------------------------------------------------------------------------------------------
	// JOBS & ALERTS
	// -----------------------------------------------------------------------------------------------------------------

	// Job Funktionen für Softwarebeauftragte
	//------------------------------------------------------------------------------------------------------------------
	/**
	 * Load all Studiengang OEs and add corresponding Fakultät OE.
	 *
	 * @return array
	 */
	public function getOeTypToFakultaetMap($organisationseinheittyp_kurzbz)
	{

		// Load all Studiengang Oes
		$this->_ci->load->model('organisation/Organisationseinheit_model', 'OrganisationseinheitModel');

		$this->_ci->OrganisationseinheitModel->addSelect('oe_kurzbz, oe_parent_kurzbz');
		$this->_ci->OrganisationseinheitModel->addOrder('oe_parent_kurzbz');
		$result = $this->_ci->OrganisationseinheitModel->loadWhere([
			'organisationseinheittyp_kurzbz' => $organisationseinheittyp_kurzbz,
			'aktiv' => true
		]);
		$oe_arr = hasData($result) ? getData($result) : [];

		// Iterate Studiengang Oes
		foreach ($oe_arr as $oe)
		{
			// Get parents
			$result = $this->_ci->OrganisationseinheitModel->getParents($oe->oe_kurzbz);

			if(isSuccess($result) && hasData($result))
			{
				$data = getData($result);

				// Iterate parents
				foreach ($data as $parent_oe)
				{
					$result_oe = $this->_ci->OrganisationseinheitModel->load($parent_oe->oe_kurzbz);
					if(hasData($result_oe))
					{
						$parent_oe_object = getData($result_oe)[0];
						// Find and add Fakultät
						if ($parent_oe_object->organisationseinheittyp_kurzbz == 'Fakultaet')
						{
							$oe->fak_oe_kurzbz = $parent_oe->oe_kurzbz;
							break;  // Stop after finding the first match
						}

						// else set null
						else
						{
							$oe->fak_oe_kurzbz = NULL;
						}
					}
				}
			}
		}
		// Return result or []
		return $oe_arr;
	}

	/**
	 * Assign software to newly added standardized LVs whose LV templates are already linked to a software.
	 * Inserts the assignments into the 'table_software_lv' database table with a default Lizenzanzahl of 0.
	 */
	public function handleUnassignedStandardLvs(){
		$unassignedStandardLvs = [];

		// Get akt or next Studiensemester
		$this->_ci->load->model('organisation/Studiensemester_model', 'StudiensemesterModel');
		$result = $this->_ci->StudiensemesterModel->getAktOrNextSemester();
		$studiensemester_kurzbz = getData($result)[0]->studiensemester_kurzbz;

		// Get unassigned standardised Lehrveranstaltungen with the software_id from the corresponding template
		$result = $this->_ci->SoftwareLvModel->getUnassignedStandardLvsByTemplate($studiensemester_kurzbz);

		if (isError($result))
		{
			$this->logError(getError($result));
		}

		// If unassigned standardised Lvs were found
		if (hasData($result))
		{
			// Prepare insert batch data
			$unassignedStandardLvs = getData($result);
			$batch = [];
			foreach ($unassignedStandardLvs as $item) {
				$batch[] = [
					'software_id' => $item->software_id,
					'lehrveranstaltung_id' => $item->lehrveranstaltung_id,
					'studiensemester_kurzbz' => $item->studiensemester_kurzbz,
					'lizenzanzahl' => 0
				];
			}

			// Assign the unassigned standardised Lvs to software from the corresponding template
			$insertResult = $this->_ci->SoftwareLvModel->insertBatch($batch);

			if (isError($insertResult))
			{
				$this->logError(getError($insertResult));
			}
		}
		return $unassignedStandardLvs;
	}

	/**
	 * Helper to group LVs by Fakultät of the LV Studiengang OE.
	 *
	 * @param $lv_arr
	 * @param $stg_oe_arr
	 * @return array
	 */
	public function groupLvsByFakultaetOfLvOe($lv_arr, $oeToFakMap_arr)
	{
		$grouped = [];

		foreach ($lv_arr as $lv) {
			foreach ($oeToFakMap_arr as $item) {
				if ($lv->oe_kurzbz === $item->oe_kurzbz) {
					// Group by FAK OE of lvs' oe
					$grouped[$item->fak_oe_kurzbz][] = $lv;
				}
			}
		}

		return $grouped;
	}

	/**
	 * Helper to group LVs by Fakultät of the LVs OE.
	 *
	 * @param $lv_arr
	 * @param $stg_oe_arr
	 * @return array
	 */
	public function groupLvsByFakultaetOfLvStgOe($lv_arr, $oeToFakMap_arr)
	{
		$grouped = [];

		foreach ($lv_arr as $lv) {
			foreach ($oeToFakMap_arr as $item) {
				// Check against LV oe
				if ($lv->stg_oe_kurzbz === $item->oe_kurzbz) {
					// Group by FAK OE of lvs' stg oe
					$grouped[$item->fak_oe_kurzbz][] = $lv;
				}
			}
		}

		return $grouped;
	}

	/**
	 * Prepare email message regarding newly assigned standardisied Lvs.
	 *
	 * @param $groupedLvs	Lvs grouped by Fakultät of the LV Studiengang
	 * @return array key: oe_kurzbz of Fakultät, value: html message like text and tables
	 */
	public function formatMsgNewlyAssignedStandardLvs($groupedLvs)
	{
		$messages = [];

		// Loop through each group and prepare the emails
		foreach ($groupedLvs as $oe_kurzbz => $items) {

			// Start table tag
			$table = '<table style="border-collapse: collapse; width: 100%;">';
			$table .= '<tr>
						<th style="border: 1px solid #000; padding: 8px;">Studiengang-OE</th>
						<th style="border: 1px solid #000; padding: 8px;">OrgForm</th>
						<th style="border: 1px solid #000; padding: 8px;">Neue standardisierte LV</th>
						<th style="border: 1px solid #000; padding: 8px;">Software</th>
						<th style="border: 1px solid #000; padding: 8px;">User-Anzahl</th>
					</tr>';

			// Loop items in Fakultät
			foreach ($items as $item) {
				$table .= '<tr>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->stg_oe_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->orgform_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->bezeichnung . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->software_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">0</td>';    // Set Lizenzanzahl 0
				$table .= '</tr>';
			}
			// Close table tag
			$table .= '</table>';

			$message = "
				<p>
					<b>Software für neue standardisierte LV angefordert. Zuordnung über Quellkurs.</b></br>
					Bitte passen Sie im System die User-Anzahl entsprechend Ihrer Anforderung an.
				</p>
			";
			$message .= $table;
			$messages[] = ['oe_kurzbz' => $oe_kurzbz, 'message' => $message];
		}

		return $messages;
	}

	/**
	 * Prepare email message regarding SwLvs with Lizenzanzahl 0.
	 *
	 * @param $groupedLvs	Lvs grouped by Fakultät of the LV Studiengang
	 * @return array key: oe_kurzbz of Fakultät, value: html message like text and tables
	 */
	public function formatMsgSwLvsLizenzanzahl0($groupedLvs)
	{
		$messages = [];

		// Loop through each group and prepare the emails
		foreach ($groupedLvs as $oe_kurzbz => $items) {

			// Start table tag
			$table = '<table style="border-collapse: collapse; width: 100%;">';
			$table .= '<tr>
						<th style="border: 1px solid #000; padding: 8px;">Studiengang-OE</th>
						<th style="border: 1px solid #000; padding: 8px;">OrgForm</th>
						<th style="border: 1px solid #000; padding: 8px;">Lehrveranstaltung</th>
						<th style="border: 1px solid #000; padding: 8px;">Software</th>
						<th style="border: 1px solid #000; padding: 8px;">User-Anzahl</th>
					</tr>';

			// Loop items in Fakultät
			foreach ($items as $item) {
				$table .= '<tr>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . strtoupper($item->stg_oe_kurzbz) . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->orgform_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->bezeichnung . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->software_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">0</td>';    // Set Lizenzanzahl 0
				$table .= '</tr>';
			}
			// Close table tag
			$table .= '</table>';

			$message = "
				<p>
					<b>Lizenzpflichtige Software ohne User-Anzahl</b>
				</p>
			";
			$message .= $table;
			$messages[] = ['oe_kurzbz' => $oe_kurzbz, 'message' => $message];
		}

		return $messages;
	}

	/**
	 * Prepare email message regarding SwLvs with Expired Status like 'end of life' and 'nicht verfügbar'.
	 *
	 * @param $groupedLvs	Lvs grouped by Fakultät of the LV Studiengang
	 * @return array key: oe_kurzbz of Fakultät, value: html message like text and tables
	 */
	public function formatMsgExpiredSwStatSwLvs($groupedLvs)
	{
		$messages = [];

		// Loop through each group and prepare the emails
		foreach ($groupedLvs as $oe_kurzbz => $items) {

			// Start table tag
			$table = '<table style="border-collapse: collapse; width: 100%;">';
			$table .= '<tr>
						<th style="border: 1px solid #000; padding: 8px;">Studiengang-OE</th>
						<th style="border: 1px solid #000; padding: 8px;">OrgForm</th>
						<th style="border: 1px solid #000; padding: 8px;">Lehrveranstaltung</th>
						<th style="border: 1px solid #000; padding: 8px;">Software</th>
					</tr>';

			// Loop items in Fakultät
			foreach ($items as $item) {
				$table .= '<tr>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . strtoupper($item->stg_oe_kurzbz) . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->orgform_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->bezeichnung . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->software_kurzbz . '</td>';
				$table .= '</tr>';
			}
			// Close table tag
			$table .= '</table>';

			$message = "
				<p>
					<b>Ablaufende Software</b></br>
					Der Softwarestatus wurde auf 'End of Life' oder 'Nicht verfügbar' geändert und kann nicht mehr bestellt werden.
				</p>
			";
			$message .= $table;
			$messages[] = ['oe_kurzbz' => $oe_kurzbz, 'message' => $message];
		}

		return $messages;
	}

	/**
	 * Prepare email message for edited Quellkurs SwLv (when SW is changed or updated to higher version).
	 *
	 * @param $lehrveranstaltung_id
	 * @param $old_software_id
	 * @param $updated_software_id
	 * @return string
	 */
	public function formatMsgQuellkursSwLvEdited($lehrveranstaltung_id, $old_software_id, $updated_software_id){
		$lvBezeichnung = $this->_getLvBezeichnung($lehrveranstaltung_id);
		$oldSwKurzbzAndVersion = $this->_getSwKurzbzAndVersion($old_software_id);
		$updatedSwKurzbzAndVersion = $this->_getSwKurzbzAndVersion($updated_software_id);

		return "<p><b>". 'Softwarebestellung von Softwarebeauftragten über den Quellkurs geändert'. "</b></p>".
			'Software geändert für LV '. $lvBezeichnung. ': '. $oldSwKurzbzAndVersion. ' GEÄNDERT ZU '. $updatedSwKurzbzAndVersion;
	}

	/**
	 * Prepare email message for deleted Quellkurs SwLv.
	 *
	 * @param $lehrveranstaltung_id
	 * @param $deleted_software_id
	 * @return string
	 */
	public function formatMsgQuellkursSwLvDeleted($lehrveranstaltung_id, $deleted_software_id){
		$lvBezeichnung = $this->_getLvBezeichnung($lehrveranstaltung_id);
		$deletedSwKurzbzAndVersion = $this->_getSwKurzbzAndVersion($deleted_software_id);

		return "<p><b>". 'Softwarebestellung von Softwarebeauftragten über den Quellkurs gelöscht'. "</b></p>".
			'Softwarebestellung gelöscht für LV '. $lvBezeichnung. ' + Software '. $deletedSwKurzbzAndVersion;
	}

	public function formatMsgAbbestellteSwLvs($groupedData)
	{
		$messages = [];
		// Loop through each group and prepare the emails
		foreach ($groupedData as $oe_kurzbz => $items) {

			// Start table tag
			$table = '<table style="border-collapse: collapse; width: 100%;">';
			$table .= '<tr>
						<th style="border: 1px solid #000; padding: 8px;">Studiengang-OE</th>
						<th style="border: 1px solid #000; padding: 8px;">OrgForm</th>
						<th style="border: 1px solid #000; padding: 8px;">Lehrveranstaltung</th>
						<th style="border: 1px solid #000; padding: 8px;">Software</th>
					</tr>';

			// Loop items in Fakultät
			foreach ($items as $item) {
				$table .= '<tr>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . strtoupper($item->stg_oe_kurzbz) . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->orgform_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->bezeichnung . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->software_kurzbz . '</td>';
				$table .= '</tr>';
			}
			// Close table tag
			$table .= '</table>';

			$message = "
				<p>
					<b>Softwarebestellungen wurden abbestellt</b></br>
					Folgende SW-Bestellungen wurden abbestellt:.
				</p>
			";
			$message .= $table;
			$messages[] = ['oe_kurzbz' => $oe_kurzbz, 'message' => $message];

		}

		return $messages;
	}

	/**
	 * Group messages by Fakultät.
	 *
	 * @param $messages Must have key: oe_kurzbz of Fakultät, value: html message like text and tables.
	 * @return array
	 */
	public function groupMessagesByFakultaet($messages) {
		$messagesGroupedByFak = [];

		foreach ($messages as $msg) {
			$oe_kurzbz = $msg['oe_kurzbz'];
			$message = $msg['message'];

			if (isset($messagesGroupedByFak[$oe_kurzbz])) {
				$messagesGroupedByFak[$oe_kurzbz][] = $message;
			} else {
				$messagesGroupedByFak[$oe_kurzbz] = [$message];
			}
		}

		return $messagesGroupedByFak;
	}

	/**
	 * Send mail to Softwarebeauftragte.
	 *
	 * @param string $oe_kurzbz	oe_kurzbz of Fakultät
	 * @param $messages
	 */
	public function sendMailToSoftwarebeauftragte($oe_kurzbz, $messages)
	{
		// Get authorized uids
		$this->_ci->load->model('system/Benutzerrolle_model', 'BenutzerrolleModel');
		$result = $this->_ci->BenutzerrolleModel->getBenutzerByBerechtigung(
			self::PERMISSION_SOFTWARE_BESTELLEN,
			$oe_kurzbz
		);

		// Continue if no authenticated user found
		if (!hasData($result))
		{
			return;
		}

		// Create mail receiver
		$to = [];
		foreach(getData($result) as $authUser)
		{
			$to[] = $authUser->uid . '@' . DOMAIN;
		}

		// Set mail attributes
		$to = implode(',', $to);
		$subject = "Softwarebereitstellung - Updates";
		$message = is_array($messages) ? implode('<br>', $messages) : $messages;

		return $this->_ci->maillib->send(
			'', // From
			$to,
			$subject,
			$message
		);
	}


	// Job Funktionen für Softwaremanager
	//------------------------------------------------------------------------------------------------------------------
	/**
	 * Get new SwLvs that were inserted today.
	 * Only of type 'lv' (no templates).
	 * @return mixed
	 */
	public function getNewSwLvsFrom($string_date = 'TODAY'){
		$this->_ci->SoftwareLvModel->addDistinct('software_id, lehrveranstaltung_id, studiensemester_kurzbz');
		$this->_ci->SoftwareLvModel->addJoin('extension.tbl_software', 'software_id');
		$this->_ci->SoftwareLvModel->addJoin('lehre.tbl_lehrveranstaltung', 'lehrveranstaltung_id');
		$this->_ci->SoftwareLvModel->addOrder('oe_kurzbz');
		$this->_ci->SoftwareLvModel->addOrder('software_kurzbz');
		$this->_ci->SoftwareLvModel->addOrder('software_lv_id', 'DESC');
		return $this->_ci->SoftwareLvModel->loadWhere('
			-- only lvs (exclude templates)
			lehrtyp_kurzbz = \'lv\' AND
			(tbl_software_lv.insertamum)::date = date \''. $string_date .'\'
		'
		);
	}

	/**
	 * Get changed SwLvs that were updated today. (e.g. update of lizenzanzahl or update of software)
	 * Only of type 'lv' (no templates).
	 * @return mixed
	 */
	public function getChangedSwLvsFrom($string_date = 'TODAY'){
		$this->_ci->SoftwareLvModel->addDistinct('software_id, lehrveranstaltung_id, studiensemester_kurzbz');
		$this->_ci->SoftwareLvModel->addJoin('extension.tbl_software', 'software_id');
		$this->_ci->SoftwareLvModel->addJoin('lehre.tbl_lehrveranstaltung', 'lehrveranstaltung_id');
		$this->_ci->SoftwareLvModel->addOrder('oe_kurzbz');
		$this->_ci->SoftwareLvModel->addOrder('software_kurzbz');
		$this->_ci->SoftwareLvModel->addOrder('software_lv_id', 'DESC');
		return $this->_ci->SoftwareLvModel->loadWhere('
			-- only lvs (exclude templates)
			lehrtyp_kurzbz = \'lv\' AND
			-- exclude todays inserts
			(tbl_software_lv.insertamum)::date != date \''. $string_date .'\' AND
			-- filter todays changes
			(tbl_software_lv.updateamum)::date = date \''. $string_date .'\'
		'
		);
	}

	/**
	 * Format array of new SwLvs as table.
	 * @param array | $newSwLvs
	 * @return string
	 */
	public function formatMsgNewSwLvs($newSwLvs)
	{
		$message = '';

		if (is_array($newSwLvs) && count($newSwLvs) > 0)
		{
			// Start table tag
			$table = '<table style="border-collapse: collapse; width: 100%;">';
			$table .= '<tr>
							<th style="border: 1px solid #000; padding: 8px;">Studiensemester</th>
							<th style="border: 1px solid #000; padding: 8px;">OE</th>
							<th style="border: 1px solid #000; padding: 8px;">OrgForm</th>
							<th style="border: 1px solid #000; padding: 8px;">LV</th>
							<th style="border: 1px solid #000; padding: 8px;">Software</th>
							<th style="border: 1px solid #000; padding: 8px;">User-Anzahl</th>
						</tr>';

			// Loop items in Fakultät
			foreach ($newSwLvs as $newSwLv) {
				$table .= '<tr>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $newSwLv->studiensemester_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $newSwLv->oe_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $newSwLv->orgform_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $newSwLv->bezeichnung . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $newSwLv->software_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $newSwLv->lizenzanzahl . '</td>';
				$table .= '</tr>';
			}
			// Close table tag
			$table .= '</table>';

			$message = "
					<p>
					<b>Neue Softwarebestellung für die Lehre</b>
					</p>
				";
			$message .= $table;

			$message .= "<br>";
		}

		return $message;
	}

	/**
	 * Format array of changed SwLvs as table.
	 * @param array | $changedSwLvs
	 * @return string
	 */
	public function formatMsgChangedSwLvs($changedSwLvs)
	{
		$message = '';

		if (is_array($changedSwLvs) && count($changedSwLvs) > 0)
		{
			// Start table tag
			$table = '<table style="border-collapse: collapse; width: 100%;">';
			$table .= '<tr>
							<th style="border: 1px solid #000; padding: 8px;">Studiensemester</th>
							<th style="border: 1px solid #000; padding: 8px;">OE</th>
							<th style="border: 1px solid #000; padding: 8px;">OrgForm</th>
							<th style="border: 1px solid #000; padding: 8px;">LV</th>
							<th style="border: 1px solid #000; padding: 8px;">Software</th>
							<th style="border: 1px solid #000; padding: 8px;">User-Anzahl</th>
						</tr>';

			// Loop items in Fakultät
			foreach ($changedSwLvs as $changedSwLv) {
				$table .= '<tr>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $changedSwLv->studiensemester_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $changedSwLv->oe_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $changedSwLv->orgform_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $changedSwLv->bezeichnung . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $changedSwLv->software_kurzbz . '</td>';
				$table .= '<td style="border: 1px solid #000; padding: 4px;">' . $changedSwLv->lizenzanzahl . '</td>';
				$table .= '</tr>';
			}
			// Close table tag
			$table .= '</table>';

			$message = "
					<p>
					<b>Geänderte Softwarebestellung für die Lehre</b><br>
					 Geänderte User-Anzahl oder geänderte Software.
					</p>
				";
			$message .= $table;

			$message .= "<br>";
		}

		return $message;
	}

	/**
	 * Format array of software with licenses close to expiration as table.
	 * @param array | $swLicencesWillEnd
	 * @return string
	 */
	public function formatMsgSwLicencesWillEnd($swLicencesWillEnd)
	{
		$message = '';

		$today = new DateTime();
		$today->add(new DateInterval('P10W'));
		$in10WeeksDate = $today->format('d.m.Y');

		if (is_array($swLicencesWillEnd) && count($swLicencesWillEnd) > 0)
		{
			// Start table tag
			$table = '<table style="border-collapse: collapse; width: 100%;">';
			$table .= '<tr>
							<th style="border: 1px solid #000; padding: 8px;">SW-ID</th>
							<th style="border: 1px solid #000; padding: 8px;">SW-Typ</th>
							<th style="border: 1px solid #000; padding: 8px;">SW-Kurzbezeichnung</th>
							<th style="border: 1px solid #000; padding: 8px;">Lizenzlaufzeit</th>
						</tr>';

			// Loop items in Fakultät
			foreach ($swLicencesWillEnd as $sw) {
				$table.= '<tr>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->software_id. '</td>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->bezeichnung. '</td>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->software_kurzbz. '</td>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. (new DateTime($sw->lizenzlaufzeit))->format('d.m.Y'). '</td>';
				$table.= '</tr>';
			}
			// Close table tag
			$table .= '</table>';

			$message = "
					<p>
					<b>SW-Lizenzlaufzeit endet in 10 Wochen</b><br>
					 SW-Lizenzlaufzeit endet in 10 Wochen am ". $in10WeeksDate. ".
					</p>
				";
			$message .= $table;

			$message .= "<br>";
		}

		return $message;
	}

	/**
	 * Format array of software with licenses ended as table.
	 * @param array | $swLicencesEnded
	 * @return string
	 */
	public function formatMsgSwLicencesEnded($swLicencesEnded)
	{
		$message = '';

		if (is_array($swLicencesEnded) && count($swLicencesEnded) > 0)
		{
			// Start table tag
			$table = '<table style="border-collapse: collapse; width: 100%;">';
			$table .= '<tr>
							<th style="border: 1px solid #000; padding: 8px;">SW-ID</th>
							<th style="border: 1px solid #000; padding: 8px;">SW-Typ</th>
							<th style="border: 1px solid #000; padding: 8px;">SW-Kurzbezeichnung</th>
							<th style="border: 1px solid #000; padding: 8px;">Lizenzart</th>
							<th style="border: 1px solid #000; padding: 8px;">Lizenzlaufzeit</th>
						</tr>';

			// Loop items in Fakultät
			foreach ($swLicencesEnded as $sw) {
				$table.= '<tr>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->software_id. '</td>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->bezeichnung. '</td>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->software_kurzbz. '</td>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->lizenzart. '</td>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. (new DateTime($sw->lizenzlaufzeit))->format('d.m.Y'). '</td>';
				$table.= '</tr>';
			}
			// Close table tag
			$table .= '</table>';

			$message = "
					<p>
					<b>Lizenzlaufzeit für lizenzpflichtige SW abgelaufen</b><br>
					Prüfen Sie, ob es aktive Anforderungen durch die Lehre gibt.<br>
					Die Lizenzlaufzeit muss entsprechend verlängert, oder die SW abbestellt werden.
					</p>
				";
			$message .= $table;

			$message .= "<br>";
		}

		return $message;
	}

	/**
	 * Format array of uninstalled software as table.
	 *
	 * @param array | $swLicencesEnded
	 * @return string
	 */
	public function formatMsgUninstalledSw($uninstalledSw)
	{
		$message = '';

		if (is_array($uninstalledSw) && count($uninstalledSw) > 0)
		{
			// Start table tag
			$table = '<table style="border-collapse: collapse; width: 100%;">';
			$table .= '
				<tr>
					<th style="border: 1px solid #000; padding: 8px;">SW-ID</th>
					<th style="border: 1px solid #000; padding: 8px;">SW-Kurzbezeichnung</th>
					<th style="border: 1px solid #000; padding: 8px;">Version</th>
					<th style="border: 1px solid #000; padding: 8px;">Softwarestatus</th>
				</tr>';

			// Loop items in Fakultät
			foreach ($uninstalledSw as $sw) {
				$table.= '<tr>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->software_id. '</td>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->software_kurzbz. '</td>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->version. '</td>';
				$table.= '<td style="border: 1px solid #000; padding: 4px;">'. $sw->softwarestatus_bezeichnung. '</td>';
				$table.= '</tr>';
			}
			// Close table tag
			$table .= '</table>';

			$message = "
					<p>
					<b>Bestellte SW noch nicht verfügbar</b><br>
					Prüfen/ändern Sie den Status. Gegebenenfalls muss die SW noch installiert werden.
					</p>
				";
			$message .= $table;

			$message .= "<br>";
		}

		return $message;
	}

	/**
	 * Send mail to Softwaremanager.
	 *
	 * @param $oe_kurzbz
	 * @param $messages
	 */
	public function sendMailToSoftwaremanager($messages)
	{
		// Create mail receiver
		$to = [];

		if ($this->_ci->config->item('email_softwaremanager'))
		{
			// Get email from config variable
			$to[] = $this->_ci->config->item('email_softwaremanager');
		}
		else
		{
			// Get authorized uids
			$this->_ci->load->model('system/Benutzerrolle_model', 'BenutzerrolleModel');
			$result = $this->_ci->BenutzerrolleModel->getBenutzerByBerechtigung(
				self::PERMISSION_SOFTWARE_VERWALTEN
			);

			// Continue if no authenticated user found
			if (!hasData($result)) {
				return;
			}

			foreach (getData($result) as $authUser) {
				$to[] = $authUser->uid . '@' . DOMAIN;
			}
		}

		// Set mail attributes
		$to = implode(',', $to);
		$subject = "Softwarebereitstellung - Updates";
		$message = is_array($messages) ? implode('<br>', $messages) : $messages;

		return $this->_ci->maillib->send(
			'', // From
			$to,
			$subject,
			$message
		);
	}

	// -----------------------------------------------------------------------------------------------------------------
	// PRIVATE FUNCTIONS
	// -----------------------------------------------------------------------------------------------------------------
	/**
	 * Get Software Bezeichnung and Version by given Software.
	 *
	 * @param $software_id
	 * @return string	Returns like this: Software ABC [Version: 1.1]
	 */
	private function _getSwKurzbzAndVersion($software_id){
		$this->_ci->SoftwareModel->addSelect('software_kurzbz, version');
		$result = $this->_ci->SoftwareModel->load($software_id);

		return hasData($result) ? getData($result)[0]->software_kurzbz. ' [Version: '. getData($result)[0]->version. ']' : '';
	}

	/**
	 * Get Lehrveranstaltung Bezeichnung by given Lehrveranstaltung.
	 *
	 * @param $lehrveranstaltung_id
	 * @return string
	 */
	private function _getLvBezeichnung($lehrveranstaltung_id){
		$this->_ci->LehrveranstaltungModel->addSelect('bezeichnung');
		$result = $this->_ci->LehrveranstaltungModel->load($lehrveranstaltung_id);

		return hasData($result) ? getData($result)[0]->bezeichnung : '';
	}
}
