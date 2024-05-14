import {CoreRESTClient} from '../../../../../js/RESTClient.js';
import CoreForm from '../../../../../js/components/Form/Form.js';
import CoreFormInput from '../../../../../js/components/Form/Input.js';
import CoreFormValidation from '../../../../../js/components/Form/Validation.js';

export const Lizenzserver = {
	components: {
		CoreForm,
		CoreFormInput,
		CoreFormValidation
	},
	emits: [
		'onSaved'
	],
	data() {
		return {
			lizenzserver_kurzbz: null,
			lizenzserver: {},
		}
	},
	methods: {
		prefill(lizenzserver_kurzbz) {
			this.lizenzserver_kurzbz = lizenzserver_kurzbz;

			if (this.lizenzserver_kurzbz !== null) {
				// Get Softwarelizenzserver
				CoreRESTClient.get('/extensions/FHC-Core-Softwarebereitstellung/components/Lizenzserver/getLizenzserver',
					{
						lizenzserver_kurzbz: lizenzserver_kurzbz
					}
				).then(
					result => {
						if (CoreRESTClient.isError(result.data)) {
							this.$fhcAlert.alertWarning(CoreRESTClient.getError(result.data));
						}
						else {
							if (CoreRESTClient.hasData(result.data)) {
								// Prefill form with softwareimage
								this.lizenzserver = CoreRESTClient.getData(result.data);
							}
						}
					}
				).catch(
					error => {
						this.$fhcAlert.handleSystemError(error);
					}
				);

			}
		},
		save(){
			// Decide if create or update lizenzserver
			let method = this.lizenzserver_kurzbz === null ? 'createLizenzserver' : 'updateLizenzserver';

			if (this.$refs.lizenzserverForm)
				this.$refs.lizenzserverForm
					.post('extensions/FHC-Core-Softwarebereitstellung/fhcapi/Lizenzserver/' + method, {
						lizenzserver: this.lizenzserver,
					})
					.then(result => {
						this.$emit('onSaved');
						this.$fhcAlert.alertSuccess(this.$p.t('global/gespeichert'));
					})
					.catch(error => this.$fhcAlert.handleSystemError(error));
		},
		reset(){
			this.$refs.lizenzserverForm.clearValidation();
			this.lizenzserver_kurzbz = null;
			this.lizenzserver = {};
		}
	},
	template: `
	<div>
		<core-form ref="lizenzserverForm" class="row gy-3">
			<core-form-validation></core-form-validation>
			<div class="col-sm-4">
				<core-form-input
					v-model="lizenzserver.lizenzserver_kurzbz"
					name="lizenzserver_kurzbz"
					:label="$p.t('global/lizenzserverKurzbz')"
					:disabled="lizenzserver_kurzbz !== null"
				>
				</core-form-input>
			</div>
			<div class="col-sm-8">
				<core-form-input
					v-model="lizenzserver.bezeichnung"
					name="bezeichnung"
					:label="$p.t('global/bezeichnung')"
				>
				</core-form-input>
			</div>
			<div class="col-sm-4">
				<core-form-input
					v-model="lizenzserver.macadresse"
					name="macadresse"
					label="Mac-Adresse"
				>
				</core-form-input>
			</div>
			<div class="col-sm-4">
				<core-form-input
					v-model="lizenzserver.ipadresse"
					name="ipadresse"
					label="IP-Adresse"
				>
				</core-form-input>
			</div>
			<div class="col-sm-4">
				<core-form-input
					v-model="lizenzserver.location"
					name="location"
					label="Location"
				>
				</core-form-input>
			</div>
			<div class="col-sm-6">
				<core-form-input
					v-model="lizenzserver.ansprechpartner"
					name="ansprechpartner"
					:label="$p.t('global/ansprechpartner')"
				>
				</core-form-input>
			</div>
			<div class="col-sm-6">
				<core-form-input
					type="textarea"
					v-model="lizenzserver.anmerkung"
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
