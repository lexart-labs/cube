<template>
  <div>
    <h4 class="courseTitle is-bold has-import-btn">
      <div>
        <span>{{ $t("AdminPositions.title") }}</span>
        <spinner v-if="isLoading"></spinner>
      </div>
      <button class="btn btn-primary" disabled="disabled">
        {{ $t('generic.import') }} CSV
      </button>
    </h4>

    <div class="row" id="inputTech">
      <input type="text" v-model="newPosition.name" :placeholder="$t('AdminPositions.placeholder')"
        class="form-control col-6 is-rounded" />
      <select v-model="newPosition.careerType" class="form-control col-2 is-rounded">
        <option value="" disabled>Selecione</option>
        <option v-for="(careerType, i) in careerTypes" :value="careerType" :key="`plat-${i}`">
          {{ careerType.careerName }}
        </option>
      </select>
      <button type="button" class="btn btn-primary col-1" v-on:click="isEditing ? putPosition() : addPosition()"
        :disabled="!newPosition.name || !newPosition.careerType">
        {{ isEditing ? $t("generic.edit") : $t("generic.save") }}
      </button>
      <button type="button" v-if="isEditing" class="btn btn-secondary col-1" v-on:click="onCancelEdit()">
        {{ $t("generic.cancel") }}
      </button>
    </div>

    <div class="courseContainer">
      <table class="table col-12">
        <thead class="is-bold">
          <tr>
            <th v-for="(header, i) in $t('AdminPositions.tableHeaders')" :key="`head${i}`">
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(position, i) in positions" :key="`tech${i}`">
            <td>{{ position.id }}</td>
            <td>{{ position.position }}</td>
            <td>{{ position.plataform }}</td>
            <td style="display: flex; gap: 1rem;justify-content: center;">
              <button class="btn btn-success" data-toggle="modal" v-on:click="setEditing(position)">
                {{ $t("generic.edit") }}
              </button>
              <button class="btn btn-secondary" data-toggle="modal" v-on:click="delPosition(position.id)">
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

//Services
import Career from "../../services/career.service";
import CareerType from "../../services/careerType.service";
import Utils from "../../services/utils.service";

const DEFAULT_VALUE = {
  id: 0,
  name: "",
  careerType: '',
};

export default {
  name: "Positions",
  components: { Spinner },
  data() {
    return {
      isEditing: false,
      isLoading: false,
      error: '',
      positions: [],
      newPosition: { ...DEFAULT_VALUE },
      careerTypes: [],
      token: localStorage.getItem(`token-app-${APP_NAME}`),
    };
  },
  methods: {
    addPosition: function () {
      this.newPosition.name = this.newPosition.name.trim();

      let body = {
        position: this.newPosition.name,
        active: 1,
        roadmap: null,
        idCompany: null,
        idCareerType: this.newPosition.careerType.id
      }

      const promise = new Promise((resolve, reject) => {
        Utils.getIdCompanyBySlug().then((result) => {
          resolve(result.data.companyId);
        });
      });

      promise.then((id) => {
        body.idCompany = id;

        Career().new(body).then((result) => {
          const id = this.positions.length + 1;
          body.id = id;
          body.careerType = { ...this.careerTypes.filter((item) => item.id == body.idCareerType.id)[0] };

          this.positions.push(body);
          console.log(body, this.positions);
        }).catch((err) => {
          console.log(err);
        });
      })
    },

    putPosition: function (id) {
      this.newPosition.name = this.newPosition.name.trim();

      let body = {
        id: this.newPosition.id,
        position: this.newPosition.name,
        active: 1,
        roadmap: null,
        idCompany: null,
        idCareerType: this.newPosition.careerType.id
      }

      const promise = new Promise((resolve, reject) => {
        Utils.getIdCompanyBySlug().then((result) => {
          resolve(result.data.companyId);
        });
      });

      promise.then((id) => {
        body.idCompany = id;

        Career().put(body.id, body).then((result) => {

          this.positions = this.positions.map((position) => {
            if (position.id === body.id) {
              position = body;
            }

            return position;
          });

          this.onCancelEdit();
        }).catch((err) => {

        });
      })
    },

    delPosition: function (id) {
      Career().del(id).then((result) => {
        this.positions = this.positions.filter((position) => position.id != id);
      }).catch((err) => {
        
      });
    },

    setEditing: function (position) {
      this.isEditing = true;
      this.newPosition.id = position.id;
      this.newPosition.name = position.position;
      this.newPosition.careerType = { ...this.careerTypes.filter((item) => item.id == position.idCareerType)[0] };
    },

    onCancelEdit: function () {
      this.newPosition = { ...DEFAULT_VALUE };
      this.isEditing = false;
    },

    getCareersType: function () {
      CareerType().getByIdCompany().then((result) => {
        this.careerTypes = result.response;
      }).catch((err) => {

      });
    },

    getCareers: function () {
      Career().getAll().then((result) => {
        this.positions = result.response;
      }).catch((err) => {

      });
    }
  },
  mounted: function () {
    this.getCareersType();
    this.getCareers();
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

#inputTech {
  gap: 1rem;
  margin: 1rem auto 3rem;
}

button.btn.btn-success,
button.btn.btn-secondary {
  min-width: 18%;
}
</style>