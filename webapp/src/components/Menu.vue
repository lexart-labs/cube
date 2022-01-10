<template>
  <div id="menu--component" class="navbar navbar-dark bg-dark">
    <div class="row">
      <img
        v-if="setting.logo"
        v-bind:src="setting.logo ? api + setting.logo : ''"
        width="32"
        class="brand--logo"
      />
      <router-link to="/app/dashboard" class="nav-link">Dashboard</router-link>
      <router-link
        v-if="isAdmin"
        to="/app/administration/users"
        class="nav-link"
        >{{ $t("dashboard.administration")}}</router-link
      >
      <router-link
        v-bind:to="setting.token ? '/' + setting.token : '/'"
        class="nav-link"
      >
        <small>{{ $t("generic.exit")}}</small>
      </router-link>
      <!-- BRAND -->
      <a v-bind:href="setting.web" class="nav-link" target="_new">
        <small>{{ setting.escuela }}</small></a
      >
    </div>
  </div>
</template>

<script>
import AuthService from '../services/auth.service';
import { verifyToken } from '../services/helpers';
import { API, APP_NAME } from '../../env';

export default {
  name: 'Menu',
  data() {
    return {
      isAdmin: false,
      setting: {
        web: '',
        escuela: '',
        logo: '',
      },
      api: API,
    };
  },
  methods: {},
  mounted() {
    const token = localStorage.getItem(`token-app-${APP_NAME}`);
    try {
      const setting = JSON.parse(localStorage.getItem(`_setting-${APP_NAME}`));
      if (setting) {
        this.setting = setting;
      }
    } catch (e) {
      console.log(e.message);
    }

    // Verifico el token
    verifyToken(token);

    // Check if user isAdmin
    AuthService().checkType((type) => {
      this.isAdmin = type.response === 'admin';
    });
  },
};
</script>
