import {Softwareverwaltung} from "./softwareverwaltung/Softwareverwaltung.js";
import {Imageverwaltung} from "./imageverwaltung/Imageverwaltung.js";
import {Lizenzserververwaltung} from "./lizenzserververwaltung/Lizenzserververwaltung.js";
import {Softwaresuche} from "./softwaresuche/Softwaresuche";


export const NavTabs = {
	components: {
		Softwareverwaltung,
		Imageverwaltung,
		Lizenzserververwaltung,
		Softwaresuche
	},
	emits: [
		'newFilterEntry',
	],
	data: function() {
		return {
			currentTab: 'Softwareverwaltung',
			tabs: [
				'Softwareverwaltung',
				'Imageverwaltung',
				'Lizenzserververwaltung',
				'Softwaresuche'
			]
		}
	},
	methods: {
		emitNewFilterEntry(payload){
			this.$emit('newFilterEntry', payload);
		},
		changeTab(tab){
			this.currentTab = tab;

			// TODO Hack! Check issue of multiple tables, they should be solved in Filter.js.
			FHC_JS_DATA_STORAGE_OBJECT.called_method = '/' + this.currentTab;
		}
	},
	template: `
	<div class="row">
		<div class="col-md-12">
			<div id="navTabs">
				<ul class="nav nav-tabs" class="mb-5">
					<li class="nav-item" v-for="tab in tabs" :key="tab">
						<a :class="['nav-link', { active: currentTab === tab }]" @click="changeTab(tab)">{{ tab }} </a>
					</li>
				</ul>
				<component :is="currentTab" @new-filter-entry="emitNewFilterEntry"></component>
			</div>	
  		</div>
  </div>
	`
};
