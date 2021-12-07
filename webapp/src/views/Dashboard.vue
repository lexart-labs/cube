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
          {{ aba.name }}
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
                Sync del usuario
              </button>
            </div>
          </div>
          <div class="alert alert-success" role="alert" v-if="success">
            <div>
              <p>{{ success }}</p>
            </div>
          </div>
          <div v-show="show === 'Dashboard'">
            <timeline />
            <graphic v-if="resources.length" :evaluations="resources" />
          </div>
          <!-- General -->
          <div class="dashboard--resources" v-show="show === 'Evaluaciones'">
            <evaluation-viewer v-if="resources.length" :course="resources[showEvaluation]" />
            <input
              type="search"
              placeholder="Buscar evaluaciones"
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Vue from 'vue';
import { API, APP_NAME } from '../../env';
import UserService from '../services/user.service';
import { verifyToken } from '../services/helpers';
import Spinner from '../components/Spinner.vue';
import Timeline from '../components/Timeline.vue';
import Graphic from '../components/graphicEvaluation.vue';
import EvaluationViewer from '../components/evaluationsViewer.vue';

export default {
  name: 'Dashboard',
  components: { Spinner, Timeline, Graphic, EvaluationViewer },
  data() {
    return {
      title: 'Dashboard',
      courses: [],
      isLoading: true,
      isSync: false,
      searchQuery: null,
      error: '',
      success: '',
      resources: [],
      show: 'Dashboard',
      abas: [
        { name: 'Dashboard', class: 'bi bi-clipboard-data', hasIcon: true },
        {
          name: 'Evaluaciones',
          class: 'bi bi-calendar-check-fill',
          hasIcon: true,
        },
      ],
      showEvaluation: 0,
    };
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
          Vue.toasted.show('Usuario sincronizado correctamente', {
            type: 'success',
            duration: 2000,
          });

          this.error = '';
          this.success = 'Usuario sincronizado 👏';
          // const id = localStorage.getItem(`id-${APP_NAME}`);

          // Obtenemos evaluaciones de un usuario
          // this.obtenerEvaluaciones(id)
          window.location.reload();
        } else {
          this.error = res.error;

          Vue.toasted.show('Error al sincronizar el usuario', {
            type: 'error',
            duration: 2000,
          });
        }
      });
    },
    obtenerEvaluaciones(id) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        'user-id': userId,
      };
      axios
        .get(`${API}courses/by-user/${id}`, { headers })
        .then((res) => {
          this.isLoading = false;
          if (!res.data.error) {
            const data = res.data.response;
            this.resources = data;
          } else {
            Vue.toasted.show('Error no se encontró evaluaciones', {
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
  },
  mounted() {
    const id = localStorage.getItem(`id-${APP_NAME}`);
    const token = localStorage.getItem(`token-app-${APP_NAME}`);
    const userId = localStorage.getItem(`id-${APP_NAME}`);

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
          this.success = 'Usuario sincronizado 👏';

          // Obtenemos evaluaciones de un usuario
          this.obtenerEvaluaciones(id);
        } else {
          // Si no obtengo el usuario en la base, deberíamos cargarnos
          this.error = '¡Tu usuario no está sincronizado!';
        }
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
