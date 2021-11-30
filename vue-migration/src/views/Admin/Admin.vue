<template>
  <div id="admin--component">
    <div class="container">
      <div class="adminButtons">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <router-link to="/app/administration/users" class="nav-link"
              >Developers</router-link
            >
          </li>
          <li class="nav-item">
            <router-link to="/app/administration/evaluaciones" class="nav-link"
              >Evaluaciones</router-link
            >
          </li>
        </ul>
      </div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { APP_NAME } from '../../../env';
import { verifyToken } from '../../services/helpers';

export default {
  name: "Admin",
  data: function () {
    return {
      title: "Administración",
      resources: [],
      error: "",
      isLoading: true,
      searchQuery: null,
      curso: null,
    };
  },
  methods: {},
  mounted: function () {
    let id = this.$route.params.id ? this.$route.params.id : undefined;
    this.curso = this.$route.params.curso
      ? decodeURIComponent(this.$route.params.curso)
      : undefined;
    let token = localStorage.getItem("token-app-" + APP_NAME);
    let userId = localStorage.getItem("id-" + APP_NAME);

    // Verifico el token
    verifyToken(token);

    this.isLoading = false;
  },
  computed: {
    resultQuery: function () {
      if (this.searchQuery) {
        return this.resources.filter((item) => {
          return this.searchQuery
            .toLowerCase()
            .split(" ")
            .every((v) => item.name.toLowerCase().includes(v));
        });
      } else {
        return this.resources;
      }
    },
  },
};
</script>
