<template>
  <ExplorerTable
    v-if="!isLoading"
    translations="AdminContinuity"
    :tableKeys="['id', 'name', 'month', 'year', 'continuity']"
    modalId="#Number"
    :tableData="reports"
    :onNew="newReport"
    :onEdit="getReportById"
    :pager="handlePagination"
    :pagesCount="pageCount"
  ></ExplorerTable>
</template>

<script>
import HoursService from '../../services/hours.service';
import ExplorerTable from '../../components/explorerTable.vue';

export default {
  name: 'Continuity',
  components: { ExplorerTable },
  data() {
    return {
      reports: [],
      report: {
        id: 0,
        year: 2022,
        month: '',
        idColaborator: 0,
        name: '',
        continuity: '0:00',
      },
      filters: {
        year: (new Date()).getFullYear(),
        month: 0,
      },
      isLoading: false,
      pageCount: 1,
      idCompany: 1,
    };
  }, 
  methods: {
    newReport() {
      console.log('Chamei o modal com os valores default');
    },
    getReportById: async (id) => {
      // this.isLoading = true;
      console.log('Busquei pelo id');

      // const report = await HoursService.getOne(id);
      // this.report = report;

      // this.isLoading = false;
    },
    handlePagination: async (page) => {
      return setTimeout(() => 'Avançou a pagina', 500);
    },
  },
  async mounted() {
    this.isLoading = true;

    const month = this.filters.month;
    const year = this.filters.year;

    const [pageCount, reports] = await Promise.all([
      HoursService.countPages(),
      HoursService.getAll(this.idCompany, month, year, 0)
    ]);

    this.pageCount = pageCount;
    this.reports = reports;

    this.isLoading = false;
  },
}
</script>
