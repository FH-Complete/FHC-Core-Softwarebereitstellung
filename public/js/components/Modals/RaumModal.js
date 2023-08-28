import BsModal from '../../../../../js/components/Bootstrap/Modal.js';
import {Raum} from "../Form/Raum";

export default {
	components: {
		BsModal,
		Raum: Raum
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
		open(ort_kurzbz, softwareimage_id) {
			this.title = ort_kurzbz ? 'Raumzuordnung bearbeiten' : 'Raumzuordnung anlegen';
			this.$refs.raum.prefill(ort_kurzbz, softwareimage_id);
			this.$refs.modalContainer.show();
		}
	},
	template: `
		<bs-modal ref="modalContainer" class="bootstrap-prompt" v-bind="$props" @hidden-bs-modal="$refs.raum.reset()">
			<template v-slot:title>{{title}}</template>
			<template v-slot:default>
				<raum ref="raum" @on-saved="$emit('onSaved')"></raum>
			</template>
			<template v-slot:footer>
				<button type="button" class="btn btn-primary" @click="$refs.raum.save()">Speichern</button>
			</template>
		</bs-modal>
	`
}
