<template>
  <div id="courses--component">
    <div class="container">
      <h4 class="courseTitle">
        <i class="bi bi-bookmarks-fill"></i> {{ title }} / {{ curso }}
        <spinner v-if="isLoading"></spinner>
      </h4>
      <div class="myCoursesTab">
        <button
          class="btn btn-primary"
          v-bind:class="{ active: tabs.general }"
          v-on:click="activeTab('general')"
        >
          <i class="bi bi-code-square"></i> Recursos
        </button>
        <button
          class="btn btn-primary"
          v-bind:class="{ active: tabs.clases }"
          v-on:click="activeTab('clases')"
        >
          <i class="bi bi-easel"></i> Mis Clases
        </button>
        <button
          class="btn btn-primary"
          v-bind:class="{ active: tabs.pagos }"
          v-on:click="activeTab('pagos')"
        >
          <i class="bi bi-cash-coin"></i> Mis Pagos
        </button>
        <button
          class="btn btn-primary"
          v-bind:class="{ active: tabs.evaluaciones }"
          v-on:click="activeTab('evaluaciones')"
        >
          <i class="bi bi-file-earmark-check"></i> Mis Evaluaciones
        </button>
      </div>

      <div v-if="!error">
        <!-- General -->
        <input
          type="search"
          placeholder="Buscar recursos"
          v-model="searchQuery"
          v-if="tabs.general"
          class="form-control"
          style="margin-bottom: 1rem"
        />
        <div class="courseContainer" v-if="!isLoading">
          <div
            :key="`resource${index}`"
            v-bind:class="types[resource.type].color"
            class="alert"
            role="alert"
            v-if="tabs.general"
            v-for="(resource, index) in resultQuery"
          >
            <div>
              <p>
                <i class="bi" v-bind:class="types[resource.type].icon"></i>
                {{ resource.name }}
              </p>
              <p class="smallText">{{ resource.description }}</p>
            </div>
            <div class="text-right">
              <a v-bind:href="resource.link" target="_new">{{
                types[resource.type].text
              }}</a>
            </div>
          </div>
          <!-- Mis clases -->
          <div
            :key="`clase${index}`"
            class="alert alert-primary"
            v-bind:class="{ disabledClase: !clase.enableClase }"
            role="alert"
            v-if="tabs.clases"
            v-for="(clase, index) in clases"
          >
            <div>
              <p>{{ clase.topico }}</p>
              <p class="smallText">
                <i class="bi bi-person-check-fill"></i> {{ clase.docente }}
              </p>
              <p class="smallText">
                <i class="bi bi-calendar-check-fill"></i> {{ clase.fecha }}
              </p>
            </div>
            <div class="text-right">
              <a v-if="clase.enableClase" v-bind:href="clase.meet" target="_new"
                >Ir a la meet</a
              >
            </div>
          </div>

          <!-- Mis pagos -->
          <div
            :key="`pagos${index}`"
            class="alert alert-info"
            v-bind:class="{ disabledClase: pago.userPay }"
            role="alert"
            v-if="tabs.pagos"
            v-for="(pago, index) in pagos"
          >
            <div>
              <p>{{ pago.concepto }}</p>
              <p class="smallText">{{ pago.informacion }}</p>
              <p class="smallText"><b>MONTO: </b>${{ pago.monto }}</p>
              <p class="smallText"><b>VENCIMIENTO:</b> {{ pago.fecha }}</p>
            </div>
            <div class="text-right" v-if="pago.userPay === false">
              <a v-bind:href="pago.link" v-if="pago.link" target="_new"
                >Pagar</a
              >
              <a v-if="!pago.link">Coordinar pago por email y/o whatsapp</a>
            </div>
            <div class="text-right" v-if="pago.userPay === true">
              <p>PAGO <i class="bi bi-check-circle-fill"></i></p>
            </div>
          </div>

          <!-- Mis Evaluaciones -->
          <div
            :key="`evaluation${index}`"
            class="alert alert-info"
            role="alert"
            v-if="tabs.evaluaciones && evaluacion.userEvaluado === true"
            v-for="(evaluacion, index) in evaluaciones"
          >
            <div>
              <p>Evaluación del curso</p>
              <p class="smallText">{{ evaluacion.observacion }}</p>
              <p class="smallText">
                <i class="bi bi-person-check-fill"></i> {{ evaluacion.docente }}
              </p>
              <p class="smallText">
                <i class="bi bi-calendar-check-fill"></i> {{ evaluacion.fecha }}
              </p>
            </div>
            <div class="text-right">
              <p>
                PUNTAJE {{ evaluacion.puntaje }}
                <i class="bi bi-check-circle-fill"></i>
              </p>
            </div>
          </div>
        </div>
        <div class="alert alert-danger" role="alert" v-if="error">
          <div>
            <p>{{ error }}</p>
          </div>
          <div class="text-right"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-param-reassign */
import axios from 'axios';
import { API, APP_NAME } from '../../env';
import { verifyToken } from '../services/helpers';

export default {
  name: 'Evaluations',
  data() {
    return {
      title: 'Curso',
      resources: [],
      clases: [],
      pagos: [],
      evaluaciones: [],
      error: '',
      isLoading: true,
      searchQuery: null,
      curso: null,
      types: {
        video: {
          text: 'Ver video',
          color: 'alert-primary',
          icon: 'bi-play-btn-fill',
        },
        material: {
          text: 'Ver material',
          color: 'alert-secondary',
          icon: 'bi-file-earmark-text-fill',
        },
      },
      tabs: {
        general: true,
        clases: false,
        pagos: false,
      },
    };
  },
  methods: {
    activeTab(tab) {
      // Set all to false
      Object.keys(this.tabs)
        .forEach((key) => { this.$set(this.tabs, key, false); });
      this.$set(this.tabs, tab, true);
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
  },
  mounted() {
    const id = this.$route.params.id ? this.$route.params.id : undefined;
    this.curso = this.$route.params.curso
      ? decodeURIComponent(this.$route.params.curso)
      : undefined;
    const token = localStorage.getItem(`token-app-${APP_NAME}`);
    const userId = localStorage.getItem(`id-${APP_NAME}`);
    // Corro la fecha de hoy a la timezone del alumno
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    const today = new Date(Date.now() - tzoffset).toISOString().slice(0, -1);

    // Verifico el token
    verifyToken(token);

    const headers = {
      token,
      'user-id': userId,
    };

    if (id) {
      axios.get(`${API}resources/by-course/${id}`, { headers }).then((res) => {
        this.isLoading = false;
        if (!res.data.error) {
          const data = res.data.response;
          this.resources = data.resources;
          this.clases = data.clases;
          this.pagos = data.pagos;
          this.evaluaciones = data.evaluaciones;

          this.clases.map((clase) => {
            // eslint-disable-next-line no-param-reassign
            clase.enableClase = false;

            // Check if date is the same as today
            const claseDate = clase.fecha.split('T')[0];
            if (today.includes(claseDate)) {
              clase.enableClase = true;
            }

            // Convert SQL date to UY date
            clase.fecha = this.formatDate(clase.fecha);
          });

          this.pagos.map((pago) => {
            // Convert SQL date to UY date
            pago.fecha = this.formatDate(pago.fecha);
            pago.userPay = false;

            // Revisar al usuario
            pago.users.map((user) => {
              if (user.id === userId && user.pagar === true) {
                pago.userPay = true;
              }
            });
          });

          this.evaluaciones.map((evaluacion) => {
            // Convert SQL date to UY date
            evaluacion.fecha = this.formatDate(evaluacion.fecha);
            if (evaluacion.userId === userId) {
              evaluacion.userEvaluado = true;
            }
          });
        } else {
          this.error = res.data.error;
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

<style>
@media (min-width: 320px) and (max-width: 1000px) {
input.search{
  margin-bottom: 1rem;
  width: 100%;
}
.coursesTab {
  padding: 0;
}
.perfil form label{
  padding-bottom: 1rem;
}
.modal-footer {
  border-top: 0 none;
}
}
</style>