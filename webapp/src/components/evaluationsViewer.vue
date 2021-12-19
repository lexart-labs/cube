<template>
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
            <li
              class="nav-item"
              :key="`tab${i}`"
              v-for="(tab, i) in tabItems"
              v-show="course.id != 0"
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
                        disabled
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
                    v-for="(item, key) in course.indicadores['factorHumano']"
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
                        disabled
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
                        disabled
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
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EvaluationViewer',
  data() {
    return {
      tabItems: [
        { name: 'Desempeño', tab: 'clases' },
        { name: 'Factor Humano', tab: 'pagos' },
        { name: 'Habilidades', tab: 'evaluaciones' },
      ],
      tabs: {
        clases: true,
        evaluaciones: false,
        pagos: false
      },
      MAX_POINTS: 5,
    };
  },
  props: ['course'],
  methods: {
    activeTab(tab) {
      // Set all to false
      Object.keys(this.tabs)
        .forEach((key) => { this.$set(this.tabs, key, false); });
      this.$set(this.tabs, tab, true);
    },
  }
};
</script>
