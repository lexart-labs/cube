<template>
  <div id="users--component" style="margin-top: 1rem">
    <h4 class="courseTitle">
      <span>{{ title }}</span>
      <spinner v-if="isLoading"></spinner>
      <button
        type="button"
        style="float: right; margin-bottom: 1rem"
        class="btn btn-secondary"
        data-toggle="modal"
        data-target="#staticBackdrop"
        v-on:click="newUser"
      >
        + Developers
      </button>
    </h4>
    <input
      type="search"
      placeholder="Buscar developers"
      v-model="searchQuery"
      class="form-control"
      style="margin-bottom: 1rem"
    />
    <div class="courseContainer" v-if="!isLoading">
      <table class="table table-admin">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Tipo</th>
            <th>Cargo</th>
            <th>Nível</th>
            <th>Activo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, i) in resultQuery" :key="`usr${i}`">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.type }}</td>
            <td>{{ user.position }}</td>
            <td>{{ user.level }}</td>
            <td>{{ user.active == 1 ? "SI" : "NO" }}</td>
            <td>
              <!-- Trigger modal -->
              <button
                class="btn btn-info"
                data-toggle="modal"
                data-target="#staticBackdrop"
                v-on:click="getUserById(user.idLextracking)"
              >
                Editar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- User / Modal -->
      <div
        class="modal fade"
        id="staticBackdrop"
        data-backdrop="static"
        data-keyboard="false"
        tabindex="-1"
        aria-labelledby="staticBackdropLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="courseTitle" id="staticBackdropLabel">
                Usuario {{ user.id ? "#" + user.id : "" }}
              </h4>
              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <form enctype="multipart/form-data">
                <label for="">Usuario de LexTracking</label>
                <v-select
                  v-model="user"
                  label="name"
                  :options="usersLextracking"
                ></v-select>
                <br />
                <div class="row">
                  <div class="col">
                    <label for="career">Cargo</label>
                    <select class="form-control" v-model="user.positionId" id="career">
                      <option
                        v-for="(career, i) in careers"
                        :value="career.id"
                        :key="`car${i}`"
                        :selected="career.id == user.positionId"
                      >
                        {{ career.position }}
                      </option>
                    </select>
                  </div>
                  <div class="col">
                    <label for="lvl">Nível</label>
                    <select class="form-control" v-model="user.levelId" id="lvl">
                      <option
                        v-for="(level, i) in levels"
                        :value="level.id"
                        :key="`lev${i}`"
                        :selected="level.id == user.levelId"
                      >
                        {{ level.level }}
                      </option>
                    </select>
                  </div>
                </div>
                <br />
                <select class="form-control" v-model="user.active">
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
              </form>
              <div
                v-if="error"
                class="alert alert-danger"
                style="margin-top: 1rem"
              >
                {{ error }}
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-dismiss="modal"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn btn-success"
                v-on:click="upsertUser"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
      <nav class="pages-nav">
        <span
          v-on:click="navigate('-')"
          :class="page == 1 ? 'not-allowed' : ''"
        >
          Back
        </span>
        <span
          :class="page == index ? 'current' : ''"
          v-for="index in pagesLength"
          :key="index"
          v-on:click="navigate(index)"
        >
          {{ index }}
        </span>
        <span
          v-on:click="navigate('+')"
          :class="page == pagesLength ? 'not-allowed' : ''"
        >
          Next
        </span>
      </nav>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-undef */
import axios from "axios";
import Vue from "vue";
import Spinner from "../../components/Spinner.vue";
import UserService from "../../services/user.service";
import CareerService from "../../services/career.service";
import LevelService from "../../services/level.service";
import { verifyToken } from "../../services/helpers";
import { API, APP_NAME } from "../../../env";

