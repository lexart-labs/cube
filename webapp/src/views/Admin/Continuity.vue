<template>
  <ExplorerTable
    v-if="!isLoading"
    translations="AdminContinuity"
    :tableKeys="['id', 'name', 'month', 'year', 'continuity']"
    modalId="#upsert-report"
    :tableData="ReportsWithLiteralMonths"
    :onNew="clearStates"
    :onEdit="getReportById"
    :pager="handlePagination"
    :pagesCount="pageCount"
  >
    <template slot="filters">
      <div class="filters-ctl">
        <div>
          <label style="margin-bottom: 0;"
            >{{ $t("generic.year") }}
            <input
              type="number"
              v-model="filters.year"
              max="9999"
              class="form-control is-rounded"
              style="height: 2.1rem;"
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
          @click="handlePagination(0)"
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
                    <label
                      >{{ $t("generic.year") }}
                      <input
                        type="number"
                        v-model="report.year"
                        max="9999"
                        class="form-control is-rounded"
                      />
                    </label>
                  </div>
                  <div class="col">
                    <label
                      >{{ $t("generic.hours") }}
                      <input
                        type="tel"
                        v-mask="['##:##:##', '###:##:##']"
                        placeholder="00:00:00"
                        masked
                        v-model="report.continuity"
                        class="form-control is-rounded"
                      />
                    </label>
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
              <button
                type="button"
                class="btn btn-primary"
                data-dismiss="modal"
                @click="upsertReport"
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
import UserService from "../../services/user.service";
import ExplorerTable from "../../components/explorerTable.vue";
import { APP_NAME } from "../../../env";
import vueSelect from "vue-select";
import translations from "../../data/translate";

const User = UserService();
const PAGES_SIZE = 10;

export default {
  name: "Continuity",
  components: { ExplorerTable, vueSelect },
  data() {
    return {
      reports: [],
      colaborators: [],
      monthsFilter: [
        { name: 'All', value: 0 },
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
        continuity: "00:00:00",
      },
      filters: {
        year: new Date().getFullYear(),
        month: 0,
      },
      isLoading: false,
      isEditing: false,
      pageCount: 1,
      idCompany: 1,
    };
  },
  methods: {
    clearStates() {
      this.report = {
        year: 2022,
        month: "",
        idColaborator: 0,
        name: "",
        continuity: "00:00:00",
      };
      this.isEditing = false;
    },
    getReportById: async function (id) {
      this.isEditing = true;
      const report = await HoursService.getOne(id);
      this.report = report;
    },
    handlePagination: async function (page) {
      const reports = await HoursService.getAll(
        this.idCompany,
        this.filters.month,
        this.filters.year,
        page
      );

      this.reports = reports;
    },
    upsertReport: async function () {
      this.isLoading = true;
      const month = this.filters.month;
      const year = this.filters.year;

      if (this.isEditing) {
        await HoursService.update(this.report.id, this.report);
      } else {
        await HoursService.insert(this.report);
      }

      $("#upsert-report").modal("dispose");
      this.pageCount =
        this.pageCount === PAGES_SIZE ? this.pageCount + 1 : this.pageCount;
      this.clearStates();
      const reports = await HoursService.getAll(this.idCompany, month, year, 0);
      this.reports = reports;

      this.isLoading = false;
    },
  },
  async mounted() {
    this.isLoading = true;

    const month = this.filters.month;
    const year = this.filters.year;
    const idLead = JSON.parse(localStorage.getItem(`id-${APP_NAME}`));

    const [pageCount, reports, users] = await Promise.all([
      HoursService.countPages(),
      HoursService.getAll(this.idCompany, month, year, 0),
      User.getByCompany(idLead, this.idCompany),
    ]);

    this.pageCount = pageCount;
    this.reports = reports;
    this.colaborators = users;

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
  align-items:flex-end;
  justify-content: flex-start;
  margin: 1rem auto 3rem;
  gap: 1rem;
}

.filters-ctl > div {
  width: 20%;
  min-width: 200px;
}
</style>
