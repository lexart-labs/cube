<template>
  <div id="courses--component" style="margin-top: 1rem">
    <h4 class="courseTitle">
      {{ title }}
      <spinner v-if="isLoading"></spinner>
      <button
        type="button"
        style="float: right; margin-bottom: 1rem"
        class="btn btn-secondary"
        data-toggle="modal"
        data-target="#staticBackdrop"
        v-on:click="newCourse"
      >
        + Evaluación
      </button>
    </h4>
    <input
      type="search"
      placeholder="Buscar evaluaciones"
      v-model="searchQuery"
      class="form-control"
      style="margin-bottom: 1rem"
    />
    <div class="courseContainer" v-if="!isLoading">
      <table class="table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Nombre</th>
            <th>Developer</th>
            <th>Fecha</th>
            <th>Evaluación</th>
            <th>Activo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(course, i) in resultQuery" :key="`course${i}`">
            <td>{{ course.id }}</td>
            <td>{{ course.name }}</td>
            <td>{{ course.user.name }}</td>
            <td>{{ course.fecha }}</td>
            <td>
              <b>{{ course.total }}%</b>
            </td>
            <td>{{ course.active == 1 ? "SI" : "NO" }}</td>
            <td>
              <button
                class="btn btn-info"
                v-on:click="getCourseById(course.id)"
                data-toggle="modal"
                data-target="#staticBackdrop"
              >
                Editar
              </button>

              <button class="btn btn-danger" disabled style="opacity: 0.3">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- course / Modal -->
      <div
        class="modal fade"
        id="staticBackdrop"
        data-backdrop="static"
        data-keyboard="false"
        tabindex="-1"
        aria-labelledby="staticBackdropLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="courseTitle" id="staticBackdropLabel">
                Evaluación {{ course.id ? "#" + course.id : "" }}
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
            <!-- Tabs -->
            <div class="coursesTab">
              <ul class="nav nav-tabs">
                <li class="nav-item">
                  <a
                    class="nav-link"
                    v-bind:class="{ active: tabs.general }"
                    v-on:click="activeTab('general')"
                    >General</a
                  >
                </li>
                <li
                  class="nav-item"
                  :key="`tab${i}`"
                  v-for="(tab, i) in tabItems"
                  v-if="course.id != 0"
                >
                  <a
                    class="nav-link"
                    v-bind:class="{ active: tabs[tab.tab] }"
                    v-on:click="activeTab(tab.tab)"
                    >{{ tab.name }}</a
                  >
                </li>
              </ul>
            </div>
            <!-- General -->
            <div class="modal-body" v-if="tabs.general">
              <div class="row">
                <div class="col-3">
                  <input
                    type="text"
                    placeholder="Descripción"
                    class="form-control"
                    v-model="course.name"
                  />
                </div>
                <div class="col-3">
                  <input
                    type="datetime-local"
                    placeholder="Fecha"
                    class="form-control"
                    v-model="course.fecha"
                  />
                </div>
                <div class="col-3">
                  <v-select
                    v-model="course.user"
                    label="name"
                    :options="users"
                  ></v-select>
                </div>
                <div class="col-3">
                  <select class="form-control" v-model="course.active">
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>
              </div>
              <div class="row">
                <div class="col-12">
                  <label for="" class="obs--title">Observaciones</label>
                  <textarea
                    name=""
                    id=""
                    cols="30"
                    rows="5"
                    class="form-control"
                    v-model="course.observaciones"
                  ></textarea>
                </div>
              </div>
            </div>

            <div
              v-if="error"
              class="alert alert-danger"
              style="margin-top: 1rem"
            >
              {{ error }}
            </div>

            <!-- Clases -->
            <div class="modal-body" v-if="tabs.clases">
              <div class="row" style="margin-top: 1rem">
                <!-- Tabla de clases -->
                <div class="col-12">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Tópico</th>
                        <th>Puntaje</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody style="zoom: 0.85">
                      <tr
                        v-for="(item, key) in course.indicadores['desempeño']"
                        :key="key"
                      >
                        <td>{{ item.name }}</td>
                        <td>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            class="form-control"
                            v-model="item.total"
                          />
                        </td>
                        <td>
                          <b>{{ item.total }}/{{ MAX_POINTS }}</b>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <!-- Pagos -->
            <div class="modal-body" v-if="tabs.pagos">
              <div class="row" style="margin-top: 1rem">
                <!-- Tabla de clases -->
                <div class="col-12">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Tópico</th>
                        <th>Puntaje</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody style="zoom: 0.85">
                      <tr
                        v-for="(item, key) in course.indicadores[
                          'factorHumano'
                        ]"
                        :key="key"
                      >
                        <td>{{ item.name }}</td>
                        <td>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            class="form-control"
                            v-model="item.total"
                          />
                        </td>
                        <td>
                          <b>{{ item.total }}/{{ MAX_POINTS }}</b>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Evaluaciones -->
            <div class="modal-body" v-if="tabs.evaluaciones">
              <div class="row" style="margin-top: 1rem">
                <!-- Tabla de clases -->
                <div class="col-12">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Tópico</th>
                        <th>Puntaje</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody style="zoom: 0.85">
                      <tr
                        v-for="(item, key) in course.indicadores['habilidades']"
                        :key="key"
                      >
                        <td>{{ item.name }}</td>
                        <td>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            class="form-control"
                            v-model="item.total"
                          />
                        </td>
                        <td>
                          <b>{{ item.total }}/{{ MAX_POINTS }}</b>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
                v-on:click="upsertCourse"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- User / Asitencias -->
      <div
        class="modal fade"
        id="asistenciasBackdrop"
        data-backdrop="static"
        data-keyboard="false"
        tabindex="0"
        aria-labelledby="asistenciasBackdrop"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="courseTitle" id="staticBackdropLabel">
                {{ claseAsiste.topico }}
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
            <div class="modal-body" v-if="claseIsSelected">
              <table class="table">
                <thead>
                  <tr>
                    <th>Alumnos</th>
                    <th>Asiste</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, key) in course.clases[claseSelected].users"
                    :key="`classe${key}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>
                      <input type="checkbox" v-model="item.asiste" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-success"
                v-on:click="confiraAsisteClase()"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- User / Pagos -->
      <div
        class="modal fade"
        id="pagosBackdrop"
        data-backdrop="static"
        data-keyboard="false"
        tabindex="0"
        aria-labelledby="pagosBackdrop"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="courseTitle" id="staticBackdropLabel">
                {{ pagoAsiste.concepto }}
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
            <div class="modal-body" v-if="pagoIsSelected">
              <table class="table">
                <thead>
                  <tr>
                    <th>Alumnos</th>
                    <th>Cobrar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, key) in course.pagos[pagoSelected].users"
                    :key="`${key}`"
                  >
                    <td>{{ item.name }}</td>
                    <td>
                      <input type="checkbox" v-model="item.pagar" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-success"
                v-on:click="confiraPagoClase()"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import axios from 'axios';
import Spinner from '../../components/Spinner.vue';
import { verifyToken, copy } from '../../services/helpers';
import CourseService from '../../services/course.service';
import UserService from '../../services/user.service';
import { APP_NAME } from '../../../env';

export default {
  name: 'EvaluationsAdmin',
  components: { Spinner },
  data() {
    return {
      title: 'Administración de evaluaciones',
      courses: [],
      error: '',
      isLoading: true,
      searchQuery: null,
      resource: {
        active: 1,
        type: 'video',
        link: '',
      },
      course: {
        id: 0,
        fecha: '',
        indicadores: {},
      },
      evaluacion: {},
      pago: {},
      users: [],
      deletedResources: [],
      tabs: {
        general: true,
        clases: false,
        pagos: false,
        evaluaciones: false,
        examenes: false,
      },
      tabItems: [
        { name: 'Desempeño', tab: 'clases' },
        { name: 'Factor Humano', tab: 'pagos' },
        { name: 'Habilidades', tab: 'evaluaciones' },
      ],
      clase: {},
      claseAsiste: {},
      pagoAsiste: {},
      usersInCourse: [],
      claseSelected: 0,
      pagoSelected: 0,
      claseIsSelected: false,
      pagoIsSelected: false,
      toggleItem: {
        recursos: false,
        alumnos: false,
      },
      indicadores: {},
      MAX_EVALUACION: 135,
      MAX_POINTS: 5,
    };
  },
  methods: {
    newCourse() {
      this.course = {
        id: 0,
        active: 1,
        fecha: new Date().toISOString().slice(0, 19),
      };
      this.error = '';
      // console.log("evaluación :: ", this.course)
    },
    activeTab(tab) {
      // Set all to false
      Object.keys(this.tabs)
        .forEach((key) => { this.$set(this.tabs, key, false); });
      this.$set(this.tabs, tab, true);
    },
    asisteClase(item, key) {
      $('#asistenciasBackdrop').modal('show');

      const claseItem = copy(item);
      this.claseAsiste = claseItem;
      this.claseSelected = key;
      this.claseIsSelected = true;
    },
    asistePago(item, key) {
      $('#pagosBackdrop').modal('show');

      const pagoItem = copy(item);
      this.pagoAsiste = pagoItem;
      this.pagoSelected = key;
      this.pagoIsSelected = true;
    },
    confiraAsisteClase() {
      $('#asistenciasBackdrop').modal('hide');

      setTimeout(() => {
        this.claseIsSelected = false;
      }, 10);
    },
    confiraPagoClase() {
      $('#pagosBackdrop').modal('hide');

      setTimeout(() => {
        this.pagoIsSelected = false;
      }, 10);
    },
    getCourseById(id) {
      this.course = {
        clases: [],
        users: [],
        pagos: [],
      };
      this.tabs = {
        general: true,
        clases: false,
        pagos: false,
      };

      this.claseSelected = 0;
      this.pagoSelected = 0;

      this.users.map((user) => {
        user.inCourse = false;
      });

      CourseService().getCourseById(id, (res) => {
        if (!res.error) {
          this.course = res.response;
          if (!this.course.resources) {
            this.course.resources = [];
          }

          if (!this.course.indicadores) {
            this.course.indicadores = this.indicadores;
          }

          if (!this.course.pagos) {
            this.$set(this.course, 'pagos', []);
          }

          if (!this.course.evaluaciones) {
            this.$set(this.course, 'evaluaciones', []);
          }

          // Reviso que alumnos están en el curso
          if (this.course.users && this.course.users.length > 0) {
            this.course.users.map((item) => {
              this.users.map((user) => {
                if (user.id === item.idUser) {
                  user.inCourse = true;
                }
              });
            });
            // Map clases y add alumnos
            this.course.clases.map((clase) => {
              if (!clase.users) {
                clase.users = [];
                clase.users = copy(
                  this.users.filter((user) => user.inCourse === true),
                );
                clase.asistencias = 0;
              } else {
                let countAsistencias = 0;
                clase.users.map((item) => {
                  if (item.asiste === true) {
                    countAsistencias += 1;
                  }
                });
                clase.asistencias = countAsistencias;

                if (countAsistencias === 0) {
                  clase.users = copy(
                    this.users.filter((user) => user.inCourse === true),
                  );
                }
              }
            });

            this.course.pagos.map((pago) => {
              if (!pago.users) {
                pago.users = [];
                pago.users = copy(
                  this.users.filter((user) => user.inCourse === true),
                );
                pago.pagaron = 0;
              } else {
                let countAsistencias = 0;
                // Aux users
                const userArr = copy(
                  this.users.filter((user) => user.inCourse === true),
                );

                userArr.map((user, _i) => {
                  pago.users.map((item) => {
                    if (item.pagar === true && user.id === item.id) {
                      user.pagar = true;
                      countAsistencias += 1;
                    }
                  });
                });

                // Copio lo nuevo
                pago.users = copy(userArr);
                pago.pagaron = countAsistencias;

                if (countAsistencias === 0) {
                  pago.users = copy(
                    this.users.filter((user) => user.inCourse === true),
                  );
                }
              }
            });
          } else {
            this.course.users = [];
            this.users.map((user) => {
              user.inCourse = false;
            });
          }
        }
      });
    },
    upsertCourse() {
      // Verifico que los usuarios estén dentro del curso sino los agrego
      const activeUsers = [];

      this.users.map((item) => {
        if (item.inCourse === true) {
          const alumno = {
            idUser: item.id,
            idCourse: this.course.id,
            active: 1,
          };
          activeUsers.push(alumno);
        }
      });
      this.course.users = activeUsers;

      CourseService().upsertCourse(this.course, (res) => {
        if (res.response) {
          $('#staticBackdrop').modal('hide');
          // Disparo el toast
          this.$toast.show(res.response, {
            type: 'success',
            duration: 2000,
          });

          // Get all courses again
          CourseService().getAllCourses((resp) => {
            this.isLoading = false;
            if (!res.error) {
              const courses = resp.response;
              this.courses = courses;
            } else {
              this.error = resp.error;
            }
          });
        }
      });
    },
    removeHTTP(url, model, prop) {
      this.$set(
        this[model],
        prop,
        url.replace('http://', '').replace('https://', ''),
      );
    },
    addResource() {
      const { resource } = this;
      const protocol = 'https://';
      if (
        resource.link
        && (!resource.link.includes('http://')
          || !resource.link.includes('https://'))
      ) {
        resource.link = protocol + resource.link;
      }
      this.course.resources.push(resource);

      this.resource = {
        active: 1,
        type: 'video',
        link: '',
      };
    },
    deleteResource(item, key) {
      const deleted = {
        id: item.id ? item.id : null,
        idCourse: item.idCourse,
      };

      // Item no descartable
      if (deleted.id !== null) {
        this.deletedResources.push(deleted);
      }
      this.course.resources.splice(key, 1);
    },
    addClase() {
      const { clase } = this;
      const protocol = 'https://';
      if (
        clase.meet
        && (!clase.meet.includes('http://') || !clase.meet.includes('https://'))
      ) {
        clase.meet = protocol + clase.meet;
      }

      if (!this.course.clases) {
        this.course.clases = [];
      }
      this.course.clases.push(clase);

      this.clase = {};
    },
    addPago() {
      const { pago } = this;
      const protocol = 'https://';
      if (
        pago.link
        && (!pago.link.includes('http://') || !pago.link.includes('https://'))
      ) {
        pago.link = protocol + pago.link;
      }
      // pago.pagaron = 0

      if (!this.course.pagos) {
        this.course.pagos = [];
      }
      this.course.pagos.push(pago);

      this.pago = {};
    },
    addEvaluacion() {
      const { evaluacion } = this;

      if (!this.course.evaluaciones) {
        this.course.evaluaciones = [];
      }
      this.course.evaluaciones.push(evaluacion);

      this.evaluacion = {};
    },
    deleteClase(item, key) {
      this.course.clases.splice(key, 1);
      // console.log("this.course.clases: ", this.course.clases)
    },
    deletePago(item, key) {
      this.course.pagos.splice(key, 1);
      // console.log("this.course.pago: ", this.course.pagos)
    },
    deleteEvaluacion(item, key) {
      this.course.evaluaciones.splice(key, 1);
    },
  },
  mounted() {
    const id = this.$route.params.id ? this.$route.params.id : undefined;
    this.curso = this.$route.params.curso
      ? decodeURIComponent(this.$route.params.curso)
      : undefined;
    const token = localStorage.getItem(`token-app-${APP_NAME}`);
    const userId = localStorage.getItem(`id-${APP_NAME}`);

    const headers = {
      token,
      'user-id': userId,
    };

    // Verifico el token
    verifyToken(token);

    CourseService().getAllCourses((res) => {
      this.isLoading = false;
      if (!res.error) {
        const courses = res.response;
        this.courses = courses;
      } else {
        this.error = res.error;
      }
    });

    UserService().getAllUsers((res) => {
      this.isLoading = false;
      if (!res.error) {
        const users = res.response;
        this.users = users;
      } else {
        this.error = res.error;
      }
    });

    // Obtengo indicadores desde el JSON
    axios.get('src/data/indicadores.json').then((res) => {
      // console.log("cargo los indicadores: ", res)
      this.indicadores = res.data;
      this.course.indicadores = res.data;
    });
  },
  computed: {
    resultQuery() {
      if (this.searchQuery) {
        return this.courses.filter((item) => this.searchQuery
          .toLowerCase()
          .split(' ')
          .every((v) => item.name.toLowerCase().includes(v)));
      }
      return this.courses;
    },
  },
};
</script>
