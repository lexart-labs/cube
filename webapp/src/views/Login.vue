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
          <span>con</span>
          <img src="../assets/lextracking-logo.svg" alt="" />
          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>
        </footer>
      </form>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-underscore-dangle */
import axios from "axios";
import Vue from "vue";
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

      axios.post(`${API}users/login`, user).then(
        (res) => {
          const rs = res.data;
          this.isLoading = false;

          if (!rs.error) {
            // Guardar en el localStorage
            // Token del response
            localStorage.setItem(`token-app-${APP_NAME}`, rs.response.token);
            localStorage.setItem(`id-${APP_NAME}`, rs.response.idLextracking);

            window.localStorage.setItem(
              `_lextracking_user-${APP_NAME}`,
              JSON.stringify(rs.response)
            );

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

    // Obtengo la información de la escuela si tengo token
    const { token } = this.$route.params;
    if (token) {
      axios.get(`${API}users/school/${token}`).then(
        (res) => {
          if (!res.data.error) {
            this.setting = res.data.response;
            // Bypass del token al storage
            this.setting.token = token;
            window.localStorage.setItem(
              `_setting-${APP_NAME}`,
              JSON.stringify(this.setting)
            );
          } else {
            Vue.toasted.show("Error en obtener la institución", {
              type: "error",
              duration: 2000,
            });
          }
        },
        () => {
          Vue.toasted.show("Error en obtener la institución", {
            type: "error",
            duration: 2000,
          });
        }
      );
    }
  },
};
</script>
