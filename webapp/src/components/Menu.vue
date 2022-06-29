<template>
<div>
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
        <!-- LOGOUT
        <router-link
          v-bind:to="`/${slug}/login`"
          class="nav-link logout"
        >
          <small>{{ $t("generic.exit")}}</small>
        </router-link> -->
        <!-- BRAND
        <a v-bind:href="setting.web" class="nav-link" target="_new">
          <small>{{ setting.escuela }}</small></a
        > -->
      </div>
      <div class="right">
        <div class="profile">
          <ul>
            <li class="dropdown">
              <a href="#" data-toggle="dropdown" class="dropdown-toggle user-action">
                <img src="../assets/avatar-placeholder.png" class="avatar rounded-circle" alt="Avatar">
                <span>{{ user.name }}</span>
                <b class="caret"></b>
              </a>
              <ul class="dropdown-menu">
                <li>
                  <a
                    data-toggle="modal"
                    data-target="#editUserData"
                    ><i class="bi bi-person"></i> {{ $t("dashboard.profileDetailsEdit")}}</a
                  >
                </li>
                <li v-if="isAdmin">
                  <a
                    data-toggle="modal"
                    data-target="#editCompanyData"
                    ><i class="bi bi-building"></i> {{ $t("dashboard.companyDetailsEdit")}}</a
                  >
                </li>
                <li>
                  <router-link
                    v-bind:to="`/${slug}/login`"
                  ><i class="bi bi-box-arrow-left"></i>
                    <small> {{ $t("generic.exit")}}</small>
                  </router-link>
                </li>
              </ul>
            </li>
          </ul>
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
      </div>
    </nav>
  </header>

    <div
      class="modal fade"
      id="editUserData"
      data-backdrop="static"
      data-keyboard="false"
      tabindex="-1"
      aria-labelledby="editUserDataLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-l modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h4 id="editUserDataLabel">
              {{ $t("dashboard.profileEditLabel") }}
            </h4>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="clearStates()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="row">
              <form role="form">
                <div class="col-md-12">
                  <label for="">{{ $t("dashboard.profileEditName") }}</label>
                </div>
                <div class="col-md-12">
                  <input type="text" v-model="user.name" class="form-control is-rounded"/>
                </div>
                <div class="col-md-12">
                  <label for="">{{ $t("dashboard.profileEditPass") }}</label>
                </div>
                <div class="col-md-12">
                  <input type="password" v-model="passwordManager.password" class="form-control is-rounded"/>
                </div>
                <div class="col-md-12">
                  <label for="">{{ $t("dashboard.profileEditConfirmPass") }}</label>
                </div>
                <div class="col-md-12">
                  <input type="password" v-model="passwordManager.confirmPassword" class="form-control is-rounded"/>
                </div>
              </form>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="clearStates()">{{ $t("generic.close") }}</button>
            <button type="button" class="btn btn-primary" @click="onSave()">{{ $t("generic.save") }}</button>
            <div
              v-if="error"
              class="alert alert-danger mx-auto"
              style="margin-top: 1rem"
            >
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </div>

     <div
      class="modal fade"
      id="editCompanyData"
      data-backdrop="static"
      data-keyboard="false"
      tabindex="-1"
      aria-labelledby="editCompanyDataLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-l modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h4 id="editUserDataLabel">
              {{ $t("dashboard.companyEditLabel") }}
            </h4>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="clearStates()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="row">
              <form role="form">
                <div class="col-md-12">
                  <label for="">{{ $t("dashboard.companyEditName") }}</label>
                </div>
                <div class="col-md-12">
                  <input type="text" v-model="company" class="form-control is-rounded"/>
                </div>
                <div class="col-md-12 mt-3">
                  <label for="">{{ $t("dashboard.companyRelation") }}</label>
                </div>
                <div class="col-md-12">
                  <!--<input type="checkbox" v-model="openToExternalRelations" class="is-rounded"/>-->
                  <div class="checkboxStyle">
                    <input type="checkbox" v-model="openToExternalRelations"/>
                      <svg class="is_checked" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 426.67 426.67">
                      <path d="M153.504 366.84c-8.657 0-17.323-3.303-23.927-9.912L9.914 237.265c-13.218-13.218-13.218-34.645 0-47.863 13.218-13.218 34.645-13.218 47.863 0l95.727 95.727 215.39-215.387c13.218-13.214 34.65-13.218 47.86 0 13.22 13.218 13.22 34.65 0 47.863L177.435 356.928c-6.61 6.605-15.27 9.91-23.932 9.91z"/>
                    </svg>
                    <svg class="is_unchecked" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.982 212.982">
                      <path d="M131.804 106.49l75.936-75.935c6.99-6.99 6.99-18.323 0-25.312-6.99-6.99-18.322-6.99-25.312 0L106.49 81.18 30.555 5.242c-6.99-6.99-18.322-6.99-25.312 0-6.99 6.99-6.99 18.323 0 25.312L81.18 106.49 5.24 182.427c-6.99 6.99-6.99 18.323 0 25.312 6.99 6.99 18.322 6.99 25.312 0L106.49 131.8l75.938 75.937c6.99 6.99 18.322 6.99 25.312 0 6.99-6.99 6.99-18.323 0-25.313l-75.936-75.936z" fill-rule="evenodd" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </div>

              </form>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="clearStates()">{{ $t("generic.close") }}</button>
            <button type="button" class="btn btn-primary" @click="onSaveCompany()">{{ $t("generic.save") }}</button>
            <div
              v-if="error"
              class="alert alert-danger mx-auto"
              style="margin-top: 1rem"
            >
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </div>

</div>


</template>

<script>
import crypto from 'crypto';
import AuthService from '../services/auth.service';
import UserService from '../services/user.service';
import Companies from '../services/companies.service';
import { verifyToken } from '../services/helpers';
import { API, APP_NAME } from '../../env';
import Translations from "../data/translate";

export default {
  name: 'Menu',
  data() {
    return {
      isAdmin: false,
      slug: localStorage.getItem('_company-slug'),
      setting: {
        web: '',
        escuela: '',
        logo: '',
      },
      api: API,
      langs: [
        {value:'es', label: 'SP'},
        {value:'en', label: 'EN'}
      ],
      myId: localStorage.getItem(`id-${APP_NAME}`),
      user: {
        id: '',
        name: '',
        email: '',
        password: '',
        idCompany: '',
      },
      passwordManager: {
        password: '',
        confirmPassword: '',
      },
      company: '',
      error: '',
      openToExternalRelations: ''
    };
  },
  methods: {
    changeLangOnState(e) {
      const lang = e.target.value;
      this.$store.dispatch('changeLang', lang);
    },
    getUserById: async function (){
      UserService().getUserById(this.myId, (data) => {
        if(!data.error) {
          this.user = data.response;
          this.getCompanyById();
        }
      })
    },

    getCompanyById: async function () {
      const data = await Companies.getById(this.user.idCompany);
      this.company = data.company;
    },

    onSave(){
      if(this.passwordManager.password != this.passwordManager.confirmPassword){
        this.error = Translations[this.$store.state.language].dashboard.profileEditErrorPassword;
        return
      }
      if(this.passwordManager.password !== ''){
        this.user.password = this.hashPassword(this.passwordManager.password);
      }
      UserService().upsertUser(this.user, (data) => {
        if(data.error) {
          this.error = data.error;
          return;
        }
        $("#editUserData").modal("hide");
        this.clearStates();
      })
    },
    hashPassword(password){
      const result = crypto.createHash('md5')
      .update(password)
      .digest('hex');

      return result;
    },
    onSaveCompany: async function(){
      const result = await Companies.update(this.user.idCompany, this.company, this.openToExternalRelations);
      $("#editCompanyData").modal("hide");
      this.getCompanyById(this.user.idCompany);
      return result;
    },
    clearStates(){
      this.passwordManager = {
        password: '',
        confirmPassword: '',
      };
      this.error = '';
    },
  },
  mounted: async function () {
    const token = localStorage.getItem(`token-app-${APP_NAME}`);


    try {
      const setting = JSON.parse(localStorage.getItem(`_setting-${APP_NAME}`));
      if (setting) {
        this.setting = setting;
      }
    } catch (e) {
      console.log(e.message);
    }

    // GetUserById
    await this.getUserById();

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
  div:first-child {
    display: flex;
    flex-direction: row;
  }

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

  .right {
    display: flex;
    flex-direction: row;
    justify-self: flex-end;
    align-items: center;
  }

  .profile{
    margin-right: 1em;
  }
  .profile img {
    border-radius: 50%;
    width: 40px;
    height: 40px;
    margin: -13px 0;
    float: left;
    margin-right: 10px;
  }
  .profile a.dropdown-toggle.user-action {
    text-decoration: none;
  }
  .profile .dropdown-menu {
    margin: 1.45rem 0 0;
  }
  .profile .dropdown-menu a {
    cursor: pointer;
  }
  .profile ul li i {
		font-size: 18px;
	}
	.profile .dropdown-menu i {
		font-size: 16px;
		min-width: 22px;
	}
  .profile .dropdown-menu li{
		padding: 8px 0px;
	}
  .profile .dropdown-menu li a {
		color: var(--text-color-mid) !important;
    font-size: 15px;
		padding: 10px;
		line-height: normal;
    text-transform: none;
    text-decoration: none;
	}
  .profile .dropdown-menu li a:hover{
    opacity: 0.8;
  }
  .profile .dropdown-menu li a:hover, .profile .dropdown-menu li a:active {
		color: #333;
	}	
	.profile .dropdown-menu .material-icons {
		font-size: 21px;
		line-height: 16px;
		vertical-align: middle;
		margin-top: -2px;
	}

  .locale-changer {
    justify-self: flex-end;
  }

  .loading-cover {
  background-color: rgba(71, 71, 71, 0.842);
  height: 100%;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  }

  #editUserData .modal-content,
  #editCompanyData .modal-content {
    display: flex !important;
    flex-direction: column !important;
  }
  #editUserData .row,
  #editCompanyData .row{
    flex-direction: column;
  }
  #editUserData label,
  #editCompanyData label{
    margin: .5em 0;
  }

  /* Checkbox Style */
  svg.checkbox{
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  svg.checkbox .is_checked{
    opacity: 0;
    fill: yellow;
    -webkit-transform-origin: 50% 50%;
            transform-origin: 50% 50%;
    -webkit-transform: translateX(200%) rotate(45deg);
            transform: translateX(200%) rotate(45deg);
    -webkit-transition: all .35s;
    transition: all .35s;
  }

  svg.checkbox .is_unchecked{
    opacity: 1;
    fill: #fff;
    -webkit-transform-origin: 50% 50%;
            transform-origin: 50% 50%;
    -webkit-transform: translateX(0) rotate(0deg);
            transform: translateX(0) rotate(0deg);
    -webkit-transition: all .35s;
    transition: all .35s;
  }

  .checkboxStyle{
    width: 80px;
    height: 40px;
    position: relative;
    cursor: pointer;
  }
  .checkboxStyle input[type="checkbox"]{
    width: 80px;
    height: 30px;
    cursor: pointer;
    -webkit-appearance: none;
      -moz-appearance: none;
            appearance: none;
    background: #315e7f;
    border-radius: 2px;
    position: relative;
    outline: 0;
    -webkit-transition: all .2s;
    transition: all .2s;
  }
  .checkboxStyle input[type="checkbox"]:after{
    position: absolute;
    content: "";
    top: 3px;
    left: 3px;
    width: 34px;
    height: 24px;
    background: #dfeaec;
    z-index: 2;
    border-radius: 2px;
    -webkit-transition: all .35s;
    transition: all .35s;
  }
  .checkboxStyle svg{
    position: absolute;
    top: 35%;
    -webkit-transform-origin: 50% 50%;
            transform-origin: 50% 50%;
    fill: #fff;
    -webkit-transition: all .35s;
    transition: all .35s;
    z-index: 1;
  }
  .checkboxStyle .is_checked{
    width: 13px;
    left: 15%;
    -webkit-transform: translateX(190%) translateY(-30%) scale(0);
            transform: translateX(190%) translateY(-30%) scale(0);
  }
  .checkboxStyle .is_unchecked{
    width: 13px;
    right: 12%;
    -webkit-transform: translateX(0) translateY(-30%) scale(1);
            transform: translateX(0) translateY(-30%) scale(1);
  }
  .checkboxStyle input[type="checkbox"]:checked{
    background: #23da87;
  }
  .checkboxStyle input[type="checkbox"]:checked:after{
    left: calc(100% - 37px);
  }
  .checkboxStyle input[type="checkbox"]:checked + .is_checked{
    -webkit-transform: translateX(0) translateY(-30%) scale(1);
            transform: translateX(0) translateY(-30%) scale(1);
  }
  .checkboxStyle input[type="checkbox"]:checked ~ .is_unchecked{
    -webkit-transform: translateX(-190%) translateY(-30%) scale(0);
            transform: translateX(-190%) translateY(-30%) scale(0);
  }

  @media (min-width: 481px) and (max-width: 915px) and (orientation: landscape) {
    .menu {
      padding: 0.5rem 0;
      width: 100%;
    }
    .nav-link {
      padding: .5rem .5rem;
    }
  }

  @media (min-width: 481px) and (max-width: 1000px) {
    .menu {
      padding: 0.5rem 0;
      width: 100%;
    }
    .nav-link {
      padding: .5rem .5rem;
    }
  }

  @media (min-width: 320px) and (max-width: 480px) {
    .menu {
      padding: 0.5rem 0;
      width: 100%;
      font-size: var(--mini);
    }
    .nav-link {
      padding: .5rem .5rem;
    }
    .profile img {
      width: 20px;
      height: 20px;
      margin: -5px 0;
      margin-right: 5px;
  }
    .locale-changer select {
      width: 5vh;
      height: 3vh;
      line-height: 14px;
      font-size: 7px;
    }
    .locale-changer select option {
      font-size: var(--mini);
    }
    .locale-changer .form-control-sm {
      padding: 0;
    }
    .locale-changer .form-control {
      padding: 0;
    }
  }

</style>