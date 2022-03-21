<template>
  <ExplorerTable
    translations="AdminContinuity"
    :tableKeys="['id', 'name', 'month', 'year', 'continuity']"
    modalId="#upsert-report"
    :tableData="ReportsWithLiteralMonths"
    :onNew="clearStates"
    :onEdit="getReportById"
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
          <label>{{ $t("generic.month") }}</label>
          <vue-select
            v-model="filters.month"
            label="name"
            :options="monthsFilter"
            :reduce="(el) => el.value"
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
        id="upsert-report"
        tabindex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div
          class="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title is-bold" id="exampleModalLabel">
                {{ $t("AdminContinuity.modalTitle") }}
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
                <div class="form-group">
                  <label>{{ $t("AdminContinuity.colaborator") }}</label>
                  <vue-select
                    v-model="report.idColaborator"
                    label="name"
                    :options="colaborators"
                    :reduce="(usr) => usr.id"
                  ></vue-select>
                </div>
                <div class="row">
                  <div class="col">
                    <label>{{ $t("generic.month") }}</label>
                    <vue-select
                      v-model="report.month"
                      label="name"
                      :options="
                        $t('generic.months').map((el, i) => ({
                          name: el,
                          value: i + 1,
                        }))
                      "
                      :reduce="(el) => el.value"
                    ></vue-select>
                  </div>
                  <div class="col">
                    <label class="has-label-space">{{
                      $t("generic.year")
                    }}</label>
                    <input
                      type="number"
                      v-model="report.year"
                      max="9999"
                      min="2000"
                      class="form-control is-rounded"
                    />
                  </div>
                </div>
                <div class="row" style="margin-top: 1rem">
                  <div class="col">
                    <label class="has-label-space">{{
                      $t("generic.hours")
                    }}</label>
                    <input
                      v-model="hours.hrs"
                      class="form-control is-rounded"
                      maxlength="3"
                    />
                  </div>
                  <div class="col">
                    <label class="has-label-space">{{
                      $t("generic.minutes")
                    }}</label>
                    <input
                      v-model="hours.min"
                      maxlength="2"
                      class="form-control is-rounded"
                    />
                  </div>
                  <div class="col">
                    <label>{{ $t("generic.seconds") }}</label>
                    <input
                      v-model="hours.sec"
                      maxlength="2"
                      class="form-control is-rounded"
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
                @click="upsertReport"
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
import HoursService from "../../services/hours.service";
import Collaborators from "../../services/collaborators.service";
import ExplorerTable from "../../components/explorerTable.vue";
import vueSelect from "vue-select";
import translations from "../../data/translate";

const CURRENT_YEAR = new Date().getFullYear();

export default {
  name: "Continuity",
  components: { ExplorerTable, vueSelect },
  data() {
    return {
      reports: [],
      colaborators: [],
      monthsFilter: [
        { name: "All", value: 0 },
        ...translations[this.$store.state.language].generic.months.map(
          (el, i) => ({
            name: el,
            value: i + 1,
          })
        ),
      ],
      report: {
        id: 0,
        year: 2022,
        month: "",
        idColaborator: 0,
        name: "",
        continuity: "",
      },
      filters: {
        year: new Date().getFullYear(),
        month: 0,
      },
      hours: {
        hrs: "00",
        min: "00",
        sec: "00",
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
      this.report = {
        year: 2022,
        month: "",
        idColaborator: 0,
        name: "",
        continuity: "",
      };
      this.hours = {
        hrs: "00",
        min: "00",
        sec: "00",
      };
      this.isEditing = false;
      this.error = "";
    },
    getPagesLength: async function () {
      const year = this.filters.year;
      const month = this.filters.month;

      return await HoursService.countPages(month, year);
    },
    getReportById: async function (id) {
      this.isEditing = true;
      const report = await HoursService.getOne(id);
      this.report = report;
      const splitedContinuity = this.report.continuity.split(':')
      this.hours = {
        hrs: splitedContinuity[0],
        min: splitedContinuity[1],
        sec: splitedContinuity[2]
      }
    },
    handlePagination: async function (page) {
      const reports = await HoursService.getAll(
        this.companySlug,
        this.filters.month,
        this.filters.year,
        page
      );

      this.reports = reports;
    },
    upsertReport: async function () {
      this.isLoading = true;
      const month = 0;
      const year = CURRENT_YEAR;

      const isValid = this.validatePayload();
      if (isValid !== "true") {
        this.error = isValid;
        this.isLoading = false;
        return;
      }

      if (this.isEditing) {
        await HoursService.update(this.report.id, this.report);
      } else {
        await HoursService.insert(this.report);
        this.pageCount = await HoursService.countPages(month, year);
        this.actualPage = 0;
      }

      $("#upsert-report").modal("hide");
      this.clearStates();
      const reports = await HoursService.getAll(
        this.companySlug,
        month,
        year,
        0
      );
      this.filters = { year, month };
      this.reports = reports;

      this.isLoading = false;
    },
    onSearch: async function () {
      const pagesLength = await this.getPagesLength();
      this.pageCount = pagesLength;
      await this.handlePagination(0);
    },
    validatePayload() {
      this.report.continuity = `${this.hours.hrs}:${this.hours.min}:${this.hours.sec}`;
      const translate = translations[this.$store.state.language].AdminContinuity.errorMsgs;
      const { month, idColaborator, year, continuity } = this.report;
      const [h, m, s] = continuity.split(":");
      const hasNonNumbers =  [h, m, s].some((el) => isNaN(Number(el)));      

      if (!idColaborator) return translate.user;
      if (!month) return translate.month;
      if (!year || year < 2000) return translate.year;
      if (
        !continuity ||
        hasNonNumbers ||
        m > 59 ||
        s > 59 ||
        continuity.length < 7 ||
        continuity == "00:00:00"
      )
        return translate.continuity;
      return "true";
    },
  },
  async mounted() {
    this.isLoading = true;

    const month = this.filters.month;
    const year = this.filters.year;

    const [pageCount, reports, users] = await Promise.all([
      HoursService.countPages(month, year),
      HoursService.getAll(this.companySlug, month, year, 0),
      Collaborators.getByCompany(),
    ]);

    this.pageCount = pageCount;
    this.reports = reports;
    this.colaborators = users.response;

    this.isLoading = false;
  },
  computed: {
    ReportsWithLiteralMonths() {
      return this.reports.map((el) => ({
        ...el,
        month:
          translations[this.$store.state.language].generic.months[el.month - 1],
      }));
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
