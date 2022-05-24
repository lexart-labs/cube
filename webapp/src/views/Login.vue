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
      <form style="margin-top: 1rem" id="login-form" v-if="moreThanOneCompany">
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
        <button
          type="button"
          class="btn btn-black btn-block"
          v-bind:disabled="isLoading"
          v-on:click="loginUser"
        >
          <span>Login</span>
        </button>
          <div class="captcha-ctl">
            <vue-recaptcha
              :sitekey="siteKey"
              @verify="setCaptchaResponse"
            ></vue-recaptcha>
          </div>
        <footer>
          <div>
            <small v-if="error" class="alert alert-danger">
              {{ error }}
            </small>
          </div>
        </footer>
      </form>
      <form v-if="!moreThanOneCompany">
        <h2>Selecciona la organización:</h2>
        <div class="container p-0">
          <div class="row">
            <div
              class="col-md-6"
              v-for="(companies, i) in companies"
              :key="`comp${i}`"
            >
              <div
                class="card p-3 mb-2"
                @click="activate(companies.id)" 
                :class="{ active : selectCompanie == companies.id }"
              >
                <input
                  type="hidden"
                  :value="companies.id"
                >
                <h6>{{companies.name}}</h6>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          class="btn btn-black btn-block"
          :disabled="!selectCompanie || isLoading"
          @click="verifyCompany"
        >
          Verify
        </button>
        <small v-if="error" class="alert alert-danger">
          {{ error }}
        </small>
      </form>
      <div>
        <router-link to="/rcompany" class="linkFooter"
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
      moreThanOneCompany: true,
      api: API,
      siteKey: SITE_KEY,
      setting: {
        background: "",
        logo: "",
      },
      companies: {},
      selectCompanie: "",
    };
  },
  methods: {
    loginUser() {
      this.isLoading = true;
      const user = copy(this.usr);
      const captcha = this.captchaResponse;

      if(!captcha) {
        this.error = "please, make sure to check the reCaptcha challenge.";
        this.isLoading = false;
        return;
      }

      axios.post(`${API}users/login/verify`, { ...user, ...captcha }).then(
        (res) => {
          const rs = res.data;
          this.isLoading = false;

          if (!rs.error) {
            const { token } = rs.response;
            const headers = {
              token
            };
            
            axios.get(`${API}users/companies/participate`, { headers }).then((res) => {
              const companies = res.data.response; // array result
              this.companies = res.data.response; // show companies on second form
              this.isLoading = false;
              
              if(companies.length <= 1){
                axios.post(`${API}users/login`, { ...user }).then(
                  (res) => {
                    const rs = res.data;
                    this.isLoading = false;

                    if (!rs.error) {
                      const { lexToken, token, ...cubeUsr } = rs.response;
                      localStorage.setItem(`token-app-${APP_NAME}`, rs.response.token);
                      localStorage.setItem(`id-${APP_NAME}`, rs.response.id);
                      localStorage.setItem("lexToken", rs.response.lexToken);
                      localStorage.setItem("cubeUser", JSON.stringify(cubeUsr));
                      this.$router.push("/app/dashboard");
                      const data = Companies.getById(user.idCompany); // apply company-slug after login
                      localStorage.setItem("_company-slug", data.slug);
                    }
                  },
                  () => {
                    this.error = "Error al obtener organización";
                    this.isLoading = false;
                  }
                );
              } else {
                this.moreThanOneCompany = false;
              }
            }
            );
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
    verifyCompany: async function () {
      this.isLoading = true;
      this.error = "";
      
      const user = copy(this.usr);
      const selectedCompanie = this.selectCompanie;
      const result = await Companies.getById(selectedCompanie)

      const data = {
        "email": user.email, 
        "password": user.password,
        "idCompany": result.id
      }
      const newLoginUser = data;

      this.isLoading = false;
      if (result.error) {
        this.error = result.error;
      } else {

        axios.post(`${API}users/login`, { ...newLoginUser }).then(
          (res) => {
            const rs = res.data;
            this.isLoading = false;
            
            if (!rs.error) {
              const { lexToken, token, ...cubeUsr } = rs.response;
              localStorage.setItem(`token-app-${APP_NAME}`, rs.response.token);
              localStorage.setItem(`id-${APP_NAME}`, rs.response.id);
              localStorage.setItem("lexToken", rs.response.lexToken);
              localStorage.setItem("cubeUser", JSON.stringify(cubeUsr));
              localStorage.setItem("_company-slug", result.slug);
              this.$router.push("/app/dashboard");
            }
          },
          () => {
            this.error = "Error de servidor. Contacte al administrador";
            this.isLoading = false;
          }
        );
        this.moreThanOneCompany = true;
      }
    },
    setCaptchaResponse(tk) {
      this.captchaResponse = tk;
    },
    activate: async function(el) {
      this.selectCompanie = el;
    },
  },
  mounted() {
    localStorage.clear();
    if (this.$route.params.slug) {
      this.$router.push("/login").catch(()=>{});
      this.moreThanOneCompany = true;
    }
    if (this.$route.params.slug === "login") {
      this.moreThanOneCompany = true;
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