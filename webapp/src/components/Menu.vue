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
          v-bind:to="setting.token ? '/' + setting.token : '/'"
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
                <li>
                  <a
                    v-if="isAdmin"
                    to=""
                    ><i class="bi bi-building"></i> {{ $t("dashboard.companyDetailsEdit")}}</a
                  >
                </li>
                <li>
                  <router-link
                    v-bind:to="setting.token ? '/' + setting.token : '/'"
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
              User {{ user.id ? "#" + user.id : "" }}
            </h4>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="row">
              <form role="form">
                <div class="col-md-12">
                  <label for="">Name</label>
                </div>
                <div class="col-md-12">
                  <input type="text" v-model="user.name" class="form-control is-rounded" placeholder="Name"/>
                </div>
                <div class="col-md-12">
                  <label for="">New Password</label>
                </div>
                <div class="col-md-12">
                  <input type="password" v-model="passwordManager.password" class="form-control is-rounded" placeholder="Password"/>
                </div>
                <div class="col-md-12">
                  <label for="">Confirm New Password</label>
                </div>
                <div class="col-md-12">
                  <input type="password" class="form-control is-rounded" placeholder="New Password"/>
                </div>
                <!--<div class="col-md-12">
                  <input type="text" v-model="user.email" class="form-control" placeholder="Email"/>
                </div>-->
              </form>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="clearStates()">Close</button>
            <button type="button" class="btn btn-primary" @click="onSave()">Save changes</button>
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
        {value:'es', label: 'SP'},
        {value:'en', label: 'EN'}
      ],
      user: {
        id: '',
        name: '',
        email: '',
        password: '',
      },
      passwordManager: {
        password: '',
        confirmPassword: '',
      },
      myId: localStorage.getItem(`id-${APP_NAME}`),
      error: '',
    };
  },
  methods: {
    changeLangOnState(e) {
      const lang = e.target.value;
      this.$store.dispatch('changeLang', lang);
    },
    getUserById(){
      UserService().getUserById(this.myId, (data) => {
        if(!data.error) {
          this.user = data.response;
        }
      })
    },
    onSave(){
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
    clearStates(){
      this.passwordManager = {
        password: '',
        confirmPassword: '',
      }
    },
  },
  mounted() {
    const token = localStorage.getItem(`token-app-${APP_NAME}`);

    // Get name from localStorage
    try {
      const userLextracking = JSON.parse(localStorage.getItem(`_lextracking_user-${APP_NAME}`));
      if (userLextracking) {
        this.user.name = userLextracking.name;
      }
    } catch (e) {
      console.log(e.message);
    }

    try {
      const setting = JSON.parse(localStorage.getItem(`_setting-${APP_NAME}`));
      if (setting) {
        this.setting = setting;
      }
    } catch (e) {
      console.log(e.message);
    }

    // GetUserById
    this.getUserById();

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

  #editUserData .modal-content {
    display: flex !important;
    flex-direction: column !important;
  }
  #editUserData .row{
    flex-direction: column;
  }
  #editUserData label{
    margin: .5em 0;
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