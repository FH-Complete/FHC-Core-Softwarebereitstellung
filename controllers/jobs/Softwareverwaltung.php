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
			$subject = "SW-Lizenzlaufzeit endet in 6 Wochen am ". $in6WeeksDate. " (SW-Anzahl: ". numberOfElements(getData($result)). ")";
			$message = "SW-Lizenzlaufzeit endet in 6 Wochen am ". $in6WeeksDate. " (SW-Anzahl: ". numberOfElements(getData($result)). ")";
			$message.= $table;

			// Additional headers
			$headers = "MIME-Version: 1.0" . "\r\n";
			$headers.= "Content-type:text/html;charset=UTF-8" . "\r\n";

			// Send mail
			mail($to, $subject, $message, $headers);
		}

		$this->logInfo('Ende Job sendMailSoftwareLizenzlaufzeitEnde');
	}
}