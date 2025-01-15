<?php
if (!defined('BASEPATH')) exit('No direct script access allowed');

class Softwareverwaltung extends JOB_Controller
{
	private $_ci; // Code igniter instance

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();

		$this->_ci =& get_instance();

		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/Software_model', 'SoftwareModel');
		$this->load->model('extensions/FHC-Core-Softwarebereitstellung/SoftwareLv_model', 'SoftwareLvModel');

		$this->load->library('extensions/FHC-Core-Softwarebereitstellung/SoftwareLib');
	}

	/**
	 * Executes multiple messages and sends a single summarizing mail to Softwaremanager.
	 */
	public function execJobsAndMailToSoftwaremanager(){

		$this->logInfo('Start execJobsAndMailToSoftwaremanager');

		// Message collector
		$allMessages = '';

		// Check if Planungsdeadline of actual Studienjahr is passed
		$isPlanungDeadlinePast = $this->softwarelib->isPlanningDeadlinePast();

		// Collect information only after planning deadline
		if ($isPlanungDeadlinePast)
		{
			// Task: Get Software-LV-Zuordnungen, that were inserted yesterday by SWB.
			// ---------------------------------------------------------------------------------------------------------
			$result = $this->softwarelib->getNewSwLvsFrom('YESTERDAY');
			if (isError($result)) $this->logError(getError($result));

			$newSwLvs = hasData($result) ? getData($result) : [];

			// Prepare msg string
			$msg = $this->softwarelib->formatMsgNewSwLvs($newSwLvs);

			// Add msg to msg collector
			$allMessages.= $msg;


			// Task: Get Software-LV-Zuordnungen, that were changed yesterday by SWB. (e.g. change of Lizenzanzahl)
			// ---------------------------------------------------------------------------------------------------------
			$result = $this->softwarelib->getChangedSwLvsFrom('YESTERDAY');
			if (isError($result)) $this->logError(getError($result));

			$changedSwLvs = hasData($result) ? getData($result) : [];

			// Prepare msg string
			$msg = $this->softwarelib->formatMsgChangedSwLvs($changedSwLvs);

			// Add msg to msg collector
			$allMessages.= $msg;
		}

		// Task: Get Software, where Lizenzlaufzeit ends in 10 weeks from now
		// -------------------------------------------------------------------------------------------------------------
		$result = $this->_ci->SoftwareModel->getSoftwareLizenzlaufzeitendeInInterval('10 WEEKS');
		if (isError($result)) $this->logError(getError($result));

		$swLicencesWillEnd = hasData($result) ? getData($result) : [];

		// Prepare msg string
		$msg = $this->softwarelib->formatMsgSwLicencesWillEnd($swLicencesWillEnd);

		// Add msg to msg collector
		$allMessages.= $msg;

		// Task: Get licensed Software (not open source), where Lizenzlaufzeit has end and Lizenzanzahl is 0
		// -------------------------------------------------------------------------------------------------------------
		$result = $this->_ci->SoftwareModel->getSoftwareLizenzAbgelaufen('YESTERDAY');
		if (isError($result)) $this->logError(getError($result));

		$swLicencesEnded = hasData($result) ? getData($result) : [];

		// Prepare msg string
		$msg = $this->softwarelib->formatMsgSwLicencesEnded($swLicencesEnded);

		// Add msg to msg collector
		$allMessages.= $msg;

		// Send email
		// -------------------------------------------------------------------------------------------------------------
		if ($allMessages !== '')
		{
			// Send email
			$this->softwarelib->sendMailToSoftwaremanager($allMessages);

			$this->logInfo('End execJobsAndMailToSoftwaremanager: Messages were sent by email.');
		}
		else
		{
			$this->logInfo('End execJobsAndMailToSoftwaremanager: No messages. No email sent.');
		}
	}

	/**
	 * Executes multiple messages and sends a single summarizing mail to Softwarebeauftragte.
	 *
	 * 1. task: Assign software to newly added standardized LVs whose LV templates are already linked to a software.
	 *
	 */
	public function execJobsAndMailToSoftwarebeauftragte(){

		$this->logInfo('Start execJobsAndMailToSoftwarebeauftragte');

		// Load all Studiengang OEs and add corresponding Fakultät OE
		$studiengangToFakultaetMap = $this->softwarelib->getStudiengaengeWithFakultaet();

		// Prepare to collect all messages
		$allMessages = [];

		// Task: Assign software to newly added standardized LVs
		// -------------------------------------------------------------------------------------------------------------
		$newlyAssignedLvs =  $this->softwarelib->handleUnassignedStandardLvs();

		if (count($newlyAssignedLvs) > 0)
		{
			// Group newly assigned Lvs
			$groupedLvsByFakultaet = $this->softwarelib->groupLvsByFakultaet(
				$newlyAssignedLvs,
				$studiengangToFakultaetMap
			);

			// Prepare and store messages
			$allMessages = array_merge(
				$allMessages,
				$this->softwarelib->formatMsgNewlyAssignedStandardLvs($groupedLvsByFakultaet)
			);
		}

		// Task: Notify if Lizenzanzahl is still 0 two weeks before the planning deadline.
		// -------------------------------------------------------------------------------------------------------------
		$isTwoWeeksBeforeDeadline = $this->softwarelib->isTwoWeeksBeforePlanningDeadline();
		
		if ($isTwoWeeksBeforeDeadline)
		{
			$result = $this->SoftwareLvModel->getWhereLizenzanzahl0();

			if (hasData($result))
			{
				$swlvsLizAnz0 = getData($result);

				// Group newly assigned Lvs
				$groupedLvsByFakultaet = $this->softwarelib->groupLvsByFakultaet(
					$swlvsLizAnz0,
					$studiengangToFakultaetMap
				);

				$allMessages = array_merge(
					$allMessages,
					$this->softwarelib->formatMsgSwLvsLizenzanzahl0($groupedLvsByFakultaet)
				);
			}
		}

		// Task: Notify if SW Status of SwLvs was set to 'End of Life' or 'Nicht verfügbar' yesterday.
		// -------------------------------------------------------------------------------------------------------------
		$result = $this->SoftwareLvModel->getExpiredSwStatusSwLvs('YESTERDAY');
		if (isError($result)) $this->logError(getError($result));

		if (hasData($result))
		{
			$expiredSwStatSwLvs = getData($result);

			// Group newly assigned Lvs
			$groupedLvsByFakultaet = $this->softwarelib->groupLvsByFakultaet(
				$expiredSwStatSwLvs,
				$studiengangToFakultaetMap
			);

			$allMessages = array_merge(
				$allMessages,
				$this->softwarelib->formatMsgExpiredSwStatSwLvs($groupedLvsByFakultaet)
			);
		}

		// Send email
		// -------------------------------------------------------------------------------------------------------------
		if (count($allMessages) > 0)
		{
			// Group messages by Fakultät OE before sending mails
			$messagesGroupedByFak = $this->softwarelib->groupMessagesByFakultaet($allMessages);

			// Send emails grouped by Fakultät
			foreach ($messagesGroupedByFak as $oe_kurzbz => $messages) {
				$this->softwarelib->sendMailToSoftwarebeauftragte($oe_kurzbz, $messages);
			}

			$this->logInfo('End execJobsAndMailToSoftwarebeauftragte: : Messages were sent by email.');
		}
		else
		{
			$this->logInfo('End execJobsAndMailToSoftwaremanager: No messages. No email sent.');
		}
	}
}