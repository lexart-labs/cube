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
          <li class="nav-item" v-if="slug !== 'lexart_labs'">
            <router-link to="/app/administration/collaborators" class="nav-link"
              >{{ $t('generic.collaborators') }}</router-link
            >
          </li>
          <li class="nav-item">
            <router-link to="/app/administration/evaluaciones" class="nav-link"
              >{{ $t('AdminEvaluations.evaluations') }}</router-link
            >
          </li>
          <li class="nav-item">
            <router-link to="/app/administration/technologies" class="nav-link"
              >{{ $t('generic.technologies') }}</router-link
            >
          </li>
          <li class="nav-item">
            <router-link to="/app/administration/origins" class="nav-link"
              >{{ $t('generic.origin') }}</router-link
            >
          </li>
          <li class="nav-item">
            <router-link to="/app/administration/career" class="nav-link"
              >{{ $t('generic.Positions') }}</router-link
            >
          </li>
					<li class="nav-item">
            <router-link to="/app/administration/levels" class="nav-link"
              >{{ $t('generic.levels') }}</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/app/administration/career-type" class="nav-link"
              >{{ $t('generic.careerType') }}</router-link
            >
          </li>
					<li class="nav-item">
            <router-link to="/app/administration/candidates" class="nav-link"
              >{{ $t('generic.candidates') }}</router-link
            >
          </li>
					<li class="nav-item">
            <router-link to="/app/administration/partners" class="nav-link"
              >{{ $t('generic.partners') }}</router-link
            >
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
