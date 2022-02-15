<template>
  <header id="menu--component" class="navbar navbar-dark bg-dark">
    <nav class="menu">
      <div>
        <img
          v-if="setting.logo"
          v-bind:src="setting.logo ? api + setting.logo : ''"
          width="32"
          class="brand--logo"
        />
        <router-link to="/app/dashboard" class="nav-link is-bold">Dashboard</router-link>
        <router-link
          v-if="isAdmin"
          to="/app/administration/users"
          class="nav-link is-bold"
          >{{ $t("dashboard.administration")}}</router-link
        >
        <router-link
          v-bind:to="setting.token ? '/' + setting.token : '/'"
          class="nav-link logout"
        >
          <small>{{ $t("generic.exit")}}</small>
        </router-link>
        <!-- BRAND -->
        <a v-bind:href="setting.web" class="nav-link" target="_new">
          <small>{{ setting.escuela }}</small></a
        >
      </div>
      <div class="locale-changer">
        <select
          v-model="$i18n.locale"
          class="form-control form-control-sm"
          v-on:change="changeLangOnState"
        >
          <option v-for="(lang, i) in langs" :key="`Lang${i}`" :value="lang.value">
            {{ lang.label }}
          </option>
        </select>
      </div>
    </nav>
  </header>
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
      langs: [
        {value:'es', label: 'español'},
        {value:'en', label: 'english'}
      ],
    };
  },
  methods: {
    changeLangOnState(e) {
      const lang = e.target.value;
      this.$store.dispatch('changeLang', lang);
    },
  },
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

<style scoped>
  .menu {
    display: flex;
    flex-flow: row wrap;
    padding: 0.5rem;
    align-items: center;
    justify-content: space-between;
    width: 80%;
    margin: 0 auto;
    text-transform: uppercase;
    max-width: 2000px;
    font-size: var(--mid);
    color: var(--text-color-bright);
  }

  div:first-child {
    display: flex;
    flex-direction: row;
  }

  .locale-changer {
    justify-self: flex-end;
  }
</style>