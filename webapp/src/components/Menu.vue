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
      <div class="right">

        <div class="profile">
          <ul>
            <li class="dropdown">
              <a href="#" data-toggle="dropdown" class="dropdown-toggle user-action">
                <img src="../assets/avatar-placeholder.png" class="avatar rounded-circle" alt="Avatar">
                <span>Álik Welyn</span>
                <!-- NOME AQUI -->
                <b class="caret"></b>
              </a>
              <ul class="dropdown-menu">
                <li>
                  <a
                    data-toggle="modal"
                    data-target="#staticBackdrop"
                    v-on:click="getUserById(user.id)"
                    ><i class="bi bi-person"></i> {{ $t("dashboard.profileDetailsEdit")}}</a
                  >
                </li>
                <li>
                  <router-link
                    v-if="isAdmin"
                    to=""
                    ><i class="bi bi-building"></i> {{ $t("dashboard.companyDetailsEdit")}}</router-link
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
        {value:'es', label: 'SP'},
        {value:'en', label: 'EN'}
      ],
    };
  },
  methods: {
    changeLangOnState(e) {
      const lang = e.target.value;
      this.$store.dispatch('changeLang', lang);
    },
    openModal() {
      this.$refs.modal.staticBackdrop();
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
    .locale-changer select {
      width: 4.8vh;
      height: 3vh;
      line-height: 14px;
      font-size: var(--mini);
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