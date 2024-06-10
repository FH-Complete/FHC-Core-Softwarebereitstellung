import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import CoreForm from '../../../../../js/components/Form/Form.js';
import CoreFormInput from '../../../../../js/components/Form/Input.js';
import CoreFormValidation from '../../../../../js/components/Form/Validation.js';

export const Softwareimage = {
	components: {
		AutoComplete: primevue.autocomplete,
		"datepicker": VueDatePicker,
		CoreForm,
		CoreFormInput,
		CoreFormValidation
	},
	emits: [
		'onSaved'
	],
	data() {
		return {
			softwareimageId: null,
			softwareimage: {},
			copy: false
		}
	},
	methods: {
		prefill(softwareimage_id, copy) {
			this.softwareimageId = softwareimage_id;
			this.copy = copy;

			if (Number.isInteger(this.softwareimageId)) {
				// Get softwareimage
				CoreRESTClient.get('/extensions/FHC-Core-Softwarebereitstellung/components/Image/getImage',
					{
						softwareimage_id: softwareimage_id
					}
				).then(
					result => {
						if (CoreRESTClient.isError(result.data)) {
							this.$fhcAlert.alertWarning(CoreRESTClient.getError(result.data));
						}
						else {
							if (CoreRESTClient.hasData(result.data)) {
								// Prefill form with softwareimage
								this.softwareimage = CoreRESTClient.getData(result.data);
							}
						}
					}
				).catch(
					error => { this.$fhcAlert.handleSystemError(error); }
				);

			}
		},
		save(){
			// Decide if copy, create or update image
			if (this.copy === true) {
				var method = 'copyImageAndOrte';
			}
			else {
				var method = Number.isInteger(this.softwareimageId) ? 'updateImage' : 'createImage';
			}

			if (this.$refs.softwareimageForm)
				this.$refs.softwareimageForm
					.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Image/' + method, {
						softwareimage: this.softwareimage}
					)
					.then(result => {
						if (method == 'copyImageAndOrte')
						{
							this.$fhcAlert.alertDefault(
								'success',
								this.$p.t('global/gespeichert'),
								this.$p.t('global/imageverwaltungImageCopySuccessText'),
								true
							);
						}
						else
						{
							this.$fhcAlert.alertSuccess(this.$p.t('global/gespeichert'));
						}
						this.$emit('onSaved');
					})
					.catch(this.$fhcAlert.handleSystemError);
		},
		reset(){
			this.$refs.softwareimageForm.clearValidation();
			this.softwareimageId = null;
			this.softwareimage = {};
			this.copy = false;
		}
	},
	template: `
	<div>
		<core-form ref="softwareimageForm" class="row gy-3">
			<core-form-validation></core-form-validation>
			<div class="col-sm-6">
				<core-form-input
					v-model="softwareimage.bezeichnung"
					name="bezeichnung"
					:label="$p.t('global/bezeichnung')"
				>
				</core-form-input>
			</div>
			<div class="col-sm-6">
			<core-form-input
					v-model="softwareimage.betriebssystem"
					name="betriebssystem"
					:label="$p.t('global/betriebssystem')"
				>
				</core-form-input>
			</div>
			<div class="col-sm-3">
				<core-form-input
					type="datepicker"
					v-model="softwareimage.verfuegbarkeit_start"
					name="verfuegbarkeit_start"
					:label="$p.t('global/verfuegbarkeitStart')"
					locale="de"
					format="dd.MM.yyyy"
					model-type="yyyy-MM-dd"
					:enable-time-picker="false"
					:placeholder="'TT.MM.YY'"
					:text-input="true"
					:auto-apply="true"
					>
				</core-form-input>
			</div>
			<div class="col-sm-3">
				<core-form-input
					type="datepicker"
					v-model="softwareimage.verfuegbarkeit_ende"
					name="verfuegbarkeit_ende"
					:label="$p.t('global/verfuegbarkeitEnde')"
					locale="de"
					format="dd.MM.yyyy"
					model-type="yyyy-MM-dd"
					:enable-time-picker="false"
					:placeholder="'TT.MM.YY'"
					:text-input="true"
					:auto-apply="true"
					>
				</core-form-input>
			</div>
			<div class="col-sm-6">
				<core-form-input
					type="textarea"
					v-model="softwareimage.anmerkung"
					name="anmerkung"
					:label="$p.t('global/anmerkung')"
					rows="5"
				>
				</core-form-input>
			</div>
		</core-form>
	</div>
	`
}
