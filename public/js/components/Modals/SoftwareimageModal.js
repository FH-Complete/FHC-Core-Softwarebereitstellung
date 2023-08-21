import BsModal from '../../../../../js/components/Bootstrap/Modal.js';
import {Softwareimage} from '../Form/Softwareimage.js';

export default {
	components: {
		BsModal,
		Softwareimage
	},
	emits: [
		'onSaved'
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
		open(softwareimage_id) {
			this.title = softwareimage_id ? 'Softwareimage bearbeiten' : 'Softwareimage anlegen';
			this.$refs.softwareimage.prefill(softwareimage_id);
			this.$refs.modalContainer.show();
		}
	},
	template: `
		<bs-modal ref="modalContainer" class="bootstrap-prompt" v-bind="$props" @hidden-bs-modal="$refs.softwareimage.reset()">
			<template v-slot:title>{{title}}</template>
			<template v-slot:default>
				<softwareimage ref="softwareimage" @on-saved="$emit('onSaved')"></softwareimage>
			</template>
			<template v-slot:footer>
				<button type="button" class="btn btn-primary" @click="$refs.softwareimage.save()">Speichern</button>
			</template>
		</bs-modal>
	`
}
