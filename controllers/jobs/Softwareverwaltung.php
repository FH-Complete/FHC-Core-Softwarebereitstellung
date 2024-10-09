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
	}

	/**
	 * Job to send email notifications for software licenses approaching expiration within 6 weeks.
	 */
	public function sendMailSoftwareLizenzlaufzeitEnde(){

		$this->logInfo('Start Job sendMailSoftwareLizenzlaufzeitEnde');

		// Get Software, where Lizenzlaufzeit ends in 6 weeks from now
		$result = $this->_ci->SoftwareModel->getSoftwareLizenzlaufzeitendeInInterval('6 WEEKS');

		if (isError($result))
		{
			$this->logError(getError($result));
		}

		if (!hasData($result))
		{
			$this->logInfo("Kein mail versendet, da keine SW-Lizenzen in 6 Wochen enden.");
		}

		// If SW was found...
		if (hasData($result))
		{
			$today = new DateTime();
			$today->add(new DateInterval('P6W'));
			$in6WeeksDate = $today->format('d.m.Y');

			// Start table tag
			$table = '<table>';
			$table.= '<tr><th>SW-ID</th><th>SW-Typ</th><th>SW-Kurzbezeichnung</th><th>Lizenzlaufzeit</th></tr>';

			// Loop Software
			foreach (getData($result) as $sw) {
				$table.= '<tr>';
				$table.= '<td>'. $sw->software_id. '</td>';
				$table.= '<td>'. $sw->bezeichnung. '</td>';
				$table.= '<td>'. $sw->software_kurzbz. '</td>';
				$table.= '<td>'. (new DateTime($sw->lizenzlaufzeit))->format('d.m.Y'). '</td>';
				$table.= '</tr>';
			}
			// Close table tag
			$table.= '</table>';

			// Mail attritutes
			$to = 'licences@'. DOMAIN;
			$subject = "SW-Lizenzlaufzeit endet in 6 Wochen am ". $in6WeeksDate. " (SW-Anzahl: ". count(getData($result)). ")";
			$message = "SW-Lizenzlaufzeit endet in 6 Wochen am ". $in6WeeksDate. " (SW-Anzahl: ". count(getData($result)). ")";
			$message.= $table;

			// Additional headers
			$headers = "MIME-Version: 1.0" . "\r\n";
			$headers.= "Content-type:text/html;charset=UTF-8" . "\r\n";

			// Send mail
			mail($to, $subject, $message, $headers);
		}

		$this->logInfo('Ende Job sendMailSoftwareLizenzlaufzeitEnde');
	}

	/**
	 * Job to automatically find and insert newly created standardised LV, whose LV template has already been
	 * assigned to SW, into DB table table_software_lv.
	 * Insert with Lizenzanzahl 0.
	 * Job also informs corresponding Softwarebeauftragte about newly created assignment.
	 *
	 */
	public function handleNewStandardisierteLv(){
		$this->logInfo('Start Job handleNewStandardisierteLv');

		// Get akt or next Studiensemester
		$this->load->model('organisation/Studiensemester_model', 'StudiensemesterModel');
		$result = $this->StudiensemesterModel->getAktOrNextSemester();
		$studiensemester_kurzbz = getData($result)[0]->studiensemester_kurzbz;

		// Get unassigned standardised Lehrveranstaltungen with the software_id from the corresponding template
		$result = $this->_ci->SoftwareLvModel->getUnassignedStandardLvsByTemplate($studiensemester_kurzbz);

		if (isError($result))
		{
			$this->logError(getError($result));
		}

		// Exit if no unassigned standardised Lvs found.
		if (!hasData($result))
		{
			$this->logInfo("End Job handleNewStandardisierteLv.");
			exit;
		}

		// Prepare insert batch data
		$unassignedStandardLvs = getData($result);
		$unassignedStandardLvsBatch = [];
		foreach ($unassignedStandardLvs as $item) {
			$unassignedStandardLvsBatch[] = [
				'software_id' => $item->software_id,
				'lehrveranstaltung_id' => $item->lehrveranstaltung_id,
				'studiensemester_kurzbz' => $item->studiensemester_kurzbz,
				'lizenzanzahl' => 0
			];
		}

		// Assign the unassigned standardised Lvs to software from the corresponding template
		$result = $this->_ci->SoftwareLvModel->insertBatch($unassignedStandardLvsBatch);

		if (isError($result))
		{
			$this->logError(getError($result));
		}

		$this->logInfo('End handleNewStandardisierteLv');
	}
}