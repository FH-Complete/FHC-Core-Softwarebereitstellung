<?php
class Software_model extends DB_Model
{

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_software';
		$this->pk = 'software_id';
	}

	/**
	 * Insert new Software plus new Softwarestatus.
	 * Rollback on error.
	 *
	 * @param $software object
	 * @param $softwarestatus_kurzbz string
	 * @return mixed
	 */
	public function insertSoftwarePlus($software, $softwarestatus_kurzbz)
    {
        // Start DB transaction
        $this->db->trans_start(false);

        // Insert Software
        $result = $this->insert($software);

        // Store just inserted software_id
        $lastInsert_id = getData($result);

        // Insert Softwarestatus
        $this->load->model('SoftwareSoftwarestatus_Model', 'SoftwareSoftwarestatusModel');
        $this->SoftwareSoftwarestatusModel->insert(
            array(
                'software_id' => $lastInsert_id,
                'datum' => 'NOW()',
                'softwarestatus_kurzbz' => $softwarestatus_kurzbz,
                'uid' => getAuthUID()
            )
        );

        // Transaction complete
        $this->db->trans_complete();

        if ($this->db->trans_status() === false) {
            $this->db->trans_rollback();
            return error('Failed inserting Anrechnung', EXIT_ERROR);
        }

        return success($lastInsert_id);
    }

	/**
	 * Update Software plus insert new Softwarestatus.
	 * Rollback on error.
	 *
	 * @param $software object
	 * @param $softwarestatus_kurzbz string
	 * @return mixed
	 */
	public function updateSoftwarePlus($software, $softwarestatus_kurzbz)
	{
		// Start DB transaction
		$this->db->trans_start(false);

		// Update Software
		$this->update($software->software_id, $software);

		// Insert newer Softwarestatus
		$this->load->model('SoftwareSoftwarestatus_Model', 'SoftwareSoftwarestatusModel');
		$this->SoftwareSoftwarestatusModel->changeSoftwarestatus(
			array($software->software_id),
			$softwarestatus_kurzbz
		);

		// Transaction complete
		$this->db->trans_complete();

		if ($this->db->trans_status() === false)
		{
			$this->db->trans_rollback();
			return error('Fehler beim Update der Software', EXIT_ERROR);
		}

		return success();
	}
}
