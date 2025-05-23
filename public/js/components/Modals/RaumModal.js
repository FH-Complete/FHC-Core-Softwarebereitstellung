import BsModal from '../../../../../js/components/Bootstrap/Modal.js';
import {Raum} from "../Form/Raum.js";

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
		open(softwareimageort_id) {
			this.title = softwareimageort_id ? this.$p.t('global/raumZuImageBearbeiten') : this.$p.t('global/raumZuImageAnlegen');
			if (softwareimageort_id) this.$refs.raum.prefill(softwareimageort_id);
			this.$refs.modalContainer.show();
		},
		openVerfuebarkeitAendernModal(selectedData){
			this.title = this.$p.t('global/verfuegbarkeitBearbeiten');
			this.$refs.raum.prefillOrte(selectedData);
			this.$refs.modalContainer.show();
		},
		emitOnSaved(raumanzahlDifferenz){
			this.$emit('onSaved', raumanzahlDifferenz);
		},
	},
	template: `
	<Teleport to="body">
		<bs-modal ref="modalContainer" class="bootstrap-prompt" v-bind="$props" @hidden-bs-modal="$refs.raum.reset()">
			<template v-slot:title>{{title}}</template>
			<template v-slot:default>
				<raum ref="raum" @on-saved="emitOnSaved"></raum>
			</template>
			<template v-slot:footer>
				<button type="button" class="btn btn-primary" @click="$refs.raum.save()">{{ $p.t('global/speichern') }} </button>
			</template>
		</bs-modal>
	</Teleport>	
`
}
