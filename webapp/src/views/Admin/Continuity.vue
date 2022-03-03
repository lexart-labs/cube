<template>
  <ExplorerTable
    v-if="!isLoading"
    translations="AdminContinuity"
    :tableKeys="['id', 'name', 'month', 'year', 'continuity']"
    modalId="#upsert-report"
    :tableData="reports"
    :onNew="newReport"
    :onEdit="getReportById"
    :pager="handlePagination"
    :pagesCount="pageCount"
  >
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
                      :options="$t('generic.months')"
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
                        type="time"
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
              >
                {{ $t("generic.close") }}
              </button>
              <button type="button" class="btn btn-primary">
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
import ExplorerTable from "../../components/explorerTable.vue";
import vueSelect from "vue-select";

export default {
  name: "Continuity",
  components: { ExplorerTable, vueSelect },
  data() {
    return {
      reports: [],
      colaborators: [{ name: "Tester Boy", id: 0 }],
      report: {
        id: 0,
        year: 2022,
        month: "",
        idColaborator: 0,
        name: "",
        continuity: "0:00",
      },
      filters: {
        year: new Date().getFullYear(),
        month: 0,
      },
      isLoading: false,
      pageCount: 1,
      idCompany: 1,
    };
  },
  methods: {
    newReport() {
      console.log("Chamei o modal com os valores default");
    },
    getReportById: async (id) => {
      // this.isLoading = true;
      console.log("Busquei pelo id");

      // const report = await HoursService.getOne(id);
      // this.report = report;

      // this.isLoading = false;
    },
    handlePagination: async (page) => {
      const reports = await HoursService.getAll(
        this.idCompany,
        this.month,
        this.year,
        this.page
      );

      this.reports = reports;
    },
  },
  async mounted() {
    this.isLoading = true;

    const month = this.filters.month;
    const year = this.filters.year;

    const [pageCount, reports] = await Promise.all([
      HoursService.countPages(),
      HoursService.getAll(this.idCompany, month, year, 0),
    ]);

    this.pageCount = pageCount;
    this.reports = reports;

    this.isLoading = false;
  },
};
</script>
