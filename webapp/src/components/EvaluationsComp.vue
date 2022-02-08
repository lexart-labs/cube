<template>
  <div class="dashboard--resources">
    <h4 class="text-center" v-if="years.length === 0">
      {{ translations[$store.state.language].dashboard.userHaventEvaluations }}
    </h4>
    <evaluation-viewer
      v-if="evaluations.length"
      :course="evaluations[showEvaluation]"
    />
    <input
      type="search"
      :placeholder="$t('generic.searchPlaceholderEvaluations')"
      v-model="searchQuery"
      v-if="success && resultQuery.length > 0"
      class="form-control"
      style="margin-bottom: 1rem"
    />
    <div class="courseContainer" v-if="!isLoading"></div>
    <div
      class="alert alert-primary"
      :key="`resource${index}`"
      data-toggle="modal"
      data-target="#staticBackdrop"
      role="alert"
      v-show="success && resultQuery.length > 0"
      v-for="(evaluation, index) in resultQuery"
      v-on:click="
        () => {
          showEvaluation = index;
        }
      "
    >
      <div>
        <p>
          <i class="bi bi-calendar-check-fill"></i>
          {{ evaluation.name }}
        </p>
        <p class="smallText">
          <b>Tech Lead:</b> {{ evaluation.lead }} -
          {{ formatDate(evaluation.fecha) }}
        </p>
        <hr />
        <p class="smallText" v-html="evaluation.observaciones"></p>
      </div>
      <div class="text-right">
        <b>{{ evaluation.total }}%</b>
      </div>
    </div>
  </div>
</template>

<script>
import EvaluationViewer from "./evaluationsViewer.vue";
import translations from "../data/translate";

export default {
  name: "EvalsComp",
  // props: { 'dev', }
  components: { EvaluationViewer },
  data() {
    return {
      years: [],
      evaluations: [],
      showEvaluation: "",
      searchQuery: "",
      success: "",
      isLoading: "",
    };
  },
  methods: {},
  methods: {
    formatDate(date) {
      const newDate = date.split("T");
      let uyDate = newDate[0].split("-");
      uyDate = `${uyDate[2]}/${uyDate[1]}/${uyDate[0]}`;
      uyDate = `${uyDate} ${newDate[1]}`;

      return uyDate;
    },
  },
  mounted() {},
  computed: {
    resultQuery() {
      if (this.searchQuery) {
        return this.evaluations.filter((item) =>
          this.searchQuery
            .toLowerCase()
            .split(" ")
            .every((v) => item.name.toLowerCase().includes(v))
        );
      }
      return this.resources;
    },
  },
};
</script>

<style scoped>
</style>