<template>
  <ExplorerTable
    translations="AdminPayments"
    :tableKeys="['id', 'name', 'salary', 'currency', 'billing', 'datePromotion', 'updatedAt']"
    modalId="#upsert-salary"
    :tableData="formatedSalaries"
    :onNew="clearStates"
    :onEdit="getSalaryById"
    :pager="handlePagination"
    :pagesCount="pageCount"
    :actualPage="actualPage"
  >
    <template slot="filters">
      <div class="filters-ctl">
        <div>
          <label style="margin-bottom: 0"
            >{{ $t("generic.year") }}
            <input
              type="number"
              v-model="filters.year"
              max="9999"
              class="form-control is-rounded"
              style="height: 2.1rem"
            />
          </label>
        </div>
        <div>
          <label>{{ $t("generic.collaborators") }}</label>
          <vue-select
            v-model="filters.idUser"
            label="name"
            :options="colaborators"
            :reduce="(el) => el.id"
          ></vue-select>
        </div>
        <button
          class="btn btn-primary btn-sm col-1 is-rounded"
          @click="onSearch"
          style="height: 2.1rem"
        >
          <i class="fas fa-search"></i>
        </button>
      </div>
    </template>

    <template slot="upsert-modal">
      <div
        class="modal fade"
        id="upsert-salary"
        tabindex="-1"
        role="dialog"
        aria-labelledby="salariy-modal-title"
        aria-hidden="true"
      >
        <div
          class="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title is-bold" id="salariy-modal-title">
                {{ $t("AdminPayments.modalTitle") }}
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
                <div class="form-group">
                  <label>{{ $t("AdminPayments.colaborator") }}</label>
                  <vue-select
                    v-model="salary.idUser"
                    label="name"
                    :options="colaborators"
                    :reduce="(usr) => usr.id"
                  ></vue-select>
                </div>
                <div class="row">
                  <div class="form-group col">
                    <label>{{ $t("AdminPayments.currency") }}</label>
                    <vue-select
                      v-model="salary.currency"
                      :options="currencies"
                    ></vue-select>
                  </div>
                  <div class="form-group col">
                    <label>{{ $t("AdminPayments.billing") }}</label>
                    <vue-select
                      v-model="salary.billing"
                      :options="billings"
                    ></vue-select>
                  </div>
                  <div class="form-group col">
                    <label>{{ $t("AdminPayments.salary") }}</label>
                    <input
                      type="number"
                      step="0.01"
                      class="form-control is-rounded"
                      v-model="salary.salary"
                    />
                  </div>
                </div>
                <div class="row">
                  <div class="form-group col-4">
                    <label>{{ $t('AdminPayments.promotion')}}</label>
                    <input
                      type="datetime-local"
                      :placeholder="$t('generic.date')"
                      class="form-control is-rounded"
                      v-model="salary.datePromotion"
                    />
                  </div>
                </div>
                <div class="row col-12">
                  <small v-if="error">{{ error }}</small>
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
              <button
                type="button"
                class="btn btn-primary"
                @click="upsertSalary"
                :disabled="isLoading"
              >
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
import PaymentsService from "../../services/payments.service";
import Collaborators from "../../services/collaborators.service";
import ExplorerTable from "../../components/explorerTable.vue";
import vueSelect from "vue-select";
import translations from "../../data/translate";

const CURRENT_YEAR = new Date().getFullYear();

export default {
  name: "Payments",
  components: { ExplorerTable, vueSelect },
  data() {
    return {
      salaries: [],
      colaborators: [],
      billings: ['Hour', 'Monthy', 'Week', 'Day', 'Year'],
      currencies: ['R$','USD', '$U', '$', '£', '₽'],
      salary: {
        id: 0,
        salary: 0,
        billing: '',
        currency: '',
        datePromotion: '',
        dateCreated: '',
        dateUpdated: '',
        idUser: 0,
        name: '',
      },
      filters: {
        year: new Date().getFullYear(),
        idUser: 0,
      },
      isLoading: false,
      isEditing: false,
      pageCount: 1,
      companySlug: localStorage.getItem("_company-slug"),
      error: "",
      actualPage: 1,
    };
  },
  methods: {
    clearStates() {
      this.salary = {
        id: 0,
        salary: 0,
        billing: '',
        currency: '',
        datePromotion: '',
        dateCreated: '',
        dateUpdated: '',
        idUser: 0,
        name: '',
      };
      this.isEditing = false;
      this.error = "";
    },
    getPagesLength: async function () {
      const year = this.filters.year;
      const idUser = this.filters.idUser;

      return await PaymentsService.countPages(year, idUser);
    },
    getSalaryById: async function (id) {
      this.isEditing = true;
      const salary = await PaymentsService.getOne(id);
      this.salary = salary;
    },
    handlePagination: async function (page) {
      const { year, idUser } = this.filters;
      const salaries = await PaymentsService.getAll(year, page, idUser);

      this.salaries = salaries;
    },
    upsertSalary: async function () {
      this.isLoading = true;
      const year = CURRENT_YEAR;

      const isValid = this.validatePayload();
      if (isValid !== "true") {
        this.error = isValid;
        this.isLoading = false;
        return;
      }

      this.salary.datePromotion = new Date(this.salary.datePromotion).toISOString();

      if (this.isEditing) {
        await PaymentsService.update(this.salary.id, this.salary);
      } else {
        await PaymentsService.insert(this.salary);
        this.pageCount = await PaymentsService.countPages(year, 0);
        this.actualPage = 0;
      }

      $("#upsert-salary").modal("hide");
      this.clearStates();
      const salaries = await PaymentsService.getAll(year, 0, 0);
      this.filters = { year, idUser: 0 };
      this.salaries = salaries;

      this.isLoading = false;
    },
    onSearch: async function () {
      const pagesLength = await this.getPagesLength();
      this.pageCount = pagesLength;
      await this.handlePagination(0);
    },
    validatePayload() {
      const translate = translations[this.$store.state.language].AdminPayments.errorMsgs;
      const { salary, idUser, billing, datePromotion, currency } = this.salary;     

      if (!idUser) return translate.user;
      if (!currency) return translate.currency;
      if (!salary) return translate.salary;
      if (!billing) return translate.billing;
      if (!datePromotion) return translate.date;

      return "true";
    },
  },
  async mounted() {
    this.isLoading = true;

    const year = this.filters.year;
    const idUser = this.filters.idUser;

    const [pageCount, salaries, users] = await Promise.all([
      PaymentsService.countPages(year, idUser),
      PaymentsService.getAll(year, 0, idUser),
      Collaborators.getByCompany(),
    ]);

    this.pageCount = pageCount;
    this.salaries = salaries;
    this.colaborators = users.response;

    this.isLoading = false;
  },
  computed: {
    formatedSalaries() {
      return this.salaries.map(el => {
        const datePromotion = new Date(el.datePromotion).toLocaleString('pt-br');
        const createdAt = new Date(el.createdAt).toLocaleString('pt-br');
        const updatedAt = new Date(el.updatedAt).toLocaleString('pt-br');

        return { ...el, datePromotion, createdAt, updatedAt };
      });
    },
  },
};
</script>

<style scoped>
.filters-ctl {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  margin: 1rem auto 3rem;
  gap: 1rem;
}
.filters-ctl > div {
  width: 20%;
  min-width: 200px;
}
small {
  color: rgb(255, 117, 117);
  justify-self: flex-end;
  margin: 1rem;
  margin-right: 0;
}
.has-label-space {
  margin-bottom: 0.5rem;
}
</style>
