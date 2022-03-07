<template>
  <ExplorerTable
    v-if="!isLoading"
    translations="AdminCollaborators"
    :tableKeys="['id', 'name', 'email', 'type', 'plataform', 'active']"
    modalId="#upsert-collaborator"
    :tableData="collaborators"
    :onNew="clearStates"
    :onEdit="getCollaboratorById"
    :pager="handlePagination"
    :pagesCount="totalOfPages"
    :actualPage="actualPage"
  >
    <template slot="filters">
      <div class="grp-icon-input">
        <input
          type="search"
          :placeholder="$t('AdminUsers.searchPlaceholder')"
          v-model="searchQuery"
          class="form-control is-rounded search"
          @keydown.enter="getAllCollaboratorsByCompanyAndName"
        />
        <button
          class="btn btn-primary btn-sm col-1 btn-search-eval"
          @click="getAllCollaboratorsByCompanyAndName"
        >
          <i class="fas fa-search"></i>
        </button>
      </div>
    </template>
    <template slot="upsert-modal">
      <div
        class="modal fade"
        id="upsert-collaborator"
        tabindex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
        data-backdrop="static"
      >
        <div
          class="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title is-bold" id="exampleModalLabel">
                {{ $t("AdminCollaborators.modalTitle") }}
              </h5>
              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
                @click="clearStates"
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
                    <input :type="isEditing ? 'password' : 'text'" class="form-control is-rounded" v-model="collaborator.password">
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
                      v-model="collaborator.active"
                      label="text"
                      :options="[{ value: 1, text: 'Active'}, { value: 0, text: 'Inactive'}]"
                      :reduce="status => status.value"
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
  name: "Collaborators",
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
      totalOfPages: null,
      actualPage: 0,
      idCompany: 1,
      platforms: [],
      searchQuery: ""
    };
  },
  async mounted() {
    this.isLoading = true;

    this.getDevOrigins();
    this.getAllCollaboratorsByCompany();
    this.getQuantityOfPages();
    this.isLoading = false;
  },
  methods: {
    getQuantityOfPages: async function () {
      const quantityOfPages = await CollaboratorsService.getQuantityOfPages(this.searchQuery);

      if(quantityOfPages.status === 200) {
        this.totalOfPages = quantityOfPages.response[0].totalOfPages;
      } else {
        Vue.toasted.show(
          'Error getting total of pages, try again',
          { type: "info", duration: 2000 }
        );
      }
    },

    getDevOrigins: async function () {
      const platforms = await DevOriginsService.getAll();

      if(platforms.length > 0) {
        this.platforms = platforms;
      } else {
        Vue.toasted.show(
          Translations[this.$store.state.language].dashboard.errorGettingInfos,
          { type: "info", duration: 2000 }
        );
      }
    },

    getAllCollaboratorsByCompany: async function () {
      const users = await CollaboratorsService.getByCompany(this.actualPage, this.searchQuery);

      if(users.status === 200) {
        this.collaborators = users.response;
      } else {
        Vue.toasted.show(
          Translations[this.$store.state.language].dashboard.errorGettingInfos,
          { type: "info", duration: 2000 }
        );
      }
    },

    getAllCollaboratorsByCompanyAndName: async function () {
      this.actualPage = 0;
      await this.getQuantityOfPages();
      this.getAllCollaboratorsByCompany();
    },

    getCollaboratorById: async function (id) {
      this.clearStates()

      const collaborator = await CollaboratorsService.getByIdUser(id);

      if(collaborator.status === 200) this.collaborator = collaborator.response[0];
      else {
        Vue.toasted.show(
          Translations[this.$store.state.language].dashboard.errorGettingInfos,
          { type: "info", duration: 2000 }
        );
      }
      
      this.isEditing = true;
    },

    upsertCollaborator: async function() {
      this.collaborators = [];
      let res, type, message;

      // this.checkIfIsAll

      $("#upsert-collaborator").modal("hide");

      if(this.isEditing) res = await CollaboratorsService.editUser(this.collaborator.id, this.collaborator)
      else res = await CollaboratorsService.createUser(this.collaborator);

      if(res.status == 200) {
        type = 'success',
        message = 'successToAdd';
        if(!this.isEditing) {
          await this.getQuantityOfPages()
          this.actualPage = this.totalOfPages - 1;
        }
      } else if(res.status == 400) {
        type = 'error',
        message = 'errorToAdd';
      } else if(res.status == 500) {
        type = 'error';
        message = res.message;
      }

      Vue.toasted.show(
        res.status == 500 ? message : Translations[this.$store.state.language].AdminCollaborators[message],
        { type: type, duration: 2000 }
      );

      await this.getAllCollaboratorsByCompany();
    },

    clearStates: function () {
      this.collaborator = {
        name: "",
        email: "",
        password: "",
        type: "",
        idPlataform: null,
        active: null,
      },

      this.isEditing = false;
    },

    handlePagination: async function(page) {
      this.actualPage = page;
      this.getAllCollaboratorsByCompany()
    },
  },
};
</script>