<template>
  <div>
    <h4 class="courseTitle is-bold has-import-btn">
      <div>
        <span>{{ $t("AdminCareerType.title") }}</span>
        <spinner v-if="isLoading"></spinner>
      </div>
      <button class="btn btn-primary" disabled="disabled">
        {{ $t('generic.import') }} CSV
      </button>
    </h4>

    <div class="row" style="gap: 1rem; margin: 1rem auto 3rem;">
      <input type="text" v-model="newCareerType.name" :placeholder="$t('AdminCareerType.placeholder')"
        class="form-control col-8 is-rounded" />
      <button type="button" class="btn btn-primary col-1" v-on:click="isEditing ? updateCareerType() : saveCareerType()"
        :disabled="!newCareerType.name">
        {{ isEditing ? $t("generic.edit") : $t("generic.save") }}
      </button>
      <button type="button" v-if="isEditing" class="btn btn-secondary col-1" v-on:click="onCancel()">
        {{ $t("generic.cancel") }}
      </button>
    </div>

    <div class="courseContainer">
      <table class="table">
        <thead class="is-bold">
          <tr>
            <th v-for="(header, i) in $t('AdminCareerType.tableHeaders')" :key="`head${i}`">
              {{ header }}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in careersType" :key="`tech${i}`">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td style="display: flex; gap: 1rem;">
              <button class="btn btn-success col-4" data-toggle="modal" v-on:click="setEditing(item)">
                {{ $t("generic.edit") }}
              </button>
              <button class="btn btn-secondary col-4" data-toggle="modal" v-on:click="deletename(item.id)">
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
import CareerType from '../../services/careerType.service'

const DEFAULT_VALUE = {
  id: 0,
  name: '',
};

export default {
  name: "CareerType",
  components: { Spinner },
  data() {
    return {
      isEditing: false,
      isLoading: false,
      error: '',
      names: [],
      newCareerType: { ...DEFAULT_VALUE },
      careersType: [],
      token: localStorage.getItem(`token-app-${APP_NAME}`),
    };
  },

  mounted() {
    this.loadCareerType();
  },

  methods: {
    async saveCareerType() {
      const response = await CareerType().newCareerType(this.newCareerType.name);
      const id = this.careersType[(this.careersType.lenght - 1)].id + 1;

      if (response.message != 'ok' || response.status != 200) {
        return;
      }

      this.newCareerType.id = id;
      return careersType.push(this.newCareerType);
    },

    updateCareerType() {

    },

    async loadCareerType() {
      const response = await CareerType().getAll();
      
      if(response.status != 200){
        return;
      }
      console.log(response);
    }
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