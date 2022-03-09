<template>
  <div id="dashboard--component">
    <div class="container-dash">
      <nav class="abas-control">
        <ul>
          <li
            :key="`aba${index}`"
            v-bind:class="
              aba.name === show
                ? 'courseTitle selected is-bold'
                : 'courseTitle is-bold'
            "
            v-for="(aba, index) in abas"
            v-on:click="() => setShow(aba.name)"
            v-show="
              aba.onlyAdmin ? ['admin', 'pm'].includes(myUser.type) : true
            "
          >
            <h4>
              <i v-if="aba.hasIcon" v-bind:class="aba.class"></i>
              {{ $t(`generic.${aba.name}`) }}
            </h4>
          </li>
        </ul>
      </nav>
      <div class="courseContainer">
        <div>
          <section class="warnings">
            <div class="alerts-group">
              <div role="alert" v-if="error">
                <span>{{ error }}</span>
                <div class="text-right">
                  <button
                    class="btn btn-primary btn-sm"
                    v-on:click="syncUsuario()"
                    v-bind:disabled="isSync"
                  >
                    Sync user
                  </button>
                </div>
              </div>
              <div role="alert" v-if="success">
                <span>{{ success }}</span>
                <i class="fas fa-check alert-check" />
              </div>
              <div
                v-if="isPersonifying"
                class="alert alert-info psy-notf"
                role="alert"
              >
                <span
                  >Is personifying, click
                  <button v-on:click="personifyDashboard()">here</button>
                  to return
                </span>
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
                <option
                  v-for="(yr, i) in years"
                  :key="i"
                  :selected="yr === year"
                >
                  {{ yr }}
                </option>
              </select>
            </div>
          </section>

          <div
            v-show="isLoading || isFetching"
            class="spinner-border text-info window-centered"
            role="status"
          >
            <span class="sr-only">Loading...</span>
          </div>

          <main v-show="!isFetching && !isLoading">
            <section v-show="show === 'Dashboard'" class="is-padded">
              <div id="dash-ctrl">
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
            </section>
            <section v-show="show === 'Evaluations'" class="dashboard--resources">
              <h4 class="text-center" v-if="years.length === 0">
                {{
                  translations[$store.state.language].dashboard.userHaventEvaluations
                }}
              </h4>
              <evaluation-viewer
                v-if="resources.length"
                :course="resources[showEvaluation]"
              />
              <div class="inner-addon right-addon">
                <input
                  type="search"
                  :placeholder="$t('generic.searchPlaceholderEvaluations')"
                  v-model="searchQuery"
                  v-if="success && resultQuery.length > 0"
                  class="form-control rounded-input"
                  style="margin-bottom: 1rem"
                />
                <!-- <i class="fas fa-search"></i> -->
              </div>
              <div class="courseContainer" v-if="!isLoading"></div>
              <div
                class="alert alert-primary evaluation-card"
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
                  <div class="is-bold is-big-text eval-head">
                    <h2>
                      <i
                        class="bi bi-calendar-check-fill"
                        style="font-size: 80%"
                      />
                      {{ resource.name }}
                    </h2>
                    <span class="text-right">
                      <b>{{ resource.total }}%</b>
                    </span>
                  </div>
                  <p class="smallText">
                    <b>Tech Lead:</b> {{ resource.lead }} -
                    {{ formatDate(resource.fecha) }}
                  </p>
                  <hr />
                  <p class="smallText" v-html="resource.observaciones"></p>
                </div>
              </div>
            </section>
            <section v-show="show === 'technologies'">
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
                  style="font-size: 2rem; cursor: pointer"
                  :style="
                    currentTech && currentTech.name
                      ? ''
                      : 'pointer-events: none; color: #d3d3d3;'
                  "
                  v-on:click="addSkill()"
                />
              </div>
              <div class="tech">
                <h2 class="tag">
                  <span
                    class="badge badge-primary"
                    v-for="(item, i) in userStack"
                    :key="`usrStk${i}`"
                  >
                    {{ item.name }}
                    <i
                      class="fas fa-times-circle remove-icon"
                      v-on:click="removeSkill(item)"
                    />
                  </span>
                </h2>
              </div>
            </section>
            <section v-show="show === 'leadTree'"
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
                      <th class="is-bold">Lead</th>
                      <th class="is-bold">Developers</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(lead, i) in developersByLead" :key="`lead${i}`">
                      <td>{{ lead.name }}</td>
                      <td>
                        <ul class="list-group">
                          <li
                            v-for="(dev, j) in lead.devs"
                            :key="`dev${j}`"
                            style="padding: 0.5rem;"
                          >
                            <b>{{ dev.name }}</b> - {{ dev.position }} ({{ dev.time }} {{$t('generic.days')}})
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
                  class="form-control rounded-input"
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
            </section>
            <section v-show="show === 'personify'">
              <div class="personify-searcher">
                <vue-select
                  :options="myDevs"
                  :getOptionLabel="(el) => el.name"
                  v-model="myDev"
                  class="col-10 is-rounded"
                >
                </vue-select>
                <button
                  class="btn btn-primary btn-sm col-1"
                  :disabled="!myDev || myDev.idLextrack == 0"
                  v-on:click="personifyDashboard(myDev.id, true)"
                >
                  Personify
                </button>
              </div>
            </section>
            <section v-show="show === 'hunting'">
              <header>
                <div class="filters-ctl">
                  <div class="searcher">
                    <vue-select
                      :options="technologies.map((el) => el.name)"
                      v-model="currentTechFilter"
                      id="searchInput"
                    >
                    </vue-select>
                    <i
                      class="fas fa-plus-circle"
                      style="font-size: 1.3rem; cursor: pointer"
                      :style="
                        currentTechFilter
                          ? ''
                          : 'pointer-events: none; color: #d3d3d3;'
                      "
                      v-on:click="setFilter()"
                    />
                    <button
                      type="button"
                      class="btn btn-success btn-sm"
                      :disabled="filters.technologies.length === 0"
                      v-on:click="searchDevs()"
                    >
                      {{ $t("generic.search") }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary btn-sm"
                      data-toggle="modal"
                      data-target="#saveTeamModal"
                      :disabled="!(currentTeam && currentTeam.length)"
                    >
                      {{ $t("generic.save") }}
                    </button>
                    <button
                      v-if="inUseTeamList !== 'developers'"
                      v-on:click="cleanStatesTeams"
                      class="btn btn-primary btn-sm"
                    >
                      {{ $t("generic.cancel") }}
                    </button>
                  </div>
                  <div class="order">
                      <vue-select
                        :options="indicators"
                        v-model="filters.sorter"
                        id="filterInput"
                        :placeholder="$t('generic.order')"
                      >
                      </vue-select>
                    <abbr title="Teams" style="cursor: pointer">
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
                    </abbr>
                  </div>
                </div>
                  <h4 class="tag">
                    <span
                      class="badge badge-primary"
                      v-for="(item, i) in filters.technologies"
                      :key="`usrStk${i}`"
                      style="width: 10rem;"
                    >
                      {{ item }}
                      <i
                        class="fas fa-times-circle remove-icon"
                        v-on:click="unsetFilter(item)"
                      />
                    </span>
                  </h4>

              </header>
              <div v-for="(dev, i) in filteredCards" :key="`dev${i}`">
                <UserCard
                  :user="dev"
                  :selected="currentTeam.some((el) => el.name === dev.name)"
                  :onClick="handleTeamChanges"
                />
              </div>
              <nav class="pages-nav" v-show="developers.length">
                <span
                  v-on:click="navigate('-')"
                  :class="currentPage == 1 ? 'not-allowed' : ''"
                >
                  Back
                </span>
                <span
                  :class="currentPage == index ? 'current' : ''"
                  v-for="index in pagesLength"
                  :key="index"
                  v-on:click="navigate(index)"
                >
                  {{ index }}
                </span>
                <span
                  v-on:click="navigate('+')"
                  :class="currentPage == pagesLength ? 'not-allowed' : ''"
                >
                  Next
                </span>
              </nav>

              <!-- Modal save -->
              <div class="modal" role="dialog" id="saveTeamModal">
                <div class="modal-dialog" role="document">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title is-bold">
                        {{ $t("dashboard.saveTeam") }}
                      </h5>
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
                        class="form-control is-rounded"
                        placeholder="Team name"
                        style="margin-bottom: 1rem"
                      />
                      <ul class="styled-list">
                        <li v-for="dev in currentTeam" :key="`${dev.name}`">
                          {{ dev.name }}
                        </li>
                      </ul>
                    </div>
                    <div class="modal-footer">
                      <button
                        type="button"
                        v-on:click="teamName = ''"
                        class="btn btn-secondary"
                        data-dismiss="modal"
                      >
                        {{ $t("generic.close") }}
                      </button>
                      <button
                        type="button"
                        class="btn btn-primary"
                        v-on:click="saveTeam"
                        data-dismiss="modal"
                      >
                        {{ $t("dashboard.saveTeam") }}
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
                      <h5 class="modal-title is-bold">
                        {{ $t("dashboard.teamModalTitle") }}
                      </h5>
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
                            <div>
                              <div class="team-card-title">
                                <h5 style="font-size: 1.5rem"><b>{{ team.name }}</b></h5>
                                <span>{{
                                  formatDate(team.updatedAt).split(".")[0]
                                }}</span>
                              </div>
                              <div class="team-card-icons">
                                <i
                                  class="fas fa-pen"
                                  v-on:click="addToStage(team, 'edit')"
                                />
                                <i
                                  class="fas fa-trash"
                                  data-toggle="modal"
                                  data-target="#confirmModal"
                                  v-on:click="addToStage(team, 'remove')"
                                />
                              </div>
                            </div>
                            <ul class="styled-list">
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

              <!-- Modal confirmation -->
              <div class="modal fade" role="dialog" id="confirmModal">
                <div class="modal-dialog modal-dialog-centered" role="document">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title is-bold">
                        {{ $t("generic.warning") }}
                      </h5>
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
                      <span>
                        {{ $t("dashboard.confirmRemove") }}
                      </span>
                    </div>
                    <div class="modal-footer">
                      <button
                        type="button"
                        class="btn btn-secondary"
                        data-dismiss="modal"
                      >
                        {{ $t("generic.no").toLowerCase() }}
                      </button>
                      <button
                        type="button"
                        class="btn btn-primary"
                        v-on:click="removeTeam(teamId)"
                        data-dismiss="modal"
                      >
                        {{ $t("generic.yes").toLowerCase() }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
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
import TeamService from "../services/teams.service";
// Components
import Spinner from "../components/Spinner.vue";
import Timeline from "../components/Timeline.vue";
import Graphic from "../components/graphicEvaluation.vue";
import EvaluationViewer from "../components/evaluationsViewer.vue";
import UserCard from "../components/userCard.vue";
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
    UserCard,
  },
  data() {
    return {
      // General
      title: "Dashboard",
      isLoading: true,
      isFetching: false,
      isSync: false,
      searchQuery: null,
      search: "",
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
        {
          name: "personify",
          class: "fas fa-user-friends",
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
      pagesLength: 0,
      currentPage: 1,

      //Personifying
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
      const idDev = this.myUser.id;
      const exists = this.userStack.some(
        (el) => el.name === this.currentTech.name
      );

      if (!exists) {
        this.userStack.push(this.currentTech);
        TechnologiesService.asignNew(idDev, this.currentTech.id);
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
      const idDev = this.myUser.id;
      this.userStack = this.userStack.filter((el) => el !== skill);
      TechnologiesService.remove(idDev, skill.id);
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
      const headers = { token, "user-id": userId , 'company_slug': localStorage.getItem("_company-slug") };

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
        (el) => el === this.currentTechFilter
      );

      if (exists) {
        this.currentTechFilter = "";
        return;
      }

      this.filters.technologies.push(this.currentTechFilter);
      this.currentTechFilter = "";
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
    unsetFilter(tech) {
      const newFilters = this.filters.technologies.filter((el) => el !== tech);
      this.filters.technologies = newFilters;

      if (!this.filters.technologies.length) {
        // this.developers = [];
        return;
      }
    },
    searchDevs() {
      this.isFetching = true;
      this.currentPage = 1;

      UserService().countDevs(this.filters.technologies, (data) => {
        this.pagesLength = data.response;
      });

      UserService().allDevIndicators(
        null,
        this.filters.technologies,
        this.currentPage,
        (res) => {
          this.isFetching = false;
          this.developers = res.response;
        }
      );
    },
    saveTeam() {
      this.isFetching = true;
      const payload = {
        team: this.currentTeam,
        name: this.teamName,
        idLead: this.myUser.id,
        stack: this.filters.technologies,
      };

      if (this.teamId > 0) {
        TeamService.updateOne(this.teamId, payload)
          .then((res) => {
            if (!res.error) {
              Vue.toasted.show(
                translations[this.$store.state.language].dashboard.teamSaved,
                {
                  type: "success",
                  duration: 2000,
                }
              );
            }

            this.cleanStatesTeams();
            this.getTeams();
          })
          .catch((err) => {
            this.isFetching = false;
          });
      } else {
        TeamService.insertOne(payload)
          .then((res) => {
            if (!res.error) {
              Vue.toasted.show(
                translations[this.$store.state.language].dashboard.teamSaved,
                {
                  type: "success",
                  duration: 2000,
                }
              );
            }

            this.cleanStatesTeams();
            this.getTeams();
          })
          .catch((err) => {
            this.isFetching = false;
          });
      }

      this.filters.technologies = [];
      this.developers = [];
    },
    getTeams() {
      this.isFetching = true;

      TeamService.getAll().then((res) => {
        if (res.response) {
          this.teams = res.response.map((team) => ({
            ...team,
            team: JSON.parse(team.team),
            mainStack: JSON.parse(team.mainStack),
          }));
        }

        this.isFetching = false;
      });
    },
    removeTeam(id) {
      this.isFetching = true;
      TeamService.remove(id).then((res) => {
        if (!res.error) {
          Vue.toasted.show(
            translations[this.$store.state.language].dashboard.teamRemoved,
            {
              type: "success",
              duration: 2000,
            }
          );
        }

        this.cleanStatesTeams();
        $("#teamsModal").modal("hide");
        this.getTeams();
      });
    },
    addToStage(team, op) {
      if (op === "edit") {
        this.currentTeam = team.team;
        this.developers = team.team;
        this.teamName = team.name;
        this.filters.technologies = team.mainStack || [];
        this.inUseTeamList = "currentTeam";
        this.teamId = team.id;
        $("#teamsModal").modal("hide");
      } else if (op === "remove") {
        this.teamId = team.id;
        $("#teamsModal").modal("hide");
      }
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
      this.developers = [];
      this.teamName = "";
      this.teamId = 0;
      this.inUseTeamList = "developers";
    },
    navigate(operator) {
      this.isFetching = true;
      if (typeof operator === "number") {
        this.currentPage = operator;
      } else {
        operator === "+" ? (this.currentPage += 1) : (this.currentPage -= 1);
      }

      UserService().allDevIndicators(
        null,
        this.filters.technologies,
        this.currentPage,
        (res) => {
          this.isFetching = false;
          this.developers = res.response;
        }
      );
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
      this.year = new Date().getFullYear();
      this.years = [new Date().getFullYear()];
      this.myUser = {};
      this.resources = [];
      this.isPersonifying = toggle;

      // Buscar as informações do novo usuário
      const [myUser, evaluations, years, myTechs] = await Promise.all([
        this.getMyUser(token, idUser, id),
        this.getEvaluations(token, idUser, id),
        this.getYears(id),
        TechnologiesService.getByUser(id),
      ]);

      this.isLoading = false;

      // Setar os estados;
      this.myUser = myUser;
      if (!toggle) {
        this.years = years;
        this.year = years.length ? years[years.length - 1] : null;
      }
      this.userStack = Object.values(myTechs)[0] || [];
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
      'company_slug': localStorage.getItem("_company-slug"),
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
            this.years = years;
            this.year = years[years.length - 1];
          }
          if (this.year) this.obtenerEvaluaciones(id, this.year);

          TechnologiesService.getByUser(id).then(
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
            .getLeaderDevs(id)
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

          this.getTeams();
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
      const arrayOfDevs = this.developers;
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
.graphics-ctl {
  width: 100%;
  display: flex;
  flex-flow: column;
  gap: 2rem;
  align-content: center;
  justify-content: center;
}
table {
  margin-top: 2rem;
}

#teamsModal .modal-body > ul {
  list-style: none outside none;
  margin: 0;
  padding: 0;
}

.team-card {
  display: flex;
  flex-flow: column;
  width: 100%;
  padding: 1rem;
  box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
}

.team-card > div {
  display: flex;
  width: 100%;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.team-card h5 {
  text-transform: capitalize;
  margin-bottom: 0;
}

.team-card-title span {
  font-size: 0.8rem;
  font-weight: 700;
  margin-top: 0;
}

.team-card-icons {
  display: flex;
  gap: 1rem;
}

.team-card-icons i {
  cursor: pointer;
}
</style>
