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
      <form @submit.prevent="registerCompany" style="margin-top: 1rem" id="login-form">
        <h2>Datos de la organización:</h2>
        <input
          type="text"
          v-model="cpy.company"
          placeholder="Nombre de la organización"
          class="form-control"
          required
        />
        <input
          type="email"
          v-model="cpy.email"
          placeholder="Email"
          class="form-control"
          required
        />
        <input
          type="password"
          v-model="cpy.password"
          placeholder="Clave"
          class="form-control"
          required
        />
        <button
          type="submit"
          class="btn btn-black btn-block"
          v-bind:disabled="isLoading"
        >
          <span>Register</span>
        </button>
        <footer>
          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>
          <div v-if="success" class="alert alert-primary" role="alert">
            <h4 class="alert-heading"><b>Succesfully created!</b></h4>
            <hr>
            <p>Link to login page:</p>
            <br>
            <router-link :to="`${cpy.company.toLowerCase().replace(/\s+/g,'_')}/login`">{{ `${base}${cpy.company.toLowerCase().replace(/\s+/g,'_')}/login` }}</router-link>
          </div>
        </footer>
      </form>
      <!-- <div>
        <router-link to="/lexart_labs/login" class="rcompany">Iniciar sesión</router-link>
      </div> -->
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { copy } from "../services/helpers";
import { API, BASE_URL } from "../../env";

export default {
  name: "RegisterCompany",
  data() {
    return {
      cpy: {},
      error: "",
      isLoading: false,
      success: false,
      api: API,
      base: BASE_URL,
      setting: {
        background: "",
        logo: "",
      },
    };
  },
  methods: {
    registerCompany() {
      this.isLoading = true;
      this.error = '';
      const user = copy(this.cpy);

      axios.post(`${API}companies/`, user).then(
        (res) => {

          const rs = res.data;
          this.isLoading = false;

          if (!rs.error) {
            // this.$router.push(`${this.cpy.company.toLowerCase().replace(/\s+/g,'_')}/login`);
            this.success = true;
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

<style scoped>
footer {
  display: flex;
  max-width: 100%;
  flex-flow: column wrap;
  font-size: 0.9rem;
}
</style>
