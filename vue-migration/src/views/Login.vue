<template>
  <div
    class="row container-fluid"
    id="login--form"
    v-bind:style="
      setting.background
        ? 'background-image: url(' + (api + setting.background) + ')'
        : ''
    "
  >
    <div
      class="col-8 formContainer__background"
      v-bind:style="
        setting.background
          ? 'background-image: url(' + (api + setting.background) + ')'
          : ''
      "
    >
      <!-- Add logo -->
      <img
        v-bind:src="
          setting.logo ? api + setting.logo : 'assets/lexart-cube.png'
        "
      />
    </div>
    <div class="col-4 formContainer__login">
      <div class="row">
        <div class="col-1"></div>
        <div class="col-10 formContainer">
          <img
            v-bind:src="
              setting.logo ? api + setting.logo : 'assets/lexart-cube.png'
            "
            class="only-mob"
          />
          <h2>Cube Platform</h2>
          <small>By Lexart Factory</small>
          <form style="margin-top: 1rem">
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
              class="btn btn-black"
              v-bind:disabled="isLoading"
              v-on:click="loginUser"
            >
              <span>{{ !isLoading ? "Login con" : "Login in" }}</span>
              <img src="assets/lextracking-logo.svg" alt="" />
            </button>
            <div v-if="error" class="alert alert-danger">
              {{ error }}
            </div>
          </form>
        </div>
        <div class="col-1"></div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
require('dotenv').config();

const { APP_NAME, API } = process.env;

export default {
  name: 'Login',
  data() {
    return {
      usr: {},
      error: '',
      isLoading: false,
      api: API,
      setting: {
        background: '',
        logo: '',
      },
    };
  },
  methods: {
    loginUser: function () {
      this.isLoading = true;
      const user = copy(this.usr);

      axios.post(API + "users/login", user).then(
        (res) => {
          let rs = res.data;
          this.isLoading = false;

          if (!rs.error) {
            // Guardar en el localStorage
            // Token del response
            localStorage.setItem("token-app-" + APP_NAME, rs.response.token);
            localStorage.setItem("id-" + APP_NAME, rs.response.idLextracking);

            window.localStorage.setItem(
              "_lextracking_user-" + APP_NAME,
              JSON.stringify(rs.response)
            );

            router.push("/app/dashboard");
          } else {
            this.error = rs.error;
          }
        },
        (err) => {
          this.error = "Error de servidor. Contacte al administrador";
          this.isLoading = false;
        }
      );
    },
  },
  mounted: function () {
    localStorage.clear();

    // Obtengo la información de la escuela si tengo token
    let token = app._route.params.token;
    if (token) {
      axios.get(API + "users/school/" + token).then(
        (res) => {
          if (!res.data.error) {
            this.setting = res.data.response;
            // Bypass del token al storage
            this.setting.token = token;
            window.localStorage.setItem(
              "_setting-" + APP_NAME,
              JSON.stringify(this.setting)
            );
          } else {
            Vue.toasted.show("Error en obtener la institución", {
              type: "error",
              duration: 2000,
            });
          }
        },
        (err) => {
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
