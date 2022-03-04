<template>
  <ExplorerTable
    v-if="!isLoading"
    translations="AdminCollaborators"
    :tableKeys="['id', 'name', 'email', 'type', 'plataform', 'active']"
    modalId="#upsertModal"
    :tableData="collaborators"
    :onNew="clearStates"
    :onEdit="getCollaboratorById"
    :pager="handlePagination"
    :pagesCount="pageCount"
  >
    <template slot="filters">
      <input
        type="search"
        :placeholder="$t(`${translations}.searchPlaceholder`)"
        v-model="searchQuery"
        class="form-control is-rounded search"
      />
    </template>
    <template slot="upsert-modal">
      <div
        class="modal fade"
        id="upsertModal"
        tabindex="-1"
        role="dialog"
        aria-labelledby="upsertModal"
        aria-hidden="true"
      >
        <div
          class="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title is-bold" id="upsertModal">
                {{ $t("AdminCollaborators.modalTitle") }}
              </h5>
              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <form>
                <div class="row">

                  <div class="col-12">
                    <label>{{ $t("generic.name") }}</label>
                    <input type="text" class="form-control is-rounded" v-model="collaborator.name">
                  </div>

                  <div class="col-12 mt-0 mt-md-2">
                    <label>email</label>
                    <input type="email" class="form-control is-rounded email" v-model="collaborator.email">
                  </div>

                  <div class="col-12 mt-0 mt-md-2">
                    <label>{{ $t("generic.password") }}</label>
                    <input type="text" class="form-control is-rounded" v-model="collaborator.password">
                  </div>

                  <div class="col-12 col-md-6 mt-0 mt-md-2">
                    <label>{{ $t("generic.userType") }}</label>
                    <vue-select
                      v-model="collaborator.type"
                      :options="['admin', 'developer']"
                    ></vue-select>
                  </div>

                  <div class="col-12 col-md-6 mt-0 mt-md-2">
                    <label>{{ $t("AdminUsers.hired") }}</label>
                    <vue-select
                      v-model="collaborator.idPlataform"
                      :options="platforms"
                      label="plataform"
                      :reduce="plat => plat.id"
                    ></vue-select>
                  </div>

                  <div class="col-12 mt-0 mt-md-2">
                    <label>{{ $t("AdminUsers.columnActive") }}</label>
                    <vue-select
                      v-model="collaborator.name"
                      :options="['Active', 'Inactive']"
                    ></vue-select>
                  </div>

                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-dismiss="modal"
                @click="clearStates"
              >
                {{ $t("generic.close") }}
              </button>
              <button type="button" class="btn btn-primary" @click="upsertCollaborator">
                {{ $t("generic.save") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ExplorerTable>
</template>

<script>
import Vue from 'vue'
import HoursService from "../../services/hours.service";
import DevOriginsService from "../../services/plataforms.service";
import CollaboratorsService from "../../services/collaborators.service";
import ExplorerTable from "../../components/explorerTable.vue";
import { APP_NAME } from "../../../env";
import vueSelect from "vue-select";
import Translations from "../../data/translate";

export default {
  name: "Continuity",
  components: { ExplorerTable, vueSelect },
  data() {
    return {
      collaborator: {
        name: "",
        email: "",
        password: "",
        type: "",
        idPlataform: null,
        active: null,
      },
      collaborators: [],
      isLoading: false,
      isEditing: false,
      pageCount: 1,
      idCompany: 1,
      platforms: []
    };
  },
  async mounted() {
    this.isLoading = true;
    const idLead = JSON.parse(localStorage.getItem(`id-${APP_NAME}`));

    const [users, platforms] = await Promise.all([
      CollaboratorsService.getByCompany(),
      DevOriginsService.getAll()
    ]);

    this.pageCount = 0;
    this.collaborators = users;
    this.platforms = platforms

    this.isLoading = false;
  },
  methods: {
    clearStates() {
      this.report = {
        year: 2022,
        month: "",
        idColaborator: 0,
        name: "",
        continuity: "0:00",
      };
      this.isEditing = false;
    },
    getCollaboratorById: async function (id) {
      const collaborator = await CollaboratorsService.getByIdUser(id);
      if(collaborator.length > 0) this.collaborator = collaborator[0];
      else {
        Vue.toasted.show(
          Translations[this.$store.state.language].dashboard.errorGettingInfos,
          { type: "info", duration: 2000 }
        );
      }
      
      this.isEditing = true;
    },
    handlePagination: async function(page) {
    },
    upsertCollaborator: async function() {
      let res = {};
      if(Object.values(this.collaborator).some(val => !val))
      this.isLoading = true;
      console.log(this.collaborator.id, this.collaborator, this.isEditing)

      if(this.isEditing) res = await CollaboratorsService.editUser(this.collaborator.id, this.collaborator)
      else res = await CollaboratorsService.createUser(this.collaborator)

      if(res.status === 200) {
        Vue.toasted.show(
          Translations[this.$store.state.language].AdminCollaborators.successToAdd,
          { type: "success", duration: 2000 }
        );
      } else if(res.status === 400) {
        Vue.toasted.show(
          Translations[this.$store.state.language].AdminCollaborators.errorToAdd,
          { type: "error", duration: 2000 }
        );
      }

      $("#upsertModal").modal("hide");

      this.isLoading = false;
    },
  },
};
</script>