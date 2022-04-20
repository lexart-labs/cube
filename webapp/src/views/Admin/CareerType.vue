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
      <button type="button" v-if="isEditing" class="btn btn-secondary col-1" v-on:click="cancelEditing()">
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
          <tr v-for="(item, i) in careersType" :key="i">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td style="display: flex; gap: 1rem;">
              <button class="btn btn-success col-4" data-toggle="modal" v-on:click="setEditMode(item)">
                {{ $t("generic.edit") }}
              </button>
              <button class="btn btn-secondary col-4" data-toggle="modal" data-target="#staticBackdrop" v-on:click="selectCareer = item">
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

    <div class="modal fade" id="staticBackdrop" data-backdrop="static" data-keyboard="false" tabindex="-1"
      aria-labelledby="staticBackdropLabel" aria-hidden="true">
      <div class="modal-dialog modal-l modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="courseTitle is-bold" id="staticBackdropLabel">
              {{ selectCareer.name }}
            </h4>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            {{ $t("AdminCareerType.confirmRemove") }}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary col-2" data-dismiss="modal">
              {{ $t("generic.close") }}
            </button>
            <button type="button" class="btn btn-primary col-2" data-dismiss="modal" v-on:click="removeCareer(selectCareer.id)">
              {{ $t("generic.remove") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import Spinner from "../../components/Spinner.vue";
import { APP_NAME } from "../../../env";
import translations from '../../data/translate';
import CareerType from '../../services/careerType.service'
import { copy } from "@amcharts/amcharts4/.internal/core/utils/Array";

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
      selectCareer: {},
      lastId: 0,
    };
  },

  mounted() {
    this.loadCareerType();
  },

  methods: {
    async saveCareerType() {
      const response = await CareerType().newCareerType(this.newCareerType.name);

      if (response.status != 200) {
        console.log(response.message);
        return;
      }

      this.lastId = this.lastId + 1;

      this.newCareerType.id = this.lastId;
      this.careersType.push(this.newCareerType);

      return this.newCareerType = {...this.DEFAULT_VALUE};
    },

    async updateCareerType() {
      const career = { ...this.newCareerType };

      const response = await CareerType().putCareer(career.name, career.id);

      if (response.status != 200) {
        console.log(response.message);
        return;
      }

      this.newCareerType = { ...this.DEFAULT_VALUE }
      this.isEditing = false;

      return this.careersType = this.careersType.map((item) => item.id == career.id ? career : item);
    },

    async loadCareerType() {
      const response = await CareerType().getAll();

      if (response.status != 200) {
        console.log(response.message);
        return;
      }

      this.lastId = response.response[response.response.length - 1].id;

      return this.careersType = response.response.map((career) => {
        career.name = career.careerName;
        
        delete career.careerName;
        delete career.idCompany;

        return career;
      });
    },

    setEditMode(item) {
      const career = { ...item };

      career.name = career.careerName ? career.careerName : career.name;
      delete career.careerName;
      delete career.idCompany;

      this.isEditing = true;
      return this.newCareerType = career;
    },

    cancelEditing() {
      this.newCareerType = { ...DEFAULT_VALUE };
      return this.isEditing = false;
    },

    async removeCareer(id) {
      const response = await CareerType().removeCareer(id);

      if (response.status != 200) {
        console.log(response.message);
        return;
      }

      this.selectCareer = { ...this.DEFAULT_VALUE };
      return this.careersType = this.careersType.filter((career) => career.id != id);
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