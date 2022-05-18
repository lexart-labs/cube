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
    <div class="formContainer__login" v-if="!warning">
      <header>
        <h2>Cube Platform</h2>
        <small>By Lexart Factory</small>
      </header>
      <form style="margin-top: 1rem" id="login-form" v-if="!hasSlug">
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
          autocomplete="off"
        />
        <div class="captcha-ctl">
          <vue-recaptcha
            :sitekey="siteKey"
            @verify="setCaptchaResponse"
          ></vue-recaptcha>
        </div>
        <button
          type="button"
          class="btn btn-black btn-block"
          v-bind:disabled="isLoading"
          v-on:click="loginUser"
        >
          <span>Login</span>
        </button>
        <footer>
          <div>
            <small v-if="error" class="alert alert-danger">
              {{ error }}
            </small>
          </div>
        </footer>
      </form>
      <form v-if="hasSlug">
          <h2>Selecciona la organización:</h2>
          <div class="container p-0">
            <div class="row">
              <div class="col-md-6">
                <div class="card p-3 mb-2" @click="activate(1)" :class="{ active : clickCompany == 1 }">
                  <h6>Lexart Labs</h6>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card p-3 mb-2" @click="activate(2)" :class="{ active : clickCompany == 2 }">
                  <h6>Multilaser</h6>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-black btn-block"
            :disabled="!click_company || isLoading"
            @click="verifyCompany"
          >
            Verify
          </button>
        <small v-if="error" class="alert alert-danger">
          {{ error }}
        </small>
      </form>
      <div>
        <router-link to="/rcompany" class="rcompany"
          >Registre su organización</router-link
        >
      </div>
    </div>
    <div v-if="warning" class="alert-error">
      <div class="alert alert-warning" role="alert">
        <h4 class="is-bold">
          <i class="fas fa-exclamation-triangle" /> Warning!
        </h4>
        <hr />
        <p>
          Apparently, you have not settled your company at the link to login
          page. The link to login must follow the format:
        </p>
        <p><b>cube.lexartlabs.com/YOUR_COMPANY_NAME/login</b></p>
        <p>Please, try again using a valid link.</p>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-underscore-dangle */
import axios from "axios";
import { VueRecaptcha } from "vue-recaptcha";
import { copy } from "../services/helpers";
import Companies from "../services/companies.service";
import { API, APP_NAME, SITE_KEY } from "../../env";

export default {
  name: "Login",
  components: { VueRecaptcha },
  data() {
    return {
      usr: {},
      error: "",
      warning: "",
      captchaResponse: "",
      isLoading: false,
      company: "",
      hasSlug: true,
      api: API,
      siteKey: SITE_KEY,
      setting: {
        background: "",
        logo: "",
      },
      clickCompany: 0,
    };
  },
  methods: {
    loginUser() {
      this.isLoading = true;
      const user = copy(this.usr);
      //const { slug } = this.$route.params;
      const captcha = this.captchaResponse;

      axios.post(`${API}users/login`, { ...user }).then(
        (res) => {
          const rs = res.data;
          this.isLoading = false;

          if(!captcha) {
            this.error = "please, make sure to check the reCaptcha challenge.";
            this.isLoading = false;
            return;
          } else if (!rs.error) {
            const { lexToken, token, ...cubeUsr } = rs.response;
            localStorage.setItem(`token-app-${APP_NAME}`, rs.response.token);
            localStorage.setItem(`id-${APP_NAME}`, rs.response.id);
            //localStorage.setItem("_company-slug", slug);
            localStorage.setItem("lexToken", rs.response.lexToken);
            localStorage.setItem("cubeUser", JSON.stringify(cubeUsr));

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
    verifyCompany: async function () {
      this.isLoading = true;
      this.error = "";
      //const captcha = this.captchaResponse;

      /*if(!captcha) {
        this.error = "please, make sure to check the reCaptcha challenge.";
        this.isLoading = false;
        return;
      }*/

      const result = await Companies.verify(this.company);
      this.isLoading = false;
      if (result.error) {
        //grecaptcha.reset();
        this.error = result.error;
        //this.captchaResponse = '';
      } else {
        this.$router.push(`${result.slug}/login`);
        this.hasSlug = true;
      }
    },
    setCaptchaResponse(tk) {
      this.captchaResponse = tk;
    },
    activate: async function (el) {
      this.clickCompany = el;
    },
  },
  mounted() {
    localStorage.clear();
    if (!this.$route.params.slug) {
      this.$router.push("lexart_labs/login");
    }
    if (this.$route.params.slug === "") {
      this.hasSlug = false;
    }
  },
};
</script>

<style scoped>
footer > div {
  display: flex;
  max-width: 100%;
  flex-flow: column wrap;
  font-size: 0.8rem;
}
.alert-error {
  max-width: 800px;
  font-size: 1.2rem;
}
.alert-error h4 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
.alert-error p {
  margin-bottom: 1rem;
}
#verify-company {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
}
.captcha-ctl {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
.card:hover {
  cursor: pointer;
}
.active {
  color: #007bff;
  border: 1px solid #007bff;
  font-weight: bold;
}
</style>