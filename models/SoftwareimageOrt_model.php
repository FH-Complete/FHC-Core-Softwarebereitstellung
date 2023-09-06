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
		$this->hasSequence = false;
	}

	/**
	 * Get Orte of a Software
	 */
	public function getOrteBySoftware($software_id)
	{
		return $this->execQuery('
			SELECT
				swimage.softwareimage_id, swimage.bezeichnung AS image,
				swimage.verfuegbarkeit_start AS image_verfuegbarkeit_start, swimage.verfuegbarkeit_ende AS image_verfuegbarkeit_ende,
				swimage_ort.verfuegbarkeit_start, swimage_ort.verfuegbarkeit_ende,
				ort.ort_kurzbz, ort.bezeichnung AS ort_bezeichnung
			FROM
				extension.tbl_software sw
				JOIN extension.tbl_softwareimage_software USING (software_id)
				JOIN extension.tbl_softwareimage swimage USING (softwareimage_id)
				JOIN extension.tbl_softwareimage_ort swimage_ort USING (softwareimage_id)
				JOIN public.tbl_ort ort USING (ort_kurzbz)
			WHERE
				sw.software_id = ?
			ORDER BY ort_kurzbz, image',
			array(
				$software_id
			)
		);
	}

	/**
	 * Get Softwareimageorte by Image.
	 */
	public function getOrteByImage($softwareimage_id)
	{
		$qry = '
			SELECT
				swi.softwareimage_id,
			   	swi.bezeichnung AS image,
				swi.verfuegbarkeit_start AS image_verfuegbarkeit_start,
			    swi.verfuegbarkeit_ende AS image_verfuegbarkeit_ende,
			   	swiort.ort_kurzbz,
				swiort.verfuegbarkeit_start,
			   	swiort.verfuegbarkeit_ende,
				ort.bezeichnung AS ort_bezeichnung
			FROM extension.tbl_softwareimage_ort swiort
			JOIN extension.tbl_softwareimage swi USING (softwareimage_id)
			JOIN public.tbl_ort ort USING (ort_kurzbz)
			WHERE
				swiort.softwareimage_id = ?
			ORDER BY ort_kurzbz';

		return $this->execQuery($qry, array($softwareimage_id)
		);
	}
}
