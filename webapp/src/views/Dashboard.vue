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
              <option
                v-for="(yr, i) in years"
                :key="i"
                :selected="yr === year"
              >
                {{ yr }}
              </option>
            </select>
          </div>

          <div v-show="isFetching" class="spinner-border text-info window-centered" role="status">
            <span class="sr-only">Loading...</span>
          </div>
          <div v-show="!isFetching">
            <div v-show="show === 'Dashboard'">
              <timeline />
              <h4 class="text-center" v-if="years.length === 0">{{ translations[$store.state.language].dashboard.userHaventEvaluations }}</h4>
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
              <h4 class="text-center" v-if="years.length === 0">{{ translations[$store.state.language].dashboard.userHaventEvaluations }}</h4>
              <evaluation-viewer v-if="resources.length" :course="resources[showEvaluation]" />
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
                v-on:click="() => { showEvaluation = index }"
              >
                <div>
                  <p>
                    <i class="bi bi-calendar-check-fill"></i> {{ resource.name }}
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
                  style="width: 95%;"
                  v-model="currentTech"
                  :getOptionLabel="el => el.name"
                >
                </vue-select>
                <i
                  class="fas fa-plus-circle"
                  style="font-size: 1.5rem; cursor: pointer;"
                  :style="currentTech && currentTech.name ? '' : 'pointer-events: none; color: #d3d3d3;'"
                  v-on:click="addSkill()"
                />
              </div>
              <h2 style="display: flex; gap: 1rem; margin-top: 2rem;">
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
            <div v-show="show === 'leadTree'">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios';
  import Vue from 'vue';
  import vueSelect from 'vue-select';
  import { API, APP_NAME } from '../../env';
  import UserService from '../services/user.service';
  import { verifyToken } from '../services/helpers';
  import Spinner from '../components/Spinner.vue';
  import Timeline from '../components/Timeline.vue';
  import Graphic from '../components/graphicEvaluation.vue';
  import EvaluationViewer from '../components/evaluationsViewer.vue';
  import Rombo from '../components/rombo.vue';
  import translations from '../data/translate';
  import TechnologiesService from '../services/technologies.service';

  export default {
    name: 'Dashboard',
    components: { Spinner, Timeline, Graphic, EvaluationViewer, Rombo, vueSelect },
    data() {
      return {
        title: 'Dashboard',
        courses: [],
        isLoading: true,
        isFetching: false,
        isSync: false,
        searchQuery: null,
        error: '',
        success: '',
        resources: [],
        show: 'Dashboard',
        abas: [
          { name: 'Dashboard', class: 'bi bi-clipboard-data', hasIcon: true },
          {
            name: 'Evaluations',
            class: 'bi bi-calendar-check-fill',
            hasIcon: true,
          },
          { name: 'technologies', class: 'fas fa-code', hasIcon: true },
          { name: 'leadTree', class: 'fas fa-sitemap', hasIcon: true },
        ],
        showEvaluation: 0,
        year: null,
        years: [],
        userStack: [],
        technologies: [],
        currentTech: {},
        translations: translations
      };
    },
    watch: {
      '$store.state.language': function(newVal, oldVal) {
        this.success = this.success
          ? translations[this.$store.state.language].dashboard.messageSyncStatus
          : translations[this.$store.state.language].dashboard.messageNotSync;
      },
    },
    methods: {
      syncUsuario() {
        // Obtener los datos del lextracking
        const userLextracking = JSON.parse(
          localStorage.getItem(`_lextracking_user-${APP_NAME}`),
        );
        userLextracking.type = userLextracking.role;
        userLextracking.sync = !(userLextracking.cubeExist && userLextracking.cubeExist === true);

        this.isSync = true;
        UserService().upsertUser(userLextracking, (res) => {
          this.isSync = false;
          if (!res.error) {
            Vue.toasted.show(translations[this.$store.state.language].dashboard.messageSync, {
              type: 'success',
              duration: 2000,
            });

            this.error = '';
            this.success = translations[this.$store.state.language].dashboard.messageSyncStatus;
            // const id = localStorage.getItem(`id-${APP_NAME}`);

            // Obtenemos evaluaciones de un usuario
            // this.obtenerEvaluaciones(id)
            window.location.reload();
          } else {
            this.error = res.error;

            Vue.toasted.show(translations[this.$store.state.language].dashboard.messageNotSync, {
              type: 'error',
              duration: 2000,
            });
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
          'user-id': userId,
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
              Vue.toasted.show(translations[this.$store.state.language].dashboard.evaluationNotFound, {
                type: 'error',
                duration: 2000,
              });
            }
          });
      },
      formatDate(date) {
        // Format SQL to UY date
        const newDate = date.split('T');
        // 0 index correspond to raw date after split
        let uyDate = newDate[0].split('-');
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
      getYears: async function(id) {
        const token = localStorage.getItem(`token-app-${APP_NAME}`);
        const userId = localStorage.getItem(`id-${APP_NAME}`);

        const headers = {
          token,
          'user-id': userId,
        };

        const {data} = await axios.get(`${API}courses/years/${id}`, { headers });
        if(!data.err) {
          this.years = data;
          this.year = data[data.length - 1];
          this.obtenerEvaluaciones(id, this.year);
        } else {
          console.log('ENTER')
          Vue.toasted.show(translations[this.$store.state.language].dashboard.userHaventEvaluations, {
            type: 'info',
            duration: 2000,
          });
        }
      },
      addSkill() {
        const idUser = JSON.parse(localStorage.getItem(`_lextracking_user-${APP_NAME}`)).id;
        const exists = this.userStack.some(el => el.name === this.currentTech.name);
        if (!exists) {
          this.userStack.push(this.currentTech);
          TechnologiesService.asignNew(idUser, this.currentTech.id);
          this.currentTech = {};
        } else {
          Vue.toasted.show(translations[this.$store.state.language].dashboard.alreadyExists, {
            type: 'info',
            duration: 2000,
          });
          this.currentTech = {};
        };
      },
      removeSkill(skill) {
        const idUser = JSON.parse(localStorage.getItem(`_lextracking_user-${APP_NAME}`)).id;
        this.userStack = this.userStack.filter(el => el !== skill);
        TechnologiesService.remove(idUser, skill.id);
      },
    },
    mounted() {
      const id = localStorage.getItem(`id-${APP_NAME}`);
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);
      const idCube = JSON.parse(localStorage.getItem(`_lextracking_user-${APP_NAME}`)).id;

      // Verifico el token
      verifyToken(token);

      const headers = {
        token,
        'user-id': userId,
      };

      if (id) {
        axios.get(`${API}users/${id}`, { headers }).then((res) => {
          this.isLoading = false;

          if (!res.data.error) {
            // let courses  = res.data.response;
            // this.courses = courses;
            this.success = translations[this.$store.state.language].dashboard.messageSyncStatus;

            // Obtenemos evaluaciones de un usuario
            this.getYears(id);
            this.obtenerEvaluaciones(id, this.year);
            TechnologiesService.getByUser(idCube).then(resp => this.userStack = Object.values(resp)[0] || []);
          } else {
            // Si no obtengo el usuario en la base, deberíamos cargarnos
            this.error = translations[this.$store.state.language].dashboard.messageNotSyncStatus;
          }

          TechnologiesService.getAll().then(res => this.technologies = res.response);
        });
      }
    },
    computed: {
      resultQuery() {
        if (this.searchQuery) {
          return this.resources.filter((item) => this.searchQuery
            .toLowerCase()
            .split(' ')
            .every((v) => item.name.toLowerCase().includes(v)));
        }
        return this.resources;
      },
    },
  };
</script>

<style scoped>
  .left-select{
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

</style>
