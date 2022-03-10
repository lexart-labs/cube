<template>
  <div class="container-fluid" id="login--form">
    <div
      class="formContainer__background"
      v-bind:style="
        setting.background
          ? 'background-image: url(' + (api + setting.background) + ')'
          : ''
      "
    >
      <img
        v-bind:src="
          setting.logo
            ? api + setting.logo
            : require('@/assets/lexart-cube.png')
        "
      />
    </div>
    <div class="formContainer__login">
      <header>
        <h2>Cube Platform</h2>
        <small>By Lexart Factory</small>
      </header>
      <form style="margin-top: 1rem" id="login-form">
        <input
          type="email"
          v-model="usr.email"
          placeholder="Email"
          class="form-control"
        />
        <input
          type="password"
          v-model="usr.password"
          placeholder="Clave"
          class="form-control"
        />
        <button
          type="button"
          class="btn btn-black btn-block"
          v-bind:disabled="isLoading"
          v-on:click="loginUser"
        >
          <span>Login</span>
        </button>
        <footer>
          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>
        </footer>
      </form>
      <div>
        <router-link to="/rcompany" class="rcompany">Registre su organización</router-link>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-underscore-dangle */
import axios from "axios";
import { copy } from "../services/helpers";
import { API, APP_NAME } from "../../env";

export default {
  name: "Login",
  data() {
    return {
      usr: {},
      error: "",
      isLoading: false,
      api: API,
      setting: {
        background: "",
        logo: "",
      },
    };
  },
  methods: {
    loginUser() {
      this.isLoading = true;
      const user = copy(this.usr);
      const { slug } = this.$route.params;

      axios.post(`${API}users/login`, {...user, slug }).then(
        (res) => {
          const rs = res.data;
          this.isLoading = false;

          if (!rs.error) {
            const { lexToken, token, ...cubeUsr} = rs.response;
            localStorage.setItem(`token-app-${APP_NAME}`, rs.response.token);
            localStorage.setItem(`id-${APP_NAME}`, rs.response.id);
            localStorage.setItem('_company-slug', slug);
            localStorage.setItem('lexToken', rs.response.lexToken);
            localStorage.setItem('cubeUser', JSON.stringify(cubeUsr));

            this.$router.push("/app/dashboard");
          } else {
            this.error = rs.error;
          }
        },
        () => {
          this.error = "Error de servidor. Contacte al administrador";
          this.isLoading = false;
        }
      );
    },
  },
  mounted() {
    localStorage.clear();
  },
};
</script>
