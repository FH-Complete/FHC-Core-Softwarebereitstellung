import BsModal from '../../../../../js/components/Bootstrap/Modal.js';
import {SoftwareForm} from '../Form/Software.js';

export default {
	components: {
		BsModal,
		SoftwareForm
	},
	emits: [
		'softwareSaved'
	],
	mixins: [
		BsModal
	],
	data: function() {
		return {
			title: String
		}
	},
	mounted() {
		this.modal = this.$refs.modalContainer.modal;
	},
	methods: {
		onHiddenBsModal() {
			this.$refs.softwareFormCmpt.resetSoftware();
		},
		onBsModalSave() {
			this.$refs.softwareFormCmpt.saveSoftware();
		},
		handleSoftwareFormSaved() {
			this.$emit('softwareSaved');
		},
		openSoftwareModal(software_id) {
			// Prefill form with Softwaredata
			this.title = software_id ? this.$p.t('global/softwareBearbeiten') : this.$p.t('global/softwareAnlegen');
			this.$refs.softwareFormCmpt.prefillSoftware(software_id);
			this.$refs.modalContainer.show();
		}
	},
	template: `
		<bs-modal ref="modalContainer" class="bootstrap-prompt" v-bind="$props" @hidden-bs-modal="onHiddenBsModal">
			<template v-slot:title>{{title}}</template>
			<template v-slot:default>
				<software-form ref="softwareFormCmpt" @software-form-saved="handleSoftwareFormSaved"></software-form>
			</template>
			<template v-slot:footer>
				<button type="button" class="btn btn-primary" @click="onBsModalSave">{{ $p.t('global/speichern') }}</button>
			</template>
		</bs-modal>
	`
}
