<template>
  <div id="users--component" class="admin-conteiner" style="margin-top: 1rem">
    <header class="header-table">
      <h4 class="is-bold">
        <span>{{ $t("AdminUsers.title") }}</span>
      </h4>
      <button
        type="button"
        class="btn btn-success"
        data-toggle="modal"
        data-target="#staticBackdrop"
        v-on:click="newUser"
      >
        + Developers
      </button>
    </header>
    <div class="grp-icon-input">
      <input
        type="search"
        :placeholder="$t('AdminUsers.searchPlaceholder')"
        v-model="searchQuery"
        class="form-control is-rounded search"
        @keydown.enter="getUsers"
      />
      <button
        class="btn btn-primary btn-sm col-1 btn-search-eval"
        @click="getUsers"
      >
        <i class="fas fa-search"></i>
      </button>
    </div>
    <div v-if="!isLoading" style="width: 100%">
      <table class="table table-admin col-12">
        <thead class="is-bold">
          <tr>
            <th>{{ $t("AdminUsers.columnName") }}</th>
            <th>Email</th>
            <th>{{ $t("AdminUsers.columnType") }}</th>
            <th>{{ $t("AdminUsers.columnCharge") }}</th>
            <th>{{ $t("AdminUsers.columnLevel") }}</th>
            <th>{{ $t("AdminUsers.columnActive") }}</th>
            <th>{{ $t("AdminUsers.hired") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, i) in users" :key="`usr${i}`">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.type }}</td>
            <td>{{ user.position }}</td>
            <td>{{ user.level }}</td>
            <td>
              {{ user.active == 1 ? $t("generic.yes") : $t("generic.no") }}
            </td>
            <td>{{ user.plataform }}</td>
            <td>
              <!-- Trigger modal -->
              <button
                class="btn btn-primary col-12"
                data-toggle="modal"
                data-target="#staticBackdrop"
                v-on:click="getUserById(user.id)"
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
    <div class="window-centered">
      <Spinner v-if="isFeching || isLoading" />
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
      <div class="modal-dialog modal-xl modal-dialog-centered">
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
              v-on:click="cleanStates"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="coursesTab" style="margin-bottom: 1rem">
              <ul class="nav nav-tabs">
                <li class="nav-item">
                  <a
                    class="nav-link"
                    v-bind:class="{ active: tabs.perfil }"
                    v-on:click="activeTab('perfil')"
                  >
                    Perfil
                  </a>
                </li>
                <li class="nav-item">
                  <a
                    v-bind:class="{ active: tabs.roadmap }"
                    v-on:click="activeTab('roadmap')"
                    class="nav-link"
                    v-show="user.idPosition"
                    >Roadmap</a
                  >
                </li>
              </ul>
            </div>
            <div class="perfil">
              <form enctype="multipart/form-data" v-show="tabs.perfil">
                <label for="">User</label>
                <vue-select
                  v-model="user"
                  label="name"
                  :options="usersLextracking"
                ></vue-select>
                <br />
                <label for="">{{ $t("AdminUsers.hired") }}</label>
                <vue-select
                  v-model="user.idPlataform"
                  label="plataform"
                  :options="plataforms"
                  :reduce="(plat) => plat.id"
                ></vue-select>
                <br />
                <div class="row">
                  <div class="col">
                    <label for="career">{{
                      $t("AdminUsers.columnCharge")
                    }}</label>
                    <select
                      class="form-control is-rounded"
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
                    <select
                      class="form-control is-rounded"
                      v-model="user.levelId"
                      id="lvl"
                    >
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
                <label for="lead-select">{{ $t("generic.lead") }}</label>
                <select
                  v-model="user.lead"
                  class="form-control is-rounded"
                  id="lead-select"
                >
                  <option
                    :value="{ id: lead.id, name: lead.name }"
                    :key="`lead${i}`"
                    v-for="(lead, i) in leaders"
                  >
                    {{ lead.name }}
                  </option>
                </select>
                <br />
                <label for="techs">{{ $t("generic.technologies") }}</label>
                <div class="tech-ctl">
                  <vue-select
                    :options="technologies"
                    id="techs"
                    style="width: 95%"
                    v-model="currentTech"
                    :getOptionLabel="(el) => el.name"
                  >
                  </vue-select>
                  <i
                    class="fas fa-plus-circle"
                    :style="`font-size: 1.5rem; cursor: pointer;${
                      currentTech && currentTech.name
                        ? ''
                        : 'pointer-events: none; color: #d3d3d3;'
                    }`"
                    v-on:click="addSkill()"
                  />
                </div>
                <ul class="list-group list-group-flush">
                  <li
                    class="
                      list-group-item
                      d-flex
                      justify-content-between
                      align-items-center
                    "
                    v-for="(item, i) in managerUserTechs.userTechs"
                    :key="`usrtchg${i}`"
                  >
                    {{ item.name }}
                    <i
                      class="far fa-times-circle"
                      v-on:click="removeSkill(item)"
                      style="cursor: pointer"
                    />
                  </li>
                </ul>
                <br />
                <select class="form-control is-rounded" v-model="user.active">
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </form>
            </div>
            <div class="roadmap" v-show="tabs.roadmap">
              <header>
                <h3>Habilidades</h3>
                <span>
                  {{ $t("AdminUsers.daysLeftMessage") }}
                  <b> {{ changePositionTime }} d. </b>
                </span>
              </header>
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
                  />
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
              class="btn btn-secondary col-1"
              data-dismiss="modal"
              v-on:click="cleanStates"
            >
              {{ $t("generic.cancel") }}
            </button>
            <button
              type="button"
              class="btn btn-primary col-1"
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
import vueSelect from "vue-select";
import UserService from "../../services/user.service";
import CareerService from "../../services/career.service";
import LevelService from "../../services/level.service";
import TechnologiesService from "../../services/technologies.service";
import { verifyToken } from "../../services/helpers";
import translations from "../../data/translate";
import { API, APP_NAME } from "../../../env";
import minimunTimes from "../../data/positionMinimunTimes";
import DevOriginsService from "../../services/plataforms.service";

export default {
  name: "Users",
  components: { Spinner, vueSelect },
  data() {
    return {
      title: "My developers",
      mySelfieCube: JSON.parse(localStorage.getItem('cubeUser')),
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
        lead: {},
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
      technologies: [],
      managerUserTechs: {
        userTechs: [],
        toAdd: [],
        toRemove: [],
      },
      currentTech: {},
      leaders: [],
      plataforms: [],
    };
  },
  methods: {
    newUser() {
      this.activeTab("perfil");
      const lead = {
        id: this.mySelfieCube.id,
        name: this.mySelfieCube.name,
      };

      this.user = {
        name: "",
        active: "1",
        lead,
      };
    },
    activeTab(tab) {
      Object.keys(this.tabs).forEach((key) => {
        this.tabs[key] = false;
      });
      this.tabs[tab] = true;
    },
    getUserById(id) {
      const lead = {
        id: this.mySelfieCube.id,
        name: this.mySelfieCube.name,
      };

      this.user = { name: "", active: "1" };
      this.isFeching = true;
      UserService().getUserById(id, async (res) => {
        if (!res.error) {
          const { skills, position, since } = res.response;
          this.user = { ...res.response, lead };
          this.jobAssignments =
            translations.en.positionAssignments[position] || [];
          this.user.skills = skills ? JSON.parse(skills) : {};

          if (since !== null && since < minimunTimes[position]) {
            this.changePositionTime = minimunTimes[position] - since;
          }

          const resp = await TechnologiesService.getByUser(
            res.response.id
          );
          this.managerUserTechs.userTechs = Object.values(resp)[0] || [];
          console.log(resp, this.managerUserTechs.userTechs)
        }
        this.isFeching = false;
      });
    },
    upsertUser() {
      if (!this.validateChecks()) {
        Vue.toasted.show(
          translations[this.$store.state.language].AdminUsers
            .allChecksNotAllowedMsg,
          {
            type: "error",
            duration: 2500,
          }
        );
        return;
      }

      this.isLoading = true;
      // Agrego usuarios nuevos con el sync desde el front
      this.user.token = "";
      this.user.sync = true;
      this.user.type = this.user.role || this.user.type;

      UserService().upsertUser(this.user, (res) => {
        this.isLoading = false;

        if (!res.error) {
          $("#staticBackdrop").modal("hide");

          Vue.toasted.show("Usuario editado/creado correctamente", {
            type: "success",
            duration: 2000,
          });

          if (this.users.length < 5) {
            const page = this.page - 1;
            this.handlePagination(page);
          } else {
            this.handlePagination(this.page);
          }

          this.cleanStates();
        } else {
          this.error = res.error;
        }
      });

      this.handleSkillChanges();
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
    navigate(operator) {
      this.isLoading = true;
      if (typeof operator === "number") {
        this.page = operator;
      } else {
        operator === "+" ? (this.page += 1) : (this.page -= 1);
      }

      UserService().getAllUsers(this.page - 1, this.searchQuery, (res) => {
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
      const Users = UserService();

      Users.getAllUsers(page, this.searchQuery, (res) => {
        if (!res.error) {
          const users = res.response;
          this.users = users;
        } else {
          this.error = res.error;
        }
      });

      Users.getPagesLength(this.searchQuery || '', (res) => {
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
      this.user = this.changePositionTime = 0;
      this.error = "";
      this.isLoading = false;
      this.isFeching = false;
      this.user = {
        name: "",
        active: "1",
      };
      this.tabs = {
        perfil: true,
        roadmap: false,
      };
      this.jobAssignments = [];
      this.managerUserTechs = {
        userTechs: [],
        toAdd: [],
        toRemove: [],
      };
    },
    validateChecks() {
      const canChange = this.changePositionTime === 0;
      let allChecked = false;
      const skillArray =
        translations.en.positionAssignments[this.user.position];

      if (skillArray) {
        allChecked = skillArray.every((el) => this.user.skills[el] === true);
      }
      return !canChange && allChecked ? false : true;
    },
    addSkill() {
      const exists = this.managerUserTechs.userTechs.some(
        (el) => el.name === this.currentTech.name
      );

      if (!exists) {
        this.managerUserTechs.toRemove = this.managerUserTechs.toRemove.filter(
          (el) => el != this.currentTech
        );
        this.managerUserTechs.toAdd.push(this.currentTech);
        this.managerUserTechs.userTechs.push(this.currentTech);
      } else {
        Vue.toasted.show(
          translations[this.$store.state.language].dashboard.alreadyExists,
          {
            type: "info",
            duration: 2000,
          }
        );
      }

      console.log(this.currentTech, this.managerUserTechs)
      this.currentTech = {};
      return;
    },
    removeSkill(skill) {
      const toAdd = this.managerUserTechs.toAdd.filter(
        ({ name }) => name !== skill.name
      );
      const toRemove = [...this.managerUserTechs.toRemove, skill];
      const userTechs = this.managerUserTechs.userTechs.filter(
        ({ name }) => name !== skill.name
      );

      this.managerUserTechs = { toAdd, toRemove, userTechs };
    },
    handleSkillChanges: async function () {
      const idUser = this.user.id;
      const { toRemove, toAdd } = this.managerUserTechs;
      await Promise.all(
        toAdd.map((item) => {
          TechnologiesService.asignNew(idUser, item.id);
        })
      );
      await Promise.all(
        toRemove.map((item) => {
          TechnologiesService.remove(idUser, item.id);
        })
      );
      this.currentTech = {};
    },
    getUsers: async function () {
      this.isLoading = true;
      this.courses = [];

      UserService().getPagesLength(this.searchQuery, (res) => {
        this.pagesLength = res.error ? 1 : res.response;
      });
      UserService().getAllUsers(0, this.searchQuery, (res) => {
        this.users = Array.isArray(res.response) ? res.response : [];
      });

      this.page = 1;
      this.isLoading = false;
    },
  },
  mounted() {
    const token = localStorage.getItem(`token-app-${APP_NAME}`);
    const User = UserService();
    const lead = {
      id: this.mySelfieCube.id,
      name: this.mySelfieCube.name,
    };

    // Verifico el token
    verifyToken(token);

    CareerService()
      .getAll()
      .then((res) => (this.careers = res.response));
    LevelService()
      .getAll()
      .then((res) => (this.levels = res.response));
    DevOriginsService.getAll().then((res) => (this.plataforms = res));

    User.getAllUsersLextracking((res) => {
      this.isLoading = false;
      if (!res.error) {
        const users = res.response;
        this.usersLextracking = users.map((usr) => ({
          lead,
          active: 1,
          ...usr,
        }));
      } else {
        this.error = res.error;
      }
    });

    TechnologiesService.getAll().then((res) => {
      this.technologies = res.response;
    });
    TechnologiesService.getByUser(localStorage.getItem(`id-${APP_NAME}`)).then(
      (res) => {
        this.userTechs = res;
      }
    );

    User.getLeaders().then(({ data: res }) => {
      this.leaders = res.response ? res.response : [];
    });

    this.handlePagination();
  },
  computed: {},
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
.roadmap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}
.roadmap > header {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: baseline;
  width: 100%;
}
.tech-ctl {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}
.floatRmarginB {
  float: right;
  margin-bottom: 1rem;
}

@media (min-width: 320px) and (max-width: 1000px) {
  .coursesTab {
    padding: 0;
  }
  .perfil form label {
    padding-bottom: 1rem;
  }
  .modal-footer {
    border-top: 0 none;
  }
}
</style>

<style scoped>
@media (min-width: 320px) and (max-width: 1000px) {
  .courseContainer {
    padding: 1rem 0;
  }
}
</style>
