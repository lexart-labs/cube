<template>
  <div>
		<nav class="adminButtons">
			<ul class="nav nav-tabs">
				<li class="nav-item">
					<router-link to="/app/administration/partners/candidates" class="nav-link"
						>{{ $t('generic.candidates') }}</router-link
					>
				</li>
			</ul>
		</nav>
    <div class="container-fluid mt-3" v-if="routerIsPartners">
      <PartnersComp />
    </div>
		<div>
			<router-view></router-view>
		</div>
  </div>
</template>

<script>
import PartnersComp from '@/components/PartnersComp.vue';
import { watch } from 'vue';

export default {
	data() {
		return {
			routerIsPartners: false, // Initialize as false
		}
	},
  components: {
    PartnersComp
  },
	mounted() {
		// Set routerIsPartners based on current route on component mount
		this.routerIsPartners = this.$route.name === 'Partners';
		// Emit the initial state
		this.$emit('routerIsPartners', this.routerIsPartners);
	},
	watch: {
		$route: {
			handler() {
				this.routerIsPartners = this.$route.name === 'Partners';
				// Emit the updated state
				this.$emit('routerIsPartners', this.routerIsPartners);
			},
			deep: true
		}
	}
};
</script>
<style scoped>
	.adminButtons {
		margin-top: 1rem;
	}
</style>
