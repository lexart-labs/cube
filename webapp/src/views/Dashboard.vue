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
          v-show="aba.onlyAdmin ? ['admin', 'pm'].includes(myUser.type) : true"
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
            <div v-show="show === 'hunting'">
              <header>
                <div class="filters-ctl">
                  <div class="searcher">
                    <vue-select
                      :options="technologies.map((el) => el.name)"
                      v-model="currentTechFilter"
                      style="width: 80%; height: 2rem"
                    >
                    </vue-select>
                    <button
                      type="button"
                      class="btn btn-info"
                      :disabled="!currentTechFilter"
                      v-on:click="setFilter()"
                    >
                      Buscar
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary"
                      data-toggle="modal"
                      data-target="#saveTeamModal"
                      :disabled="!(currentTeam && currentTeam.length)"
                    >
                      Guardar
                    </button>
                    <button
                      v-if="inUseTeamList !== 'developers'"
                      v-on:click="cleanStatesTeams"
                    >
                      Cancelar Edición
                    </button>
                  </div>
                  <div class="order">
                    <label> Ordenar</label>
                    <vue-select
                      :options="indicators"
                      v-model="filters.sorter"
                      style="min-width: 80%"
                    >
                    </vue-select>
                    <i
                      class="fas fa-list-ul"
                      style="font-size: 2rem"
                      data-toggle="modal"
                      data-target="#teamsModal"
                      :style="
                        teams && teams.length
                          ? ''
                          : 'pointer-events: none; color: #d3d3d3;'
                      "
                    />
                  </div>
                </div>
                <h4 style="display: flex; gap: 1rem; margin-top: 0.5rem">
                  <span
                    class="badge badge-info badge-secondary"
                    v-for="(item, i) in filters.technologies"
                    :key="`usrStk${i}`"
                  >
                    {{ item }}
                    <i
                      class="far fa-times-circle remove-icon"
                      v-on:click="unsetFilter(item)"
                      style="cursor: pointer; font-size: 1rem"
                    />
                  </span>
                </h4>
              </header>
              <div
                v-for="(dev, i) in filteredCards"
                :key="`dev${i}`"
                v-on:click="handleTeamChanges(dev)"
              >
                <UserCard
                  :user="dev"
                  :selected="currentTeam.some((el) => el.name === dev.name)"
                />
              </div>

              <!-- Modal save -->
              <div class="modal" role="dialog" id="saveTeamModal">
                <div class="modal-dialog" role="document">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Save Team</h5>
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
                      <input
                        type="text"
                        v-model="teamName"
                        class="form-control"
                        placeholder="Team name"
                      />
                      <ul>
                        <li v-for="dev in currentTeam" :key="`${dev.name}`">
                          {{ dev.name }}
                        </li>
                      </ul>
                    </div>
                    <div class="modal-footer">
                      <button
                        type="button"
                        class="btn btn-primary"
                        v-on:click="saveTeam"
                        data-dismiss="modal"
                      >
                        Save Team
                      </button>
                      <button
                        type="button"
                        class="btn btn-secondary"
                        data-dismiss="modal"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modal available Lists -->
              <div class="modal" role="dialog" id="teamsModal">
                <div class="modal-dialog" role="document">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Your Teams</h5>
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
                      <ul>
                        <li v-for="team in teams" :key="`${team.name}`">
                          <div class="team-card">
                            <h5>{{ team.name }}</h5>
                            <span>{{
                              formatDate(team.updatedAt).split(".")[0]
                            }}</span>
                            <i class="fas fa-pen" v-on:click="editTeam(team)" />
                            <i
                              class="fas fa-trash"
                              v-on:click="removeTeam(team.id)"
                            />
                            <ul>
                              <li
                                v-for="dev in team.team"
                                :key="`dev-${dev.name}`"
                              >
                                {{ dev.name }}
                              </li>
                            </ul>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Vue from "vue";
import vueSelect from "vue-select";
import { API, APP_NAME } from "../../env";
import UserService from "../services/user.service";
import { verifyToken, compareDBUsers } from "../services/helpers";
import Spinner from "../components/Spinner.vue";
import Timeline from "../components/Timeline.vue";
import Graphic from "../components/graphicEvaluation.vue";
import EvaluationViewer from "../components/evaluationsViewer.vue";
import UserCard from "../components/userCard.vue";
import Rombo from "../components/rombo.vue";
import translations from "../data/translate";
import TechnologiesService from "../services/technologies.service";
import TeamService from "../services/teams.service";

export default {
  name: "Dashboard",
  components: {
    Spinner,
    Timeline,
    Graphic,
    EvaluationViewer,
    Rombo,
    vueSelect,
    UserCard,
  },
  data() {
    return {
      // General
      title: "Dashboard",
      isLoading: true,
      isFetching: false,
      isSync: false,
      error: "",
      success: "",
      translations,
      myUser: {},

      // Evaluations
      courses: [],
      searchQuery: null,
      resources: [],
      search: "",
      showEvaluation: 0,
      year: null,
      years: [],

      // Tabs control
      show: "Dashboard",
      abas: [
        {
          name: "Dashboard",
          class: "bi bi-clipboard-data",
          hasIcon: true,
          onlyAdmin: false,
        },
        {
          name: "Evaluations",
          class: "bi bi-calendar-check-fill",
          hasIcon: true,
          onlyAdmin: false,
        },
        {
          name: "technologies",
          class: "fas fa-code",
          hasIcon: true,
          onlyAdmin: false,
        },
        {
          name: "leadTree",
          class: "fas fa-sitemap",
          hasIcon: true,
          onlyAdmin: true,
        },
        {
          name: "hunting",
          class: "far fa-id-card",
          hasIcon: true,
          onlyAdmin: true,
        },
      ],

      // Technologies
      userStack: [],
      technologies: [],
      currentTech: {},

      // leads map
      tabs: {
        unasigned: false,
        globalView: true,
      },
      developersByLead: [],
      unasignedDevs: [],

      // Teams
      indicators: [
        "Human Factor",
        "Performance",
        "Ability",
        "Evolution",
        "Continuity",
      ],
      developers: [],
      currentTechFilter: "",
      filters: {
        technologies: [],
        sorter: "",
      },
      currentTeam: [],
      teams: [],
      teamName: "",
      inUseTeamList: "developers",
      teamId: 0,
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
    getYears: async function (id) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        "user-id": userId,
      };

      const { data } = await axios.get(`${API}courses/years/${id}`, {
        headers,
      });
      if (!data.err) {
        this.years = data;
        this.year = data[data.length - 1];
      } else {
        console.log("ENTER");
        Vue.toasted.show(
          translations[this.$store.state.language].dashboard
            .userHaventEvaluations,
          {
            type: "info",
            duration: 2000,
          }
        );
      }
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
    setFilter() {
      const exists = this.filters.technologies.some(
        el => el === this.currentTechFilter
      );

      if(exists) {
        this.currentTechFilter = "";
        return;
      }

      this.isFetching = true;

      this.filters.technologies.push(this.currentTechFilter);
      this.currentTechFilter = "";

      UserService().allDevIndicators(null, this.filters.technologies, (res) => {
        this.isFetching = false;
        this.developers = res.response;
      });
    },
    unsetFilter(tech) {
      this.isFetching = true;
      const newFilters = this.filters.technologies.filter((el) => el !== tech);
      this.filters.technologies = newFilters;

      UserService().allDevIndicators(null, this.filters.technologies, (res) => {
        this.isFetching = false;
        this.developers = res.response;
      });
    },
    saveTeam() {
      this.isFetching = true;
      const payload = {
        team: this.currentTeam,
        name: this.teamName,
        idLead: this.myUser.idLextracking,
      };

      if (this.teamId > 0) {
        TeamService.updateOne(this.teamId, payload)
          .then((res) => {
            this.cleanStatesTeams();
            this.getTeams();
          })
          .catch((err) => {
            this.isFetching = false;
          });
      } else {
        TeamService.insertOne(payload)
          .then((res) => {
            this.cleanStatesTeams();
            this.getTeams();
          })
          .catch((err) => {
            this.isFetching = false;
          });
      }
    },
    getTeams() {
      this.isFetching = true;
      TeamService.getAll().then((res) => {
        if (res.response && res.response.length) {
          this.teams = res.response.map((team) => ({
            ...team,
            team: JSON.parse(team.team),
          }));
        }

        this.isFetching = false;
      });
    },
    removeTeam(id) {
      this.isFetching = true;
      TeamService.remove(id).then((res) => {
        $("#teamsModal").modal("hide");
        this.getTeams();
      });
    },
    editTeam(team) {
      this.currentTeam = team.team;
      this.teamName = team.name;
      this.inUseTeamList = "currentTeam";
      this.teamId = team.id;
      $("#teamsModal").modal("hide");
    },
    handleTeamChanges(dev) {
      const exists = this.currentTeam.some((el) => el.name === dev.name);
      if (exists) {
        this.currentTeam = this.currentTeam.filter(
          (el) => el.name !== dev.name
        );
      } else {
        this.currentTeam.push(dev);
      }
    },
    cleanStatesTeams() {
      this.currentTeam = [];
      this.teamName = "";
      this.teamId = 0;
      this.inUseTeamList = "developers";
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
          await this.getYears(id);
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
            .listLeadDevs()
            .then(({ data }) => (this.developersByLead = data.response));

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

          this.getTeams();

          UserService().allDevIndicators(null, null, (res) => {
            this.developers = res.response;
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
    filteredCards() {
      const arrayOfDevs =
      this.inUseTeamList == "developers" ? this.developers : this.currentTeam;
      const sorter = this.filters.sorter;
      let result = arrayOfDevs;

      if (sorter) {
        result = result.sort(({ indicadores: a }, { indicadores: b }) => {
          const docA = a.find((el) => el.label === sorter).value;
          const docB = b.find((el) => el.label === sorter).value;

          return Number(docB) - Number(docA);
        });
      }

      return result;
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

.filters-ctl {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  width: 100%;
}

.filters-ctl .searcher {
  display: flex;
  width: 50%;
  gap: 1rem;
}

.order {
  display: flex;
  gap: 1rem;
  margin-right: 0;
  width: 20%;
}
</style>
