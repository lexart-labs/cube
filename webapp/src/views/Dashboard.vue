<template>
  <div id="dashboard--component">
    <div class="container">
      <nav class="abas-control">
        <h4
          :key="`aba${index}`"
          v-bind:class="
            aba.name === show ? 'courseTitle selected' : 'courseTitle '
          "
          v-for="(aba, index) in abas"
          v-on:click="() => setShow(aba.name)"
          v-show="
            aba.name === 'leadTree'
              ? ['admin', 'pm'].includes(myUser.type)
              : true
          "
        >
          <i v-if="aba.hasIcon" v-bind:class="aba.class"></i>
          {{ $t(`generic.${aba.name}`) }}
          <spinner v-if="isLoading"></spinner>
        </h4>
      </nav>
      <div class="courseContainer" v-if="!isLoading">
        <div>
          <div class="alert alert-primary" role="alert" v-if="error">
            <div>
              <p>{{ error }}</p>
            </div>
            <div class="text-right">
              <button
                class="btn btn-primary"
                v-on:click="syncUsuario()"
                v-bind:disabled="isSync"
              >
                Sync user
              </button>
            </div>
          </div>
          <div class="alert alert-success" role="alert" v-if="success">
            <div>
              <p>{{ success }}</p>
            </div>
          </div>
          <div v-if="isPersonifying" class="alert alert-info psy-notf" role="alert">
            <span>Is personifying, click 
            <button v-on:click="personifyDashboard()">here</button>
             to return
            </span>
          </div>

          <div class="left-select">
            <select
              id="year-filter"
              class="form-control"
              v-model="year"
              v-on:change="obtenerEvaluaciones"
              v-show="show !== 'technologies'"
              v-if="years.length > 0"
            >
              <option v-for="(yr, i) in years" :key="i" :selected="yr === year">
                {{ yr }}
              </option>
            </select>
          </div>

          <div
            v-show="isFetching"
            class="spinner-border text-info window-centered"
            role="status"
          >
            <span class="sr-only">Loading...</span>
          </div>
          <div v-show="!isFetching">
            <div v-show="show === 'Dashboard'">
              <timeline :user="myUser" v-if="myUser" />
              <h4 class="text-center" v-if="years.length === 0">
                {{
                  translations[$store.state.language].dashboard
                    .userHaventEvaluations
                }}
              </h4>
              <div class="graphics-ctl">
                <graphic v-if="resources.length" :evaluations="resources" />
                <Rombo
                  v-if="resources.length"
                  :evaluations="resources"
                  :year="year"
                />
              </div>
            </div>
            <div class="dashboard--resources" v-show="show === 'Evaluations'">
              <h4 class="text-center" v-if="years.length === 0">
                {{
                  translations[$store.state.language].dashboard
                    .userHaventEvaluations
                }}
              </h4>
              <evaluation-viewer
                v-if="resources.length"
                :course="resources[showEvaluation]"
              />
              <input
                type="search"
                :placeholder="$t('generic.searchPlaceholderEvaluations')"
                v-model="searchQuery"
                v-if="success && resultQuery.length > 0"
                class="form-control"
                style="margin-bottom: 1rem"
              />
              <div class="courseContainer" v-if="!isLoading"></div>
              <div
                class="alert alert-primary"
                :key="`resource${index}`"
                data-toggle="modal"
                data-target="#staticBackdrop"
                role="alert"
                v-show="success && resultQuery.length > 0"
                v-for="(resource, index) in resultQuery"
                v-on:click="
                  () => {
                    showEvaluation = index;
                  }
                "
              >
                <div>
                  <p>
                    <i class="bi bi-calendar-check-fill"></i>
                    {{ resource.name }}
                  </p>
                  <p class="smallText">
                    <b>Tech Lead:</b> {{ resource.lead }} -
                    {{ formatDate(resource.fecha) }}
                  </p>
                  <hr />
                  <p class="smallText" v-html="resource.observaciones"></p>
                </div>
                <div class="text-right">
                  <b>{{ resource.total }}%</b>
                </div>
              </div>
            </div>
            <div v-show="show === 'technologies'">
              <div class="new-tech-ctl">
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
                  style="font-size: 1.5rem; cursor: pointer"
                  :style="
                    currentTech && currentTech.name
                      ? ''
                      : 'pointer-events: none; color: #d3d3d3;'
                  "
                  v-on:click="addSkill()"
                />
              </div>
              <h2 style="display: flex; gap: 1rem; margin-top: 2rem">
                <span
                  class="badge badge-info badge-secondary"
                  v-for="(item, i) in userStack"
                  :key="`usrStk${i}`"
                >
                  {{ item.name }}
                  <i
                    class="far fa-times-circle remove-icon"
                    v-on:click="removeSkill(item)"
                    style="cursor: pointer; font-size: 1rem"
                  />
                </span>
              </h2>
            </div>
            <div
              v-show="show === 'leadTree'"
              v-if="['admin', 'pm'].includes(myUser.type)"
            >
              <ul class="nav nav-tabs">
                <li class="nav-item">
                  <a
                    class="nav-link"
                    v-bind:class="{ active: tabs.globalView }"
                    v-on:click="activeTab('globalView')"
                  >
                    {{ $t("dashboard.golbalView") }}
                  </a>
                </li>
                <li class="nav-item">
                  <a
                    class="nav-link"
                    v-bind:class="{ active: tabs.unasigned }"
                    v-on:click="activeTab('unasigned')"
                  >
                    {{ $t("dashboard.unasigned") }}
                  </a>
                </li>
              </ul>
              <div v-show="tabs.globalView">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Developers</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(lead, i) in developersByLead" :key="`lead${i}`">
                      <td>{{ lead.name }}</td>
                      <td>
                        <ul>
                          <li v-for="(dev, j) in lead.devs" :key="`dev${j}`">
                            {{ dev }}
                          </li>
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-show="tabs.unasigned">
                <input
                  type="text"
                  v-model="search"
                  class="form-control"
                  :placeholder="$t('AdminUsers.searchPlaceholder')"
                  style="margin: 1rem 0"
                />
                <ul class="list-group">
                  <li
                    v-for="(dev, i) in filteredUnasigned"
                    :key="`usgDev${i}`"
                    class="list-group-item"
                  >
                    {{ dev.name }}
                  </li>
                </ul>
              </div>
            </div>
            <div v-show="show === 'personify'">
              <div class="personify-searcher">
                <vue-select
                  :options="myDevs"
                  style="width: 60%"
                  :getOptionLabel="(el) => el.name"
                  v-model="myDev"
                >
                </vue-select>
                <button
                  class="btn btn-primary btn-sm"
                  :disabled="!myDev || myDev.idLextrack == 0"
                  v-on:click="personifyDashboard(myDev.idLextracking, true)"
                >
                  Personify
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Tools
import axios from "axios";
import Vue from "vue";
import vueSelect from "vue-select";
import translations from "../data/translate";
// Services
import { API, APP_NAME } from "../../env";
import UserService from "../services/user.service";
import { verifyToken, compareDBUsers } from "../services/helpers";
import TechnologiesService from "../services/technologies.service";
// Components
import Spinner from "../components/Spinner.vue";
import Timeline from "../components/Timeline.vue";
import Graphic from "../components/graphicEvaluation.vue";
import EvaluationViewer from "../components/evaluationsViewer.vue";
import Rombo from "../components/rombo.vue";
import DashComp from "../components/DashboardComp.vue";

