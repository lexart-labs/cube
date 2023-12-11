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
      <form
        @submit.prevent="registerCompany"
        id="register-form"
      >
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
          autocomplete="off"
          required
        />
        <input
          type="password"
          v-model="cpy.password"
          placeholder="Clave"
          class="form-control"
          autocomplete="off"
          required
        />
        <div class="legal-info">
          <p>
            Lexart is committed to protecting and respecting your privacy, and
            we'll only use your personal information to administer your
            account and to provide the products and services you requested
            from us. From time to time, we would like to contact you about our
            products and services, as well as other content that may be of
            interest to you. If you consent to us contacting you for this
            purpose, please tick below to say how you would like us to contact
            you:
          </p>
          <br />
          <div class="form-check mb-2">
            <input
              class="mr-2"
              type="checkbox"
              v-model="agreementComunication"
              id="agree-1"
            />
            <label class="form-check-label" for="agree-1">
              I agree to receive other communications from Lexart. (opcional)
            </label>
          </div>
          <div class="form-check">
            <input
              class="mr-2"
              type="checkbox"
              v-model="agreementPersonalData"
              id="agree-2"
            />
            <label class="form-check-label" for="agree-2">
              I agree to allow Lexart to store and process my personal data.<span>*</span>
              (Required)
            </label>
          </div>
        </div>
        <div class="captcha-ctl">
          <vue-recaptcha
            :sitekey="siteKey"
            @verify="setCaptchaResponse"
          ></vue-recaptcha>
        </div>
        <button
          type="submit"
          class="btn btn-black btn-block"
          :disabled="isLoading || !agreementPersonalData"
        >
          <span>Register</span>
        </button>
        <footer>
          <div v-if="error" class="alert alert-danger register-alert">
            {{ error }}
          </div>
          <div v-if="success" class="alert alert-primary register-alert" role="alert">
            <h4 class="alert-heading"><b>Succesfully created!</b></h4>
            <hr class="hr-alert">
            <p>Link to login page: 
            <router-link :to="`${cpy.company.toLowerCase().replace(/\s+/g,'_')}/login`">Here</router-link> .
            </p>
          </div>
        </footer>
      </form>
      <div>
        <router-link to="/login" class="linkFooter"
          >Iniciar sesión</router-link
        >
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { VueRecaptcha } from "vue-recaptcha";
import { copy } from "../services/helpers";
import { API, BASE_URL, SITE_KEY } from "../../env";

export default {
  name: "RegisterCompany",
  components: { VueRecaptcha },
  data() {
    return {
      cpy: {},
      error: "",
      captchaResponse: "",
      isLoading: false,
      success: false,
      agreementPersonalData: false,
      agreementComunication: true,
      api: API,
      base: BASE_URL,
      siteKey: SITE_KEY,
      setting: {
        background: "",
        logo: "",
      },
    };
  },
  methods: {
    setCaptchaResponse(tk) {
      this.captchaResponse = tk;
    },
    registerCompany: async function () {
      this.isLoading = true;
      this.error = "";
      const user = copy(this.cpy);
      const captcha = this.captchaResponse;

      axios.post(`${API}companies/`, { ...user, captcha }).then(
        (res) => {
          const rs = res.data;
          this.isLoading = false;

          if (!rs.error) {
            // this.$router.push(`${this.cpy.company.toLowerCase().replace(/\s+/g,'_')}/login`);
            this.success = true;
          } else {
            grecaptcha.reset();
            this.error = rs.error;
            this.captchaResponse = '';
          }
        },
        () => {
          this.error = "Error de servidor. Contacte al administrador";
          this.isLoading = false;
        }
      );
    },
  },
  // created() {
  // this.$nextTick(() => {
  //   grecaptcha.render('g-captcha');
  // });
  // },
  mounted() {
    localStorage.clear();
  },
};
</script>

<style scoped>
form {
  gap: 0.8rem !important;
  padding: 6.5%;
}
footer {
  display: flex;
  max-width: 100%;
  flex-flow: column wrap;
  font-size: 0.9rem;
}
.captcha-ctl {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
.legal-info {
  font-size: 8px;
  text-align: justify;
}
.form-check {
  padding: 0;
  display: flex;
  align-items: center;
}
.legal-info label {
  font-size: 10px;
}
.legal-info span {
  color: red;
}
#register-form {
  z-index: 2;
}
.hr-alert {
  margin: 9px 0;
}
.register-alert {
  margin-bottom: 0;
}
</style>
