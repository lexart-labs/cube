<template>
  <div id="users--component" style="margin-top: 1rem">
    <h4 class="courseTitle">
      <span>{{ $t("AdminUsers.title") }}</span>
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
      :placeholder="$t('AdminUsers.searchPlaceholder')"
      v-model="searchQuery"
      class="form-control"
      style="margin-bottom: 1rem"
    />

    <div class="courseContainer" v-if="!isLoading">
      <table class="table table-admin">
        <thead>
          <tr>
            <th>{{ $t("AdminUsers.columnName") }}</th>
            <th>Email</th>
            <th>{{ $t("AdminUsers.columnType") }}</th>
            <th>{{ $t("AdminUsers.columnCharge") }}</th>
            <th>{{ $t("AdminUsers.columnLevel") }}</th>
            <th>{{ $t("AdminUsers.columnActive") }}</th>
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
            <td>
              {{ user.active == 1 ? $t("generic.yes") : $t("generic.no") }}
            </td>
            <td>
              <!-- Trigger modal -->
              <button
                class="btn btn-info"
                data-toggle="modal"
                data-target="#staticBackdrop"
                v-on:click="getUserById(user.idLextracking)"
              >
                {{ $t("generic.edit") }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

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
      <div :class="isFeching ? 'loading-cover' : ''">
        <Spinner v-if="isFeching" />
      </div>
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="courseTitle" id="staticBackdropLabel">
              User {{ user.id ? "#" + user.id : "" }}
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
            <div class="coursesTab" style="margin-bottom: 1rem;">
              <ul class="nav nav-tabs">
                <li class="nav-item">
                  <a
                    class="nav-link"
                    v-bind:class="{ active: tabs.perfil }"
                    v-on:click="activeTab('perfil')"
                    >Perfil</a
                  >
                </li>
                <li class="nav-item">
                  <a
                    v-bind:class="{ active: tabs.roadmap }"
                    v-on:click="activeTab('roadmap')"
                    class="nav-link"
                    >Roadmap</a
                  >
                </li>
              </ul>
            </div>
            <div class="perfil">
              <form enctype="multipart/form-data" v-show="tabs.perfil">
                <label for="">LexTracking user</label>
                <v-select
                  v-model="user"
                  label="name"
                  :options="usersLextracking"
                ></v-select>
                <br />
                <div class="row">
                  <div class="col">
                    <label for="career">{{
                      $t("AdminUsers.columnCharge")
                    }}</label>
                    <select
                      class="form-control"
                      v-model="user.positionId"
                      id="career"
                    >
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
                    <label for="lvl">{{ $t("AdminUsers.columnLevel") }}</label>
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
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </form>
            </div>
            <div class="roadmap" v-show="tabs.roadmap">
              {{ $t('AdminUsers.daysLeftMessage')}}
              <span>{{changePositionTime}} d.</span>
              <div class="list-group" v-if="user.skills">
                <label
                  class="list-group-item"
                  v-for="(item, i) in jobAssignments"
                  :key="`asgn${i}`"
                >
                  <input
                    class="form-check-input me-1"
                    type="checkbox"
                    v-model="user.skills[item]"
                  >
                  {{ $t(`positionAssignments['${user.position}'][${i}]`) }}
                </label>
              </div>
            </div>
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
              {{ $t("generic.cancel") }}
            </button>
            <button
              type="button"
              class="btn btn-success"
              v-on:click="upsertUser"
              :disabled="isLoading"
            >
              {{ isLoading ? "Loading..." : $t("generic.save") }}
            </button>
          </div>
        </div>
      </div>
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
import translations from '../../data/translate';
import minimunTimes from '../../data/positionMinimunTimes';

export default {
  name: "Users",
  components: { Spinner },
  data() {
    return {
      title: "My developers",
      users: [],
      changePositionTime: 0,
      error: "",
      isLoading: true,
      isFeching: false,
      searchQuery: null,
      curso: null,
      user: {
        name: "",
        active: "1",
      },
      api: API,
      usersLextracking: [],
      levels: [],
      careers: [],
      pagesLength: 1,
      page: 1,
      tabs: {
        perfil: true,
        roadmap: false,
      },
      jobAssignments: [],
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
    activeTab(tab) {
      // Set all to false
      Object.keys(this.tabs)
        .forEach((key) => { this.tabs[key] = false; });
      this.tabs[tab] = true;
    },
    getUserById(id) {
      this.user = { name: "", active: "1" };
      this.isFeching = true;
      UserService().getUserById(id, (res) => {
        if (!res.error) {
          const { skills, position, since } = res.response;
          this.user = res.response;
          this.user.skills = skills
            ? JSON.parse(skills) : {};
          this.jobAssignments = translations.en.positionAssignments[position] || [];
          this.changePositionTime = (
            minimunTimes[position] - (since || 0)
          )
          if (this.changePositionTime < 0) {
            this.changePositionTime = 0;
          }
        }
        this.isFeching = false;
      });
    },
    upsertUser() {
      this.isLoading = true;
      // Agrego usuarios nuevos con el sync desde el front
      this.user.token = "";
      this.user.sync = true;
      this.user.type = this.user.role || this.user.type;

      UserService().upsertUser(this.user, (res) => {
        this.isLoading = false;

        if (!res.error) {
          $("#staticBackdrop").modal("hide");
          $(".modal-backdrop").remove();

          Vue.toasted.show("Usuario editado/creado correctamente", {
            type: "success",
            duration: 2000,
          });

          if (this.users.length < 5) {
            const page = this.page - 1;
            this.handlePagination(page);
          } else {
            this.handlePagination(this.page);
            this.cleanStates();
          }
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
      this.isLoading = true;
      if (typeof operator === "number") {
        this.page = operator;
      } else {
        operator === "+" ? (this.page += 1) : (this.page -= 1);
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
    handlePagination(page = 0) {
      this.isLoading = true;
      UserService().getAllUsers(page, (res) => {
        if (!res.error) {
          const users = res.response;
          this.users = users;
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
      this.page = page + 1 || 1;
    },
    cleanStates() {
      this.user = 
      this.changePositionTime = 0;
      this.error = "",
      this.isLoading = false,
      this.isFeching = false,
      this.user = {
        name: "",
        active: "1",
      };
      this.tabs = {
        perfil: true,
        roadmap: false,
      };
      this.jobAssignments = [];
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

    UserService().getAllUsersLextracking((res) => {
      this.isLoading = false;
      if (!res.error) {
        const users = res.response;
        this.usersLextracking = users.map(el => ({...el, idLextracking: el.id}));
      } else {
        this.error = res.error;
      }
    });

    this.handlePagination();
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
.pages-nav span:hover,
.current {
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
</style>
