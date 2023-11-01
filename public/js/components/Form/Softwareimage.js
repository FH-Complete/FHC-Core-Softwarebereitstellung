import {CoreRESTClient} from '../../../../../js/RESTClient.js';

export const Softwareimage = {
	components: {
		AutoComplete: primevue.autocomplete,
		"datepicker": VueDatePicker
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
							this.$fhcAlert.handleFormErrors(
								CoreRESTClient.getError(result.data), this.$refs.softwareimageForm
							);
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

			CoreRESTClient.post(
				'/extensions/FHC-Core-Softwarebereitstellung/components/Image/' + method,
				{
					softwareimage: this.softwareimage,
				}
			).then(
				result => {
					if (CoreRESTClient.isError(result.data))
					{
						this.$fhcAlert.handleFormErrors(
							CoreRESTClient.getError(result.data), this.$refs.softwareimageForm
						);
					}
					else
					{
						this.$fhcAlert.alertSuccess('Gespeichert!');
						this.$emit('onSaved');
					}
				}
			).catch(
				error => { this.$fhcAlert.handleSystemError(error); }
			);
		},
		reset(){
			this.softwareimageId = null;
			this.softwareimage = {};
			this.copy = false;
			this.$fhcAlert.resetFormErrors(this.$refs.softwareimageForm);
		}
	},
	template: `
	<div>
		<form ref="softwareimageForm" class="row gy-3">
			<div class="col-sm-6">
				<label class="form-label">Bezeichnung *</label>
				<input type="text" class="form-control" name="bezeichnung" v-model="softwareimage.bezeichnung" required >
			</div>
			<div class="col-sm-6">
				<label class="form-label">Betriebssystem</label>
				<input type="text" class="form-control" v-model="softwareimage.betriebssystem">
			</div>
			<div class="col-sm-3">
				<label class="form-label">Verfügbarkeit Start</label>
				<datepicker
					v-model="softwareimage.verfuegbarkeit_start"
					v-bind:enable-time-picker="false"
					v-bind:placeholder="'TT.MM.YY'"
					v-bind:text-input="true"
					v-bind:auto-apply="true"
					locale="de"
					format="dd.MM.yyyy"
					name="verfuegbarkeit_start"
					model-type="yyyy-MM-dd">
				</datepicker>
			</div>
			<div class="col-sm-3">
				<label class="form-label">Verfügbarkeit Ende</label>
				<datepicker
					v-model="softwareimage.verfuegbarkeit_ende"
					v-bind:enable-time-picker="false"
					v-bind:placeholder="'TT.MM.YY'"
					v-bind:text-input="true"
					v-bind:auto-apply="true"
					name="verfuegbarkeit_ende"
					locale="de"
					format="dd.MM.yyyy"
					model-type="yyyy-MM-dd">
				</datepicker>
			</div>
			<div class="col-sm-6">
				<label class="form-label">Anmerkung</label>
				<textarea
					class="form-control"
					v-model="softwareimage.anmerkung"
					rows="5">
				</textarea>
			</div>
		</form>
	</div>
	`
}
