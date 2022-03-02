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
    :pagesCount="1"
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
      reports: [
        {
          id: 1,
          year: 2022,
          month: 'Febrero',
          idColaborator: 34,
          name: 'Tester Boy',
          continuity: '2:50',
        },
        {
          id: 2,
          name: 'Tester Boy 2',
          month: 'Febrero',
          year: 2022,
          continuity: '5:40',
          idColaborator: 33,
        },
      ],
      report: {
        id: 0,
        year: 2022,
        month: '',
        idColaborator: 0,
        name: '',
        continuity: '0:00',
      },
      isLoading: false,
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
}
</script>
