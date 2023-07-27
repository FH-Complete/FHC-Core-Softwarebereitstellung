<?php
class SoftwareimageOrt_model extends DB_Model
{

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_softwareimage_ort';
		$this->pk = array('softwareimage_id', 'ort_kurzbz');
	}

	/**
	 * Get Orte of a Software
	 */
	public function getOrtBySoftware($software_id)
	{
		return $this->execQuery('
			SELECT
				swimage.bezeichnung AS image,
				swimage.verfuegbarkeit_start AS image_verfuegbarkeit_start, swimage.verfuegbarkeit_ende AS image_verfuegbarkeit_ende,
				swimage_ort.verfuegbarkeit_start AS ort_verfuegbarkeit_start, swimage_ort.verfuegbarkeit_ende AS ort_verfuegbarkeit_ende,
				ort.ort_kurzbz, ort.bezeichnung AS ort_bezeichnung
			FROM
				extension.tbl_software sw
				JOIN extension.tbl_softwareimage_software USING (software_id)
				JOIN extension.tbl_softwareimage swimage USING (softwareimage_id)
				JOIN extension.tbl_softwareimage_ort swimage_ort USING (softwareimage_id)
				JOIN public.tbl_ort ort USING (ort_kurzbz)
			WHERE
				sw.software_id = ?',
			array(
				$software_id
			)
		);
	}
}
