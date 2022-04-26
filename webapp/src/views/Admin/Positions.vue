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
      <table class="table table-custom col-12">
        <thead class="is-bold">
          <tr>
            <th v-for="(header, i) in $t('AdminPositions.tableHeaders')" :key="`head${i}`">
              {{ header }}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(position, i) in positions" :key="`tech${i}`">
            <td>{{ position.id }}</td>
            <td>{{ position.position }}</td>
            <td>{{ position.company }}</td>
            <td>{{ position.careerType }}</td>
            <td>{{ position.roadmap }}</td>
            <td style="display: flex; gap: 1rem;justify-content: center;">
              <button class="btn btn-success" data-toggle="modal" v-on:click="setEditing(position)">
                {{ $t("generic.edit") }}
              </button>
              <button class="btn btn-secondary" data-toggle="modal" v-on:click="() => { positionSelected = position }"
                data-target="#staticBackdrop">
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
              {{ positionSelected.position }}
            </h4>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            {{ $t("AdminPositions.confirmRemove") }}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary col-2" data-dismiss="modal">
              {{ $t("generic.close") }}
            </button>
            <button type="button" class="btn btn-primary col-2" v-on:click="delPosition(positionSelected.id)"
              data-dismiss="modal">
              {{ $t("generic.remove") }}
            </button>
          </div>
        </div>
      </div>
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
      positionSelected: [],
    };
  },

  mounted: function () {
    this.getCareersType();
    this.getCareers();
  },

  methods: {
    addPosition: async function () {
      this.newPosition.name = this.newPosition.name.trim();

      const body = {
        position: this.newPosition.name,
        active: 1,
        roadmap: null,
        idCareerType: this.newPosition.careerType.id
      }

      const response = await Career().new(body);

      console.log(response);
      if (response.status !== 200) {
        if(response.message.includes("Duplicate")) {
          Vue.toasted.show( this.$t('AdminPositions.duplicateError'), { type: "info", duration: 4000 });

          return;
        }

        Vue.toasted.show( 'Internal error', { type: "error", duration: 4000 });

        return;
      }

      Vue.toasted.show(this.$t('AdminPositions.created'), { type: 'success', duration: 4000 })

      this.getCareers();
    },

    putPosition: async function (id) {
      this.newPosition.name = this.newPosition.name.trim();

      let body = {
        id: this.newPosition.id,
        position: this.newPosition.name,
        active: 1,
        roadmap: null,
        idCareerType: this.newPosition.careerType.id
      }

      const response = await Career().put(body.id, body);

      if (response.status !== 200) {

        if(response.message.includes("Duplicate")) {
          Vue.toasted.show( this.$t('AdminPositions.duplicateError'), { type: "info", duration: 4000 });

          return;
        }

        Vue.toasted.show( 'Internal error', { type: "error", duration: 4000 });
        return;
      }

      Vue.toasted.show(this.$t('AdminPositions.edited'), { type: 'success', duration: 4000 })
      
      this.getCareers();
    },

    delPosition: async function (id) {
      const response = await Career().del(id);

      if (response.status !== 200) {

        if(response.message.includes("delete or update a parent")) {
          Vue.toasted.show( this.$t('AdminPositions.positionIsUsed'), { type: "info", duration: 4000 });

          return;
        }

        Vue.toasted.show( 'Internal error', { type: "error", duration: 4000 });
        return;
      }

      Vue.toasted.show(this.$t('AdminPositions.deleted'), { type: 'success', duration: 4000 })

      this.positionSelected = [];
      return this.getCareers();
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

    getCareersType: async function () {
      const response = await CareerType().getByIdCompany();

      this.careerTypes = response.response;
    },

    getCareers: async function () {
      const response = await Career().getAll();;

      this.positions = response.response;
    }
  },
};
</script>

<style scoped>
.courseContainer {
  justify-content: center;
  width: 100%;
  height: 50vh;
  overflow-y: scroll;
  box-shadow: rgba(0, 0, 0, 0.109) 0px 2px 4px 0px inset;
}

.table-custom>tbody>tr>td {
  border-top: none !important;
  height: auto;
  border-bottom: 1px solid #dee2e6;
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