import BsModal from '../../../../../js/components/Bootstrap/Modal.js';
import {Softwareimage} from '../Form/Softwareimage.js';

export default {
	components: {
		BsModal,
		Softwareimage
	},
	emits: [
		'softwareimageSaved'
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
		// onHiddenBsModal() {
		// 	this.$refs.softwareimage.reset();
		// },
		// onBsModalSave() {
		// 	this.$refs.softwareimage.save();
		// },
		// saveSoftwareimage() {
		// 	this.$emit('softwareimageSaved');
		// },
		open(softwareimage_id) {
			this.title = softwareimage_id ? 'Softwareimage bearbeiten' : 'Softwareimage anlegen';
			this.$refs.softwareimage.prefill(softwareimage_id);
			this.$refs.modalContainer.show();
		}
	},
	template: `
		<bs-modal ref="modalContainer" class="bootstrap-prompt" v-bind="$props" @hidden-bs-modal="onHiddenBsModal">
			<template v-slot:title>{{title}}</template>
			<template v-slot:default>
				<softwareimage ref="softwareimage" @softwareimage-saved="saveSoftwareimage"></softwareimage>
			</template>
			<template v-slot:footer>
				<button type="button" class="btn btn-primary" @click="onBsModalSave">Speichern</button>
			</template>
		</bs-modal>
	`
}
