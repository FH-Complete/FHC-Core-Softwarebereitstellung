<?php
if (! defined('BASEPATH')) exit('No direct script access allowed');

class SoftwareLib
{
	private $_ci; // Code igniter instance
	const PERMISSION_SOFTWARE_BESTELLEN = 'extension/software_bestellen';

	public function __construct()
	{
		$this->_ci =& get_instance();

		$this->_ci->load->model('extensions/FHC-Core-Softwarebereitstellung/Software_model', 'SoftwareModel');
		$this->_ci->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareSoftwarestatus_model', 'SoftwareSoftwarestatusModel');
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

	// JOBS & ALERTS
	// -----------------------------------------------------------------------------------------------------------------

	/**
	 * Load all Studiengang OEs and add corresponding Fakultät OE.
	 *
	 * @return array
	 */
	public function getStudiengaengeWithFakultaet(){

		// Load all Studiengang Oes
		$this->_ci->load->model('organisation/Organisationseinheit_model', 'OrganisationseinheitModel');

		$this->_ci->OrganisationseinheitModel->addSelect('oe_kurzbz, oe_parent_kurzbz');
		$this->_ci->OrganisationseinheitModel->addOrder('oe_parent_kurzbz');
		$result = $this->_ci->OrganisationseinheitModel->loadWhere([
			'organisationseinheittyp_kurzbz' => 'Studiengang',
			'aktiv' => true
		]);
		$stg_oe_arr = hasData($result) ? getData($result) : [];

		// Iterate Studiengang Oes
		foreach ($stg_oe_arr as $stg_oe) {

			// Get parents
			$result = $this->_ci->OrganisationseinheitModel->getParents($stg_oe->oe_kurzbz);

			// Iterate parents
			foreach (getData($result) as $parent_oe) {

				// Find and add Fakultät
				if (strpos($parent_oe->oe_kurzbz, 'fak') === 0) {
					$stg_oe->stg_fak_oe_kurzbz = $parent_oe->oe_kurzbz;
					break;  // Stop after finding the first match
				}

				// else set null
				else{
					$stg_oe->stg_fak_oe_kurzbz = NULL;
				}
			}
		}
		// Return result or []
		return $stg_oe_arr;
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
	 * Helper to group LVs by Fakultät of the LV Studiengang.
	 *
	 * @param $lv_arr
	 * @param $stg_oe_arr
	 * @return array
	 */
	public function groupLvsByFakultaet($lv_arr, $stg_oe_arr)
	{
		$grouped = [];

		foreach ($lv_arr as $item) {
			foreach ($stg_oe_arr as $stg_oe) {
				if ($item->stg_oe_kurzbz === $stg_oe->oe_kurzbz) {
					$item->stg_fak_oe_kurzbz = $stg_oe->stg_fak_oe_kurzbz;
				}
			}
			$grouped[$item->stg_fak_oe_kurzbz][] = $item;
		}

		return $grouped;
	}

	/**
	 * Prepare email message regarding newly assigned standardisied Lvs.
	 *
	 * @param $groupedLvs	Lvs grouped by Fakultät of the LV Studiengang
	 * @return array key: oe_kurzbz of Fakultät, value: html message like text and tables
	 */
	public function prepareMessagesNewlyAssignedStandardLvs($groupedLvs)
	{
		$messages = [];

		// Loop through each group and prepare the emails
		foreach ($groupedLvs as $oe_kurzbz => $items) {

			// Start table tag
			$table = '<table style="border-collapse: collapse;">';
			$table .= '<tr>
						<th style="border: 1px solid #000; padding: 8px;">Studiengang-OE</th> 
						<th style="border: 1px solid #000; padding: 8px;">Neue standardisierte LV</th>
						<th style="border: 1px solid #000; padding: 8px;">Software</th>
						<th style="border: 1px solid #000; padding: 8px;">User-Anzahl</th>
					</tr>';

			// Loop items in Fakultät
			foreach ($items as $item) {
				$table .= '<tr>';
				$table .= '<td style="border: 1px solid #000; padding: 8px;">' . $item->stg_oe_kurzbz . '</td>';
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
	 * @param $oe_kurzbz
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

		// Additional headers
		$headers = "MIME-Version: 1.0" . "\r\n";
		$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";

		// Send mail
		mail($to, $subject, $message, $headers);
	}
}