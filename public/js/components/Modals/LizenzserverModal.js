import BsModal from '../../../../../js/components/Bootstrap/Modal.js';
import {Lizenzserver} from "../Form/Lizenzserver";

export default {
	components: {
		BsModal,
		Lizenzserver
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
		open(lizenzserver_kurzbz) {
			this.title = lizenzserver_kurzbz === undefined ? 'Lizenzserver anlegen' : 'Lizenzserver bearbeiten';
			if (lizenzserver_kurzbz !== undefined) this.$refs.lizenzserver.prefill(lizenzserver_kurzbz);
			this.$refs.modalContainer.show();
		}
	},
	template: `
		<bs-modal ref="modalContainer" class="bootstrap-prompt" v-bind="$props" @hidden-bs-modal="$refs.lizenzserver.reset()">
			<template v-slot:title>{{title}}</template>
			<template v-slot:default>
				<lizenzserver ref="lizenzserver" @on-saved="$emit('onSaved')"></lizenzserver>
			</template>
			<template v-slot:footer>
				<button type="button" class="btn btn-primary" @click="$refs.lizenzserver.save()">Speichern</button>
			</template>
		</bs-modal>
	`
}