export default {
  name: "Users",
  components: { Spinner },
  data() {
    return {
      title: "Mis developers",
      users: [],
      error: "",
      isLoading: true,
      searchQuery: null,
      curso: null,
      user: {
        name: '',
        active: '1',
      },
      api: API,
      usersLextracking: [],
      levels: [],
      careers: [],
      pagesLength: 1,
      page: 1,
    };
  },
  methods: {
    newUser() {
      this.user = {
        name: "",
        active: "1",
        positionId: 1,
        levelId: 1,
      };
    },
    getUserById(id) {
      UserService().getUserById(id, (res) => {
        if (!res.error) {
          this.user = res.response;
        }
      });
    },
    actulizeUsers(usr) {
      const position = this.careers.find(el => el.id == usr.positionId).position;
      const level = this.levels.find(el => el.id == usr.levelId).level;
      usr.position = position;
      usr.level = level;

      if (this.users.some(el => el.id == usr.id)) {
        const result = this.users.reduce((acc, cur) => {
        acc = Number(cur.id) === Number(usr.id) ? [...acc, usr] : [...acc, cur];
        return acc;
        }, []);
        this.users = result;
      } else {
        this.users = [...this.users, usr];
      }
    },
    upsertUser() {
      // Agrego usuarios nuevos con el sync desde el front
      this.user.token = "";
      this.user.sync = true;
      this.user.type = this.user.role || this.user.type;

      this.actulizeUsers(this.user);

      UserService().upsertUser(this.user, (res) => {
        if (!res.error) {
          $("#staticBackdrop").modal("hide");

          Vue.toasted.show("Usuario editado/creado correctamente", {
            type: "success",
            duration: 2000,
          });
        } else {
          this.error = res.error;
        }
      });
    },
    uploadFile() {
      const logoFile = this.$refs.logo.files[0];
      const bgFile = this.$refs.background.files[0];

      const formLogo = new FormData();
      const formBg = new FormData();
      formLogo.append("file-image", logoFile);
      formBg.append("file-image", bgFile);

      if (logoFile) {
        // Upload logo
        axios
          .post(`${API}upload-file`, formLogo, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((sucess) => {
            this.user.logo = sucess.data.response.url;

            Vue.toasted.show("Logo subido correctamente", {
              type: "success",
              duration: 2000,
            });
          });
      }

      if (bgFile) {
        // Upload background
        axios
          .post(`${API}upload-file`, formBg, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((sucess) => {
            this.user.background = sucess.data.response.url;

            Vue.toasted.show("Background subido correctamente", {
              type: "success",
              duration: 2000,
            });
          });
      }
    },
    silentFunction() {
      console.log(this.$refs.logo.files);
      console.log(this.$refs.background.files);
    },
    navigate(operator) {
      if (typeof operator === 'number') {
        this.page = operator;
      } else {
        operator === '+' ? this.page += 1 : this.page -= 1;
      }

      UserService().getAllUsers(this.page - 1, (res) => {
        this.isLoading = false;
        if (!res.error) {
          const users = res.response;
          this.users = users;
        } else {
          this.error = res.error;
        }
      });
    },
  },
  mounted() {
    const token = localStorage.getItem(`token-app-${APP_NAME}`);

    // Verifico el token
    verifyToken(token);

    CareerService()
      .getAll()
      .then((res) => (this.careers = res.response));
    LevelService()
      .getAll()
      .then((res) => (this.levels = res.response));

    UserService().getAllUsers(0, (res) => {
      this.isLoading = false;
      if (!res.error) {
        const users = res.response;
        this.users = users;
      } else {
        this.error = res.error;
      }
    });

    UserService().getAllUsersLextracking((res) => {
      this.isLoading = false;
      if (!res.error) {
        const users = res.response;
        this.usersLextracking = users;
      } else {
        this.error = res.error;
      }
    });

    UserService().getPagesLength((res) => {
      this.isLoading = false;
      if (!res.error) {
        this.pagesLength = res.response;
      } else {
        this.error = res.error;
      }
    });
  },
  computed: {
    resultQuery() {
      if (this.searchQuery) {
        return this.users.filter((item) =>
          this.searchQuery
            .toLowerCase()
            .split(" ")
            .every((v) => item.name.toLowerCase().includes(v))
        );
      }
      return this.users;
    },
  },
};
</script>

<style>
  .pages-nav {
    color: rgb(138, 138, 138);
    cursor: pointer;
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
    width: 100%;
  }
  .pages-nav span:hover, .current {
    text-decoration: underline;
    color: black;
  }
  .not-allowed {
    cursor: none;
    opacity: 0.2;
    pointer-events: none;
  }
  .table-admin {
    min-height: 50vh;
  }
</style>
