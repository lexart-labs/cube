<template>
  <div>
    <timeline :user="myUser" v-if="myUser" />
    <h4 class="text-center" v-if="years.length === 0">
      {{ translations[$store.state.language].dashboard.userHaventEvaluations }}
    </h4>
    <div class="graphics-ctl">
      <graphic v-if="evaluations.length" :evaluations="evaluations" />
      <Rombo v-if="evaluations.length" :evaluations="evaluations" :year="year" />
    </div>
  </div>
</template>

<script>
import Timeline from './Timeline.vue';
import translations from '../data/translate';
import graphic from './graphicEvaluation.vue';
import Rombo from './rombo.vue';

export default {
  name: "DashComp",
  // props: { 'dev', }
  components: { Timeline, graphic, Rombo },
  data() {
    return {
      myUser: {},
      years: [],
      evaluations: [],
      year: [],
    };
  },
  methods: {},
  methods: {},
  mounted() {},
  computed: {},
};
</script>

<style scoped>
</style>