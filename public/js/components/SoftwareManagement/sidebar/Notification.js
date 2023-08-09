export const Notification = {
	data: function() {
		return {
			notifications: [
				'Test 1',
				'Test 2',
				'Test 3'
			]
		}
	},
	template: `
	<div class="row">
		<div class="col-md-12">
			<div v-for="notification in notifications" :key="notification" 
				class="alert alert-danger" role="alert">{{ notification }}</div>
		</div>
	</div>	
	`
};
