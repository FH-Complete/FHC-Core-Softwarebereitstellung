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
	props: {
		title: String,
		//~ dialogClass: {
			//~ type: [String,Array,Object],
			//~ default: 'modal-dialog-centered'
		//~ },
		/*
		 * NOTE(chris):
		 * Hack to expose in "emits" declared events to $props which we use
		 * in the v-bind directive to forward all events.
		 * @see: https://github.com/vuejs/core/issues/3432
		*/
		//~ onHideBsModal: Function,
		//~ onHiddenBsModal: Function,
		//~ onHidePreventedBsModal: Function,
		//onShowBsModal: Function,
		//~ onShownBsModal: Function
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
				<button type="button" class="btn btn-primary" @click="onBsModalSave">Speichern</button>
			</template>
		</bs-modal>
	`
}
