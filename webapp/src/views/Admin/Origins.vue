<template>
  <div>
    <h4 class="courseTitle is-bold has-import-btn">
      <div>
        <span>{{ $t("AdminOrigins.title") }}</span>
        <spinner v-if="isLoading"></spinner>
      </div>
    </h4>

    <div class="row" style="gap: 1rem; margin: 1rem auto 3rem;">
      <input
        type="text"
        v-model="newPlataform.plataform"
        :placeholder="$t('AdminOrigins.placeholder')"
        class="form-control col-8 is-rounded"
      />
      <button
        type="button"
        class="btn btn-success col-1"
        v-on:click="isEditing ? updatePlataform() : addPlataform()"
        :disabled="!newPlataform.plataform"
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
      <table class="table">
        <thead class="is-bold">
          <tr>
            <th
              v-for="(header, i) in $t('AdminOrigins.tableHeaders')"
              :key="`head${i}`"
            >
              {{ header }}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in plataforms" :key="`tech${i}`">
            <td>{{ item.id }}</td>
            <td>{{ item.plataform }}</td>
            <td style="display: flex; gap: 1rem;">
              <button class="btn btn-primary col-4" data-toggle="modal" v-on:click="setEditing(item)">
                {{ $t("generic.edit") }}
              </button>
              <button class="btn btn-secondary col-4" data-toggle="modal" v-on:click="deletePlataform(item.id)">
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
import Vue from "vue";
import Spinner from "../../components/Spinner.vue";
import { APP_NAME } from "../../../env";
import translations from '../../data/translate';
import Plataforms from '../../services/plataforms.service';

const DEFAULT_VALUE = {
  id: 0,
  plataform: '',
};

export default {
  name: "Origin",
  components: { Spinner },
  data() {
    return {
      isEditing: false,
      isLoading: false,
      error: '',
      plataforms: [],
      newPlataform: { ...DEFAULT_VALUE},
      token: localStorage.getItem(`token-app-${APP_NAME}`),
    };
  },
  methods: {
    getPlataforms: async function () {
      this.isLoading = true;

      this.plataforms = await Plataforms.getAll();

      this.isLoading = false;
    },
    updatePlataform: async function() {
      this.isLoading = true;
      this.isEditing = false;
      const { id, plataform } = this.newPlataform;

      const data = await Plataforms.update(id, plataform);
      
      if(data.response) {
        await this.getPlataforms();
        this.newPlataform = {...DEFAULT_VALUE};
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
    deletePlataform: async function(id) {
      this.isLoading = true;

      const data = await Plataforms.remove(id);
      
      if(data.response) {
        await this.getPlataforms();
        Vue.toasted.show(translations[this.$store.state.language].AdminTechnologies.success, {
            type: "success",
            duration: 2000,
        });
      } else {
        this.isLoading = false;

        this.error = data.error;
        Vue.toasted.show(translations[this.$store.state.language].AdminOrigins.deleteError, {
            type: "error",
            duration: 3000,
        });
      }
    },
    addPlataform: async function() {
      this.isLoading = true;

      const data = await Plataforms.insert(this.newPlataform.plataform);
      
      if(data.response) {
        await this.getPlataforms();
        this.newPlataform = {...DEFAULT_VALUE};
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
    setEditing(plataform) {
      this.isEditing = true;
      this.newPlataform = {...plataform};
    },
    onCancel() {
      this.isEditing = false;
      this.isLoading = false;
      this.newPlataform = { ...DEFAULT_VALUE};
    },
  },
  mounted: async function () {
    this.getPlataforms();
  },
};
</script>

<style scoped>
  .courseContainer {
    display: flex;
    justify-content: center;
    height: 50vh;
    overflow-y: scroll;
    box-shadow: rgba(0, 0, 0, 0.109) 0px 2px 4px 0px inset;
    width: 100%;
  }

  h4 {
    margin-top: 1rem;
    margin-bottom: 2rem;
  }
</style>