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
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Tipo</th>
            <th>Activo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, i) in resultQuery" :key="`usr${i}`">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.type }}</td>
            <td>{{ user.active == 1 ? "SI" : "NO" }}</td>
            <td>
              <!-- Trigger modal -->
              <button
                class="btn btn-info"
                data-toggle="modal"
                data-target="#staticBackdrop"
                v-on:click="getUserById(user.id)"
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
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import UserService from '../../services/user.service';
import { verifyToken } from '../../services/helpers';
import { API, APP_NAME } from '../../../env';

export default {
  name: "Users",
  data: function () {
    return {
      title: "Mis developers",
      users: [],
      error: "",
      isLoading: true,
      searchQuery: null,
      curso: null,
      user: {
        name: "",
        active: "1",
      },
      api: API,
      usersLextracking: [],
    };
  },
  methods: {
    newUser: function () {
      this.user = {
        name: "",
        active: "1",
      };
    },
    getUserById: function (id) {
      UserService().getUserById(id, (res) => {
        if (!res.error) {
          this.user = res.response;
        }
      });
    },
    upsertUser: function () {
      // Agrego usuarios nuevos con el sync desde el front
      this.user.token = "";
      this.user.sync = true;
      this.user.type = this.user.role;

      UserService().upsertUser(this.user, (res) => {
        if (!res.error) {
          $("#staticBackdrop").modal("hide");

          this.$toast.show("Usuario editado/creado correctamente", {
            type: "success",
            duration: 2000,
          });

          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          this.error = res.error;
        }
      });
    },
    uploadFile: function () {
      let logoFile = this.$refs.logo.files[0];
      let bgFile = this.$refs.background.files[0];

      let formLogo = new FormData();
      let formBg = new FormData();
      formLogo.append("file-image", logoFile);
      formBg.append("file-image", bgFile);

      if (logoFile) {
        // Upload logo
        axios
          .post(API + "upload-file", formLogo, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((sucess) => {

            this.user.logo = sucess.data.response.url;

            this.$toast.show("Logo subido correctamente", {
              type: "success",
              duration: 2000,
            });
          });
      }

      if (bgFile) {
        // Upload background
        axios
          .post(API + "upload-file", formBg, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((sucess) => {
            this.user.background = sucess.data.response.url;

            this.$toast.show("Background subido correctamente", {
              type: "success",
              duration: 2000,
            });
          });
      }
    },
    silentFunction: function () {
      console.log(this.$refs.logo.files);
      console.log(this.$refs.background.files);
    },
  },
  mounted: function () {
    let token = localStorage.getItem("token-app-" + APP_NAME);

    // Verifico el token
    verifyToken(token);

    UserService().getAllUsers((res) => {
      this.isLoading = false;
      if (!res.error) {
        let users = res.response;
        this.users = users;
      } else {
        this.error = res.error;
      }
    });

    UserService().getAllUsersLextracking((res) => {
      this.isLoading = false;
      if (!res.error) {
        let users = res.response;
        this.usersLextracking = users;
      } else {
        this.error = res.error;
      }
    });
  },
  computed: {
    resultQuery: function () {
      if (this.searchQuery) {
        return this.users.filter((item) => {
          return this.searchQuery
            .toLowerCase()
            .split(" ")
            .every((v) => item.name.toLowerCase().includes(v));
        });
      } else {
        return this.users;
      }
    },
  },
};
</script>
