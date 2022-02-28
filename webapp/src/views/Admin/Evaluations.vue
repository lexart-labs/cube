<template>
  <div id="courses--component" class="admin-conteiner" style="margin-top: 1rem">
    <header class="header-table">
      <h4 class="is-bold">
        {{ $t('AdminEvaluations.title') }}
      </h4>
      <button
          type="button"
          class="btn btn-success"
          data-toggle="modal"
          data-target="#staticBackdrop"
          v-on:click="newCourse"
        >
          + {{$t('AdminEvaluations.evaluation')}}
        </button>
    </header>
    <div class="grp-icon-input">
      <input
        type="search"
        :placeholder="$t('AdminEvaluations.searchPlaceholder')"
        v-model="searchQuery"
        class="form-control is-rounded search"
        v-on:keydown.enter="getEvaluations"
      />
      <button
        v-on:click="getEvaluations"
        class="btn btn-primary btn-sm col-1"
        id="btn-search-eval"
      >
        <i class="fas fa-search" style="height: 1rem; width: 1rem;"></i>
      </button>
    </div>
    <div>
      <table class="table table-admin col-12">
        <thead class="is-bold">
          <tr>
            <th>Id</th>
            <th>{{$t('AdminEvaluations.columnName')}}</th>
            <th>Developer</th>
            <th>{{$t('AdminEvaluations.columnDate')}}</th>
            <th>{{$t('AdminEvaluations.columnEvaluation')}}</th>
            <th>{{$t('AdminEvaluations.columnActive')}}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(course, i) in courses" :key="`course${i}`">
            <td>{{ course.id }}</td>
            <td>{{ course.name }}</td>
            <td>{{ course.user.name }}</td>
            <td>{{ course.fecha }}</td>
            <td>
              <b>{{ course.total }}%</b>
            </td>
            <td>{{ course.active === 1 ? $t('generic.yes') : $t('generic.no') }}</td>
            <td>
              <button
                class="btn btn-primary col-12"
                v-on:click="getCourseById(course.id)"
                data-toggle="modal"
                data-target="#staticBackdrop"
              >
                {{$t('generic.edit')}}
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
        <div class="modal-dialog modal-xl modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="courseTitle is-bold" id="staticBackdropLabel">
                {{$t('AdminEvaluations.evaluation')}} {{ course.id ? "#" + course.id : "" }}
              </h4>
              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
                @click="cancelEvaluation"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <!-- General -->
            <div class="modal-body" v-if="tabs.general">
              <div class="coursesTab" style="margin-bottom: 1rem;">
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
                      >{{ $t(`generic.${tab.name}`) }}</a
                    >
                  </li>
                </ul>
              </div>
              <div class="row" style="margin-bottom: 2rem;">
                <div class="col-md-3 col-sm-12">
                  <input
                    type="text"
                    placeholder="Descripción"
                    class="form-control is-rounded"
                    v-model="course.name"
                  />
                </div>
                <div class="col-md-3 col-sm-12">
                  <input
                    type="datetime-local"
                    :placeholder="$t('generic.date')"
                    class="form-control is-rounded"
                    v-model="course.fecha"
                  />
                </div>
                <div class="col-md-3 col-sm-12">
                  <vue-select
                    v-model="course.user"
                    label="name"
                    :options="users"
                  ></vue-select>
                </div>
                <div class="col-md-3 col-sm-12">
                  <select class="form-control is-rounded" v-model="course.active">
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>
              <div class="row">
                <div class="col-12">
                  <label for="" class="obs--title">{{$t('generic.observations')}}</label>
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
            <div class="modal-body" v-if="tabs.clases && course.indicadores">
              <div class="row" style="margin-top: 1rem">
                <!-- Tabla de clases -->
                <div class="col-12">
                  <table class="table">
                    <thead>
                      <tr>
                        <th><b>{{ $t('generic.topic')}}</b></th>
                        <th><b>{{ $t('generic.score')}}</b></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody style="zoom: 0.85">
                      <tr
                        v-for="(item, key) in course.indicadores['desempeño']"
                        :key="key"
                      >
                        <td>{{ $t('AdminEvaluations.performanceArray')[key] }}</td>
                        <td>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            class="form-control"
                            v-model="item.total"
                          />
                        </td>
                        <td class="is-big-text">
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
                        <th>{{ $t('generic.topic')}}</th>
                        <th>{{ $t('generic.score')}}</th>
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
                        <td>{{ $t('AdminEvaluations.HumanFactorArray')[key] }}</td>
                        <td>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            class="form-control"
                            v-model="item.total"
                          />
                        </td>
                        <td class="is-big-text">
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
                        <th>{{ $t('generic.topic')}}</th>
                        <th>{{ $t('generic.score')}}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody style="zoom: 0.85">
                      <tr
                        v-for="(item, key) in course.indicadores['habilidades']"
                        :key="key"
                      >
                        <td>{{ $t('AdminEvaluations.skillsArray')[key] }}</td>
                        <td>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            class="form-control"
                            v-model="item.total"
                          />
                        </td>
                        <td class="is-big-text">
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
                class="btn btn-secondary col-1"
                data-dismiss="modal"
                @click="cancelEvaluation"
              >
                {{$t('generic.cancel')}}
              </button>
              <button
                type="button"
                class="btn btn-primary col-1"
                v-on:click="upsertCourse"
                :disabled="isLoading"
              >
                {{ isLoading? 'Loading...' : $t('generic.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>

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
                class="btn btn-primary col-1"
                v-on:click="confiraPagoClase()"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="window-centered">
      <Spinner v-if="isFeching || isLoading" />
    </div>
  </div>
</template>

<script>
import Spinner from '../../components/Spinner.vue';
import vueSelect from "vue-select";
import { verifyToken, copy } from '../../services/helpers';
import CourseService from '../../services/course.service';
import UserService from '../../services/user.service';
import UtilsServices from '../../services/utils.service';
import { APP_NAME } from '../../../env';

export default {
  name: 'EvaluationsAdmin',
  components: { Spinner, vueSelect },
  data() {
    return {
      title: 'Evaluations management',
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
        indicadores: UtilsServices.indicatorsCopy(),
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
        { name: 'performance', tab: 'clases' },
        { name: 'humanFactor', tab: 'pagos' },
        { name: 'skills', tab: 'evaluaciones' },
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
      pagesLength: 1,
      page: 1,
      isFeching: false,
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
      this.activeTab('general')
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
      this.isFeching = true;
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
          this.course = {
            indicadores: UtilsServices.indicatorsCopy(),
            ...res.response
          };

          if (!this.course.resources) {
            this.course.resources = [];
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
        } else {
          this.course = {};
          this.$toasted.show('Error when trying to get the evaluation', {
            type: 'error',
            duration: 2000,
          });
          $('#staticBackdrop').modal('hide');
        }

        this.isFeching = false;
      });
    },
    upsertCourse() {
      this.isLoading = true;
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

      CourseService().upsertCourse(this.course, async (res) => {
        this.isLoading = false;
        if (res.response) {
          $('#staticBackdrop').modal('hide');
          // Disparo el toast
          this.$toasted.show(res.response, {
            type: 'success',
            duration: 2000,
          });

          // Get all courses again
          let pageToGet = null;

          if (this.course.indicadores) pageToGet = this.page - 1;
          else {
            const { data: totalOfPages } = await CourseService().getPagesLength();
            this.pagesLength = totalOfPages.response;
            pageToGet = this.pagesLength - 1;
          }
          
          this.paginate(pageToGet);

        } else {
          this.$toasted.show('Error when trying to create / edit a evaluation', {
            type: 'error',
            duration: 2000,
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
    navigate(operator) {
      if (typeof operator === 'number') {
        this.page = operator;
      } else {
        operator === '+' ? this.page += 1 : this.page -= 1;
      }

      this.paginate(this.page - 1);
    },
    paginate: async function (page = 0, isCreatingNewEvaluation = false) {
      this.isLoading = true;
      this.courses = [];
      this.page = page + 1;
      const { data: res } = await CourseService().getAllCourses(page, this.searchQuery);

      if (!res.error) {
        const courses = res.response;
        this.courses = courses;
      } else {
        this.$toasted.show('Error when trying to get the evaluations, refresh your screen to try again', {
          type: 'error',
          duration: 5000,
        });
        this.error = res.error;
      }

      // const { data: resp } = await CourseService().getPagesLength();
      this.isLoading = false;

      // if (!resp.error) {
      //   this.pagesLength = resp.response;
      // } else {
      //   this.error = resp.error;
      // }
      // this.course = {};
    },
    cancelEvaluation: function () {
      this.course = {}
    },
    getEvaluations: async function () {
      this.isLoading = true;
      this.courses = [];

      const { data: pageLength} = await CourseService().getPagesLength(this.searchQuery);
      const { data: res } = await CourseService().getAllCourses(0, this.searchQuery);
      if (!res.error) {
        this.courses = res.response;
        this.pagesLength = pageLength.response;
        this.page = 1;
      } else {
        this.$toasted.show('Error when trying to get the evaluations, refresh your screen to try again', {
          type: 'error',
          duration: 3000,
        });
        this.error = res.error;
      }

      this.isLoading = false;
    },
  },
  async mounted() {
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


    this.isLoading = true;
    this.paginate();
    const { data: totalOfPages } = await CourseService().getPagesLength();
    this.pagesLength = !totalOfPages.error ? totalOfPages.response : '';

    UserService().getAllUsers(null, (res) => {
      this.isLoading = false;
      if (!res.error) {
        const users = res.response;
        this.users = users;
      } else {
        this.error = res.error;
      }
    });
  },
  computed: { },
};
</script>

<style scoped>
@media (min-width: 320px) and (max-width: 1000px) {
  .firstInput{
    margin-top: 1em;
  }
  .modal-body .col-sm-12{
    margin-bottom: 1em;
  }
  .courseContainer {
  padding: 1rem 0;
  }
}

.grp-icon-input {
  position: relative;
  margin-bottom: 2rem;
  width: 60%
}

#btn-search-eval {
  border-radius: 1rem;
  position: absolute;
  /* top: -70px;
  right: -620px; */
 top: 0.2rem;
  right: 0.2rem;
}
</style>