import BsModal from '../../../../../js/components/Bootstrap/Modal.js';
import {SoftwareForm} from '../Form/Software.js';

export default {
	components: {
		BsModal,
		SoftwareForm
	},
	mixins: [
		BsModal
	],
	props: {
		title: String,
		softwareId: Number
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
	data: () => ({
		result: true
	}),
	mounted() {
		this.modal = this.$refs.modalContainer.modal;
	},
	methods: {
		bsModalShown() {
			console.log("Modal shown");
		}
	},
	//~ popup(msg, options, title) {
		//~ return BsModal.popup.bind(this)(msg, options, title);
	//~ },
	template: `<bs-modal ref="modalContainer" class="bootstrap-prompt" v-bind="$props" @show-bs-modal="bsModalShown">
		<template v-slot:title>{{title}}</template>
		<template v-slot:default>
			<software-form :softwareId="softwareId"></software-form>
		</template>
		<template v-slot:footer>
			<button type="button" class="btn btn-primary" data-bs-dismiss="modal">Speichern</button>
		</template>
	</bs-modal>`
}