export default {
  name: "Dashboard",
  components: {
    Spinner,
    Timeline,
    Graphic,
    EvaluationViewer,
    Rombo,
    vueSelect,
    DashComp,
  },
  data() {
    return {
      title: "Dashboard",
      courses: [],
      isLoading: true,
      isFetching: false,
      isSync: false,
      searchQuery: null,
      search: "",
      error: "",
      success: "",
      resources: [],
      show: "Dashboard",
      abas: [
        { name: "Dashboard", class: "bi bi-clipboard-data", hasIcon: true },
        {
          name: "Evaluations",
          class: "bi bi-calendar-check-fill",
          hasIcon: true,
        },
        { name: "technologies", class: "fas fa-code", hasIcon: true },
        { name: "leadTree", class: "fas fa-sitemap", hasIcon: true },
        { name: "personify", class: "fas fa-user-friends", hasIcon: true },
      ],
      showEvaluation: 0,
      year: null,
      years: [],
      userStack: [],
      technologies: [],
      currentTech: {},
      translations,
      myUser: {},
      tabs: {
        unasigned: false,
        globalView: true,
      },
      developersByLead: [],
      unasignedDevs: [],
      isPersonifying: false,
      myDevs: [],
      myDev: {
        idLextrack: 0,
        token: "",
      },
    };
  },
  watch: {
    "$store.state.language": function (newVal, oldVal) {
      this.success = this.success
        ? translations[this.$store.state.language].dashboard.messageSyncStatus
        : translations[this.$store.state.language].dashboard.messageNotSync;
    },
  },
  methods: {
    syncUsuario() {
      // Obtener los datos del lextracking
      const userLextracking = JSON.parse(
        localStorage.getItem(`_lextracking_user-${APP_NAME}`)
      );
      userLextracking.type = userLextracking.role;
      userLextracking.sync = !(
        userLextracking.cubeExist && userLextracking.cubeExist === true
      );

      this.isSync = true;
      UserService().upsertUser(userLextracking, (res) => {
        this.isSync = false;
        if (!res.error) {
          Vue.toasted.show(
            translations[this.$store.state.language].dashboard.messageSync,
            {
              type: "success",
              duration: 2000,
            }
          );

          this.error = "";
          this.success =
            translations[
              this.$store.state.language
            ].dashboard.messageSyncStatus;
          // const id = localStorage.getItem(`id-${APP_NAME}`);

          // Obtenemos evaluaciones de un usuario
          // this.obtenerEvaluaciones(id)
          window.location.reload();
        } else {
          this.error = res.error;

          Vue.toasted.show(
            translations[this.$store.state.language].dashboard.messageNotSync,
            {
              type: "error",
              duration: 2000,
            }
          );
        }
      });
    },
    obtenerEvaluaciones() {
      this.isFetching = true;

      const id = localStorage.getItem(`id-${APP_NAME}`);
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        "user-id": userId,
      };
      axios
        .get(`${API}courses/by-user/${id}?year=${this.year}`, { headers })
        .then((res) => {
          this.isFetching = false;
          if (!res.data.error) {
            const data = res.data.response;
            this.resources = data;
          } else {
            this.isFetching = false;
            Vue.toasted.show(
              translations[this.$store.state.language].dashboard
                .evaluationNotFound,
              {
                type: "error",
                duration: 2000,
              }
            );
          }
        });
    },
    formatDate(date) {
      // Format SQL to UY date
      const newDate = date.split("T");
      // 0 index correspond to raw date after split
      let uyDate = newDate[0].split("-");
      // 2 index - year
      // 1 index - month
      // 0 index - day
      uyDate = `${uyDate[2]}/${uyDate[1]}/${uyDate[0]}`;
      // sum full year UY format with hour after split - index 0
      uyDate = `${uyDate} ${newDate[1]}`;

      return uyDate;
    },
    setShow(abaName) {
      this.show = abaName;
    },
    getYears: async function (idDev) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        "user-id": userId,
      };

      const { data } = await axios.get(
        `${API}courses/years/${idDev || userId}`,
        {
          headers,
        }
      );
      if (!data.err) return data;

      Vue.toasted.show(
        translations[this.$store.state.language].dashboard
          .userHaventEvaluations,
        {
          type: "info",
          duration: 2000,
        }
      );

      return [];
    },
    addSkill() {
      const idLextracking = JSON.parse(
        localStorage.getItem(`_lextracking_user-${APP_NAME}`)
      ).idLextracking;
      const exists = this.userStack.some(
        (el) => el.name === this.currentTech.name
      );
      if (!exists) {
        this.userStack.push(this.currentTech);
        TechnologiesService.asignNew(idLextracking, this.currentTech.id);
        this.currentTech = {};
      } else {
        Vue.toasted.show(
          translations[this.$store.state.language].dashboard.alreadyExists,
          {
            type: "info",
            duration: 2000,
          }
        );
        this.currentTech = {};
      }
    },
    removeSkill(skill) {
      const idLextracking = JSON.parse(
        localStorage.getItem(`_lextracking_user-${APP_NAME}`)
      ).idLextracking;
      this.userStack = this.userStack.filter((el) => el !== skill);
      TechnologiesService.remove(idLextracking, skill.id);
    },
    activeTab(tab) {
      Object.keys(this.tabs).forEach((key) => {
        this.$set(this.tabs, key, false);
      });
      this.$set(this.tabs, tab, true);
    },
    findUnasignedDevs: async function () {
      this.isLoading = true;
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);
      const headers = { token, "user-id": userId };

      const {
        data: { response: trckUsrs },
      } = await axios.get(`${API}users/lextracking/all?minified=true`, {
        headers,
      });
      const {
        data: { response: cubeIds },
      } = await axios.get(`${API}users/lextracking-ids`, { headers });

      this.isLoading = false;
      return compareDBUsers(cubeIds, trckUsrs);
    },
    getEvaluations: async function (token, userId, idDev) {
      const headers = {
        token,
        "user-id": userId,
      };

      const {
        data: { response },
      } = await axios.get(
        `${API}courses/by-user/${idDev || IdUser}?year=${2022}`,
        {
          headers,
        }
      );

      if (response) {
        return response;
      } else {
        Vue.toasted.show(
          translations[this.$store.state.language].dashboard.evaluationNotFound,
          { type: "error", duration: 2000 }
        );
      }

      return [];
    },
    getMyUser: async function (token, userId, idDev) {
      const headers = {
        token,
        "user-id": userId,
      };

      const {
        data: { response },
      } = await axios.get(`${API}users/${idDev || idUser}`, { headers });

      if (response) {
        const user = { ...response, skills: JSON.parse(response.skills) };
        return user;
      }

      return {};
    },
    personifyDashboard: async function (
      id = localStorage.getItem(`id-${APP_NAME}`),
      toggle = false
    ) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const idUser = localStorage.getItem(`id-${APP_NAME}`);

      // Limpar estados atuais que afetam a troca
      this.isLoading = true;
      this.show = "Dashboard";
      this.showEvaluation = 0;
      this.year = null;
      this.years = [];
      this.myUser = {};
      this.resources = [];
      this.isPersonifying = toggle;

      // Buscar as informações do novo usuário
      const [myUser, evaluations, years] = await Promise.all([
        this.getMyUser(token, idUser, id),
        this.getEvaluations(token, idUser, id),
        this.getYears(idUser),
      ]);

      this.isLoading = false;

      // Setar os estados;
      this.myUser = myUser;
      this.years = years;
      this.year = years.length ? years[years.length - 1] : null;
      this.resources = evaluations;
    },
  },
  mounted() {
    const id = localStorage.getItem(`id-${APP_NAME}`);
    const token = localStorage.getItem(`token-app-${APP_NAME}`);
    const userId = localStorage.getItem(`id-${APP_NAME}`);
    verifyToken(token);

    const headers = {
      token,
      "user-id": userId,
    };

    if (id) {
      axios.get(`${API}users/${id}`, { headers }).then(async (res) => {
        this.isLoading = false;

        if (!res.data.error) {
          this.myUser = res.data.response;
          this.myUser.skills = JSON.parse(res.data.response.skills);
          this.success =
            translations[
              this.$store.state.language
            ].dashboard.messageSyncStatus;

          // Obtenemos evaluaciones de un usuario
          const years = await this.getYears(id);
          if (years.length) {
            this.year = years;
            this.year = years[years.length - 1];
          }
          if (this.year) this.obtenerEvaluaciones(id, this.year);
          TechnologiesService.getByUser(this.myUser.idLextracking).then(
            (resp) => (this.userStack = Object.values(resp)[0] || [])
          );
        } else {
          // Si no obtengo el usuario en la base, deberíamos cargarnos
          this.error =
            translations[
              this.$store.state.language
            ].dashboard.messageNotSyncStatus;
        }

        TechnologiesService.getAll().then(
          (res) => (this.technologies = res.response)
        );

        if (this.myUser.type == "admin" || this.myUser.type == "pm") {
          UserService()
            .getLeaderDevs(this.myUser.idLextracking)
            .then(({ data: { response } }) => {
              this.myDevs = response;
            });

          UserService()
            .listLeadDevs()
            .then(({ data }) => {
              this.developersByLead = data.response;
            });

          this.findUnasignedDevs().then((res) => {
            this.unasignedDevs = res.sort((a, b) => {
              if (a.name > b.name) {
                return 1;
              }
              if (a.name < b.name) {
                return -1;
              }
              return 0;
            });
          });
        }
      });
    }
  },
  computed: {
    resultQuery() {
      if (this.searchQuery) {
        return this.resources.filter((item) =>
          this.searchQuery
            .toLowerCase()
            .split(" ")
            .every((v) => item.name.toLowerCase().includes(v))
        );
      }
      return this.resources;
    },
    filteredUnasigned() {
      const regex = new RegExp(`${this.search}`, "i");
      return this.unasignedDevs.filter((dev) => dev.name.match(regex));
    },
  },
};
</script>

<style scoped>
.left-select {
  width: 10vw;
  margin: 1rem 0rem;
}

.graphics-ctl {
  width: 100%;
  display: flex;
  flex-flow: column;
  gap: 2rem;
  align-content: center;
  justify-content: center;
}

.window-centered {
  position: fixed;
  top: 50%;
  left: 50%;
}

.new-tech-ctl {
  display: flex;
  gap: 1rem;
  width: 100%;
  align-items: center;
  justify-content: space-between;
}

table {
  margin-top: 2rem;
}

.personify-searcher {
  display: flex;
  width: 100%;
  justify-content: center;
  gap: 1rem;
}
.psy-notf button {
  padding: 0;
  background-color: transparent;
  color: #0c5460;
  border: none;
  font-weight: 700;
}
.psy-notf button:hover {
  text-decoration: underline;
}
</style>
