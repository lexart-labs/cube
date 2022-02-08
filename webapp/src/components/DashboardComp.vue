<template>
  <div v-if="!isLoading">
    <timeline :user="myUser" v-if="myUser" />
    <h4 class="text-center" v-if="years.length === 0">
      {{ translations[$store.state.language].dashboard.userHaventEvaluations }}
    </h4>
    <div class="graphics-ctl">
      <graphic v-if="evaluations.length" :evaluations="evaluations" />
      <Rombo
        v-if="evaluations.length"
        :evaluations="evaluations"
        :year="year"
      />
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Vue from "vue";
import { API } from "../../env";
import Timeline from "./Timeline.vue";
import translations from "../data/translate";
import graphic from "./graphicEvaluation.vue";
import Rombo from "./rombo.vue";

export default {
  name: "DashComp",
  props: ["dev"],
  components: { Timeline, graphic, Rombo },
  data() {
    return {
      myUser: {},
      years: [],
      evaluations: [],
      year: new Date().getFullYear(),
      translations,
      isLoading: false,
    };
  },
  methods: {
    getEvaluations: async function(token, userId) {
      const headers = {
        token,
        "user-id": userId,
      };

      const { data: { response } } = await axios.get(
        `${API}courses/by-user/${userId}?year=${this.year}`,
        { headers }
      );

      if (response) {;
        return response;
      } else {
        Vue.toasted.show(
          translations[this.$store.state.language].dashboard.evaluationNotFound,
          { type: "error", duration: 2000 }
        );
      }

      return [];
    },
    getYears: async function(token, userId) {
      const headers = {
        token,
        "user-id": userId,
      };

      const { data } = await axios.get(`${API}courses/years/${userId}`, {
        headers,
      });
      if (!data.err) {
        return data;
      } else {
        Vue.toasted.show(
          translations[this.$store.state.language].dashboard
            .userHaventEvaluations,
          { type: "info", duration: 2000 }
        );
        return [];
      }
    },
    getMyUser: async function(token, userId) {
      const headers = {
        token,
        "user-id": userId,
      };

      const {
        data: { response },
      } = await axios.get(`${API}users/${userId}`, { headers });

      if (response) {
        const user = { ...response, skills: JSON.parse(response.skills) };
        return user;
      }
      
      return {};
    },
  },
  async mounted() {
    const token = this.dev.token;
    const idDev = this.dev.idLextracking;

    this.isLoading = true;

    const [myUser, evaluations, years] = await Promise.all([
      this.getMyUser(token, idDev),
      this.getEvaluations(token, idDev),
      this.getYears(token, idDev),
    ]);

    this.isLoading = false;

    this.myUser = myUser;
    this.evaluations = evaluations;
    this.years = years;
  },
  computed: {},
};
</script>

<style scoped>
</style>