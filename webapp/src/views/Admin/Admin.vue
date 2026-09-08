<template>
  <div id="admin--component">
    <div class="container">
      <nav class="adminButtons">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <router-link to="/app/administration/users" class="nav-link"
              >Developers</router-link
            >
          </li>
					<li class="nav-item">
            <router-link to="/app/administration/partners" class="nav-link"
              >{{ $t('generic.partners') }}</router-link
            >
          </li>
					<li class="nav-item">
            <router-link to="/app/administration/onboarding-users" class="nav-link"
              >{{ $t('generic.onboardingUsers') }}</router-link>
          </li>
        </ul>
      </nav>
      <main>
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { APP_NAME } from '../../../env';
import { verifyToken } from '../../services/helpers';

export default {
  name: 'Admin',
  data() {
    return {
      title: 'Administración',
      resources: [],
      error: '',
      isLoading: true,
      searchQuery: null,
      curso: null,
      slug: localStorage.getItem('_company-slug'),
    };
  },
  methods: {},
  mounted() {
    this.curso = this.$route.params.curso
      ? decodeURIComponent(this.$route.params.curso)
      : undefined;
    const token = localStorage.getItem(`token-app-${APP_NAME}`);

    // Verifico el token
    verifyToken(token);

    this.isLoading = false;
  },
  computed: {
    resultQuery() {
      if (this.searchQuery) {
        return this.resources.filter((item) => this.searchQuery
          .toLowerCase()
          .split(' ')
          .every((v) => item.name.toLowerCase().includes(v)));
      }
      return this.resources;
    },
  },
};
</script>
