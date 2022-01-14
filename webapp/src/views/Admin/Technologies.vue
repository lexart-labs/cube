<template>
  <div>
    <div class="row" style="gap: 1rem; margin: 1rem auto 3rem;">
      <input
        type="text"
        v-model="newTechnologie.name"
        :placeholder="$t('AdminTechnologies.placeholder')"
        class="form-control col-8"
      />
      <select v-model="newTechnologie.plataform" class="form-control col-2">
        <option value="" disabled>Selecione</option>
        <option
          v-for="(plataform, i) in plataforms"
          :value="plataform"
          :key="`plat-${i}`"
        >
          {{ plataform }}
        </option>
      </select>
      <button type="button" class="btn btn-primary col-1">
        {{ $t("generic.save") }}
      </button>
    </div>

    <div class="courseContainer">
      <table class="table">
        <thead>
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
            <td style="display: flex; gap: 1rem;">
              <button class="btn btn-info" data-toggle="modal" v-on:click="setEditing(tech)">
                {{ $t("generic.edit") }}
              </button>
              <button class="btn btn-danger" data-toggle="modal">
                {{ $t("generic.remove") }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { API, APP_NAME } from "../../../env";

export default {
  name: "Technologies",
  data() {
    return {
      isEditing: false,
      isLoading: false,
      technologies: [],
      newTechnologie: {
        name: "",
        plataform: "",
      },
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
    updateTech: async (id) => {},
    deleteTech: async () => {},
    addTech: async () => {},
    setEditing(tech) {
      this.isEditing = true;
      this.newTechnologie = tech;
    },
  },
  mounted: async function () {
    this.getTechs();
  },
};
</script>
