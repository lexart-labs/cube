<template>
  <div>
    <h4 class="courseTitle is-bold has-import-btn">
      <div>
        <span>{{ $t("AdminTechnologies.title") }}</span>
        <spinner v-if="isLoading"></spinner>
      </div>
    </h4>

    <div class="row" id="inputTech">
      <input
        type="text"
        v-model="newTechnology.name"
        :placeholder="$t('AdminTechnologies.placeholder')"
        class="form-control col-6 is-rounded"
      />
      <select v-model="newTechnology.plataform" class="form-control col-2 is-rounded">
        <option value="" disabled>Selecione</option>
        <option
          v-for="(plataform, i) in plataforms"
          :value="plataform"
          :key="`plat-${i}`"
        >
          {{ plataform }}
        </option>
      </select>
      <button
        type="button"
        class="btn btn-success col-1"
        v-on:click="isEditing ? updateTech() : addTech()"
        :disabled="!newTechnology.name"
      >
        {{ isEditing ? $t("generic.edit") : $t("generic.save") }}
      </button>
      <button
        type="button"
        v-if="isEditing"
        class="btn btn-secondary col-1"
        v-on:click="onCancel()"
      >
        {{ $t("generic.cancel") }}
      </button>
    </div>

    <div class="courseContainer">
      <table class="table col-12">
        <thead class="is-bold">
          <tr>
            <th
              v-for="(header, i) in $t('AdminTechnologies.tableHeaders')"
              :key="`head${i}`"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tech, i) in technologies" :key="`tech${i}`">
            <td>{{ tech.id }}</td>
            <td>{{ tech.name }}</td>
            <td>{{ tech.plataform }}</td>
            <td style="display: flex; gap: 1rem;justify-content: center;">
              <button class="btn btn-primary" data-toggle="modal" v-on:click="setEditing(tech)">
                {{ $t("generic.edit") }}
              </button>
              <button class="btn btn-secondary" data-toggle="modal" v-on:click="deleteTech(tech)">
                {{ $t("generic.remove") }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isLoading" class="loading-cover">
      <Spinner />
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Vue from "vue";
import Spinner from "../../components/Spinner.vue";
import { API, APP_NAME } from "../../../env";
import translations from '../../data/translate';

const DEFAULT_VALUE = {
  id: 0,
  name: "",
  plataform: 'Web',
};

export default {
  name: "Technologies",
  components: { Spinner },
  data() {
    return {
      isEditing: false,
      isLoading: false,
      error: '',
      technologies: [],
      newTechnology: { ...DEFAULT_VALUE},
      plataforms: ["Web", "Mobile", "Desktop"],
      token: localStorage.getItem(`token-app-${APP_NAME}`),
    };
  },
  methods: {
    getTechs: async function (id) {
      this.isLoading = true;
      const endpoint = id ? `${API}technologies/${id}` : `${API}technologies`;

      const { data: { response } } = await axios.get(endpoint, { headers: { token: this.token }});

      this.technologies = response;
      this.isLoading = false;
    },
    updateTech: async function() {
      this.isLoading = true;
      this.isEditing = false;
      const { id } = this.newTechnology;
      const endpoint = `${API}technologies/${id}`;

      const { data } = await axios.put(endpoint, {...this.newTechnology}, { headers: { token: this.token }});
      
      if(data.response) {
        await this.getTechs();
        this.newTechnology = {...DEFAULT_VALUE};
        Vue.toasted.show(translations[this.$store.state.language].AdminTechnologies.success, {
            type: "success",
            duration: 2000,
        });
      } else {
        this.isLoading = false;
        this.error = data.error;
        Vue.toasted.show(translations[this.$store.state.language].AdminTechnologies.error, {
            type: "error",
            duration: 2000,
        });
      }
    },
    deleteTech: async function(tech) {
      this.isLoading = true;
      const { id } = tech;
      const endpoint = `${API}technologies/${id}`;

      const { data } = await axios.delete(endpoint, { headers: { token: this.token }});
      
      if(data.response) {
        await this.getTechs();
        Vue.toasted.show(translations[this.$store.state.language].AdminTechnologies.success, {
            type: "success",
            duration: 2000,
        });
      } else {
        this.isLoading = false;

        this.error = data.error;
        Vue.toasted.show(translations[this.$store.state.language].AdminTechnologies.error, {
            type: "error",
            duration: 2000,
        });
      }
    },
    addTech: async function() {
      this.isLoading = true;
      const endpoint = `${API}technologies/`;

      const { data } = await axios.post(endpoint, {...this.newTechnology}, { headers: { token: this.token }});
      
      if(data.response) {
        this.newTechnology = {...DEFAULT_VALUE};
        await this.getTechs();
        Vue.toasted.show(translations[this.$store.state.language].AdminTechnologies.success, {
            type: "success",
            duration: 2000,
        });
      } else {
        this.isLoading = false;
        Vue.toasted.show(translations[this.$store.state.language].AdminTechnologies.error, {
            type: "error",
            duration: 2000,
        });
      }
    },
    setEditing(tech) {
      this.isEditing = true;
      this.newTechnology = {...tech};
    },
    onCancel() {
      this.isEditing = false;
      this.isLoading = false;
      this.newTechnology = { ...DEFAULT_VALUE};
    },
  },
  mounted: async function () {
    this.getTechs();
  },
};
</script>

<style scoped>
  .courseContainer {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 50vh;
    overflow-y: scroll;
    box-shadow: rgba(0, 0, 0, 0.109) 0px 2px 4px 0px inset;
  }

  h4 {
    margin-top: 1rem;
    margin-bottom: 2rem;
  }

  #inputTech{
    gap: 1rem;
    margin: 1rem auto 3rem;
  }

  button.btn.btn-success,
  button.btn.btn-secondary {
    min-width: 18%;
  }
</style>