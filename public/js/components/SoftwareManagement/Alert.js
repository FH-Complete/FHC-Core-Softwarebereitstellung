export const Alert = {
	data: function() {
		return {
			pvToast: null,
			pvSystemErrorToast: null,
			pvConfirmdialog: null
		}
	},
	mounted(){
		const self = this;
		const instance = Vue.createApp({
			setup() {
				return () =>  [
					Vue.h(primevue.toast, {
						ref: 'pvToast',
						baseZIndex: 99999
					}),
					Vue.h(primevue.toast, {
						ref: 'pvSystemErrorToast',
						baseZIndex: 99999,
						position: 'center',
					}, {message: (slotProps) => {
						const messageCard = Vue.h('div', {
							ref: 'messageCard',
							id: 'collapseMessageCard',
							class: 'collapse mt-3'
						}, [
							Vue.h('div', {class: 'card card-body text-body small'}, slotProps.message.detail)
						]);
						return [
							Vue.h('i', {class: 'fa fa-circle-exclamation fa-2xl mt-3'}),
							Vue.h('div', {class: 'p-toast-message-text'}, [
								Vue.h('span', {class: 'p-toast-summary'}, slotProps.message.summary),
								Vue.h('div', {class: 'p-toast-detail my-3'}, 'Sorry! Ein interner technischer Fehler ist aufgetreten.'),
								Vue.h('div', {class: 'd-flex justify-content-between align-items-center'}, [
									Vue.h('a', {
										class: 'align-bottom flex-fill me-2',
										dataBsToggle: 'collapse',
										href: '#collapseMessageCard',
										role: 'button',
										ariaExpanded: 'false',
										ariaControls: 'collapseMessageCard',
										onClick: () => { bootstrap.Collapse.getOrCreateInstance(messageCard.el).toggle(); }
									}, 'Fehler anzeigen'),
									Vue.h('a', {
										class: 'btn btn-primary flex-fill',
										target: '_blank',
										href: self.mailToUrl(slotProps),
									}, 'Fehler melden')
								]),
								messageCard,
							]),

						]
					}}),
					Vue.h(primevue.confirmdialog, {
						ref: 'pvConfirmdialog'
					})
				]
			},
			mounted(){
				self.pvToast = this.$refs.pvToast;
				self.pvSystemErrorToast = this.$refs.pvSystemErrorToast;
				self.pvConfirmdialog = this.$refs.pvConfirmdialog;
			},
			unmounted() {
				wrapper.parentElement.removeChild(wrapper);
			}
		});

		instance.use(primevue.config.default, {zIndex: {dialog: 99999}})  // todo unstyled true
		instance.use(primevue.toastservice);
		instance.use(primevue.confirmationservice);

		const wrapper = document.createElement("div");
		instance.mount(wrapper);
		document.body.appendChild(wrapper);
	},
	methods: {
		alertSuccess(message) {
			this.pvToast.add({ severity: 'success', summary: 'Info', detail: message, life: 1000});
		},
		alertInfo(message) {
			this.pvToast.add({ severity: 'info', summary: 'Info', detail: message, life: 3000 });
		},
		alertWarning(message) {
			this.pvToast.add({ severity: 'warn', summary: 'Achtung', detail: message, life: 7000 });
		},
		alertError(message) {
			this.pvToast.add({ severity: 'error', summary: 'Achtung', detail: message });
		},
		alertSystemMessage(message){
			// Message is string
			if (typeof message === 'string') {
				this.alertWarning(message);
				return;
			}

			// Message is array of strings
			if (Array.isArray(message)) {

				// If Array has only Strings
				if (message.every(msg => typeof msg === 'string')) {
					for (let msg of message) {
						this.alertWarning(msg);
					}
					return;
				}

				// If Array has only Objects
				if (message.every(msg => typeof msg === 'object') && msg !== null) {
					for (let msg of message) {
						if (msg.hasOwnProperty('data')){
							if (msg.data.hasOwnProperty('retval'))
							{
								this.alertWarning(JSON.stringify(msg.data.retval));
							}
						}
						else
						{
							this.alertSystemError(JSON.stringify(message));
						}
						return;
					}
					return;
				}
			}

			// Message is Object with data property  TODO: check object handling
			if (typeof message === 'object' && message !== null){
				if (message.hasOwnProperty('data')){
					if (message.data.hasOwnProperty('retval'))
					{
						this.alertSystemError(JSON.stringify(message.data.retval));
					}
				}
				else
				{
					this.alertSystemError(JSON.stringify(message));
				}
				return;
			}

			// Fallback
			this.alertSystemError('alertSystemMessage throws Generic Error.');
		},
		alertSystemError(error){
			// Error is string
			if (typeof error === 'string')
			{
				this.pvSystemErrorToast.add({ severity: 'error', summary: 'Systemfehler', detail: error});
				return;
			}

			// Error is array of strings
			if (Array.isArray(error)) {
				let hasOnlyString = error.every(err => typeof err === 'string');

				if (hasOnlyString) {
					for (let err of error) {
						this.pvSystemErrorToast.add({ severity: 'error', summary: 'Systemfehler', detail: err});
					}
					return true;
				}
			}

			// Error is object
			if (typeof error === 'object' && error !== null)
			{
				let errMsg = '';

				if (error.hasOwnProperty('message')){
					errMsg += 'Error Message: ' + error.message.toUpperCase() + '\r\n';
				}

				if (error.hasOwnProperty('config')){
					if (error.config.hasOwnProperty('url')){
						errMsg += 'Error Method: ' + error.config.url + '\r\n';
					}
				}

				// Fallback object error message
				if (errMsg == ''){
					errMsg = 'Error Message: ' + JSON.stringify(error);
				}

				this.pvSystemErrorToast.add({ severity: 'error', summary: 'Systemfehler', detail: errMsg});
				return;
			}

			// Fallback
			this.pvSystemErrorToast.add({ severity: 'error', summary: 'Systemfehler', detail: 'alertSystemError throws Generic Error'});


		},
		confirmDelete() {
			return new Promise((resolve,reject) => {
				this.pvConfirmdialog.$confirm.require({
					header: 'Achtung',
					message: 'Möchten Sie sicher löschen?',
					acceptLabel: 'Löschen',
					acceptClass: 'btn btn-danger',
					rejectLabel: 'Abbrechen',
					rejectClass: 'btn btn-outline-secondary',
					accept: () => {
						resolve(true);
						this.alertSuccess('Gelöscht!');
					},
					reject: () => {
						resolve(false);
					},
				});
			});
		},
		alertDefault(severity, title, message, position = 'center', sticky = false) {
			let options = { severity: severity, summary: title, detail: message};

			if (!sticky) options.life = 3000;
			this.pvToast.$props.position = position;
			this.pvToast.add(options);
		},
		alertMultiple(messageArray, severity = 'info', title = 'Info', position = 'top-right', sticky = false){

			// Check, if array has only string values
			let hasOnlyString = messageArray => messageArray.every(message => typeof message === 'string');

			if (hasOnlyString) {
				for (let message of messageArray) {
					this.alertDefault(severity, title, message, position, sticky);
				}
				return true;
			}

			return false;
		},
		mailToUrl(slotProps){
			let mailTo = 'noreply@technikum-wien.at'; // TODO domain anpassen
			let subject = 'Meldung%20Systemfehler';
			let body = `
				Danke, dass Sie uns den Fehler melden. %0D%0A %0D%0A
				Bitte beschreiben Sie uns ausführlich das Problem.%0D%0A
				Bsp: Ich habe X ausgewählt und Y angelegt. Beim Speichern erhielt ich die Fehlermeldung. [Optional: Ich habe den Browser Z verwendet.]%0D%0A
				-----------------------------------------------------------------------------------------------------------------------------------%0D%0A
				PROBLEM: ... %0D%0A %0D%0A %0D%0A
				
				-----------------------------------------------------------------------------------------------------------------------------------%0D%0A
				Fehler URL: ` + FHC_JS_DATA_STORAGE_OBJECT.called_path + '/' + FHC_JS_DATA_STORAGE_OBJECT.called_method + `%0D%0A
				Fehler Meldung: ` + slotProps.message.detail + `%0D%0A
				-----------------------------------------------------------------------------------------------------------------------------------%0D%0A %0D%0A
				Wir kümmern uns um eine rasche Behebung des Problems!`

			return "mailto:" + mailTo + "?subject=" + subject + "&body=" + body;
		}
	}
};