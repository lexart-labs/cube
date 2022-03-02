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
            <router-link to="/app/administration/evaluaciones" class="nav-link"
              >{{ $t('AdminEvaluations.evaluations') }}</router-link
            >
          </li>
          <li class="nav-item">
            <router-link to="/app/administration/continuity" class="nav-link"
              >{{ $t('generic.continuity') }}</router-link
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
    };
  },
  methods: {},
  mounted() {
    const id = this.$route.params.id ? this.$route.params.id : undefined;
    this.curso = this.$route.params.curso
      ? decodeURIComponent(this.$route.params.curso)
      : undefined;
    const token = localStorage.getItem(`token-app-${APP_NAME}`);
    const userId = localStorage.getItem(`id-${APP_NAME}`);

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
