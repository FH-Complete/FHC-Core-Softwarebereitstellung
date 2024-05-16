<?php
if (! defined('BASEPATH')) exit('No direct script access allowed');

class SoftwareLib
{
	private $_ci; // Code igniter instance

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
}