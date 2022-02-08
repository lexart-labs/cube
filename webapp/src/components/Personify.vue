<template>
  <div>
    <vue-select
      :options="devs"
      id="devs"
      style="width: 95%"
      v-model="currentDev"
      :getOptionLabel="(el) => el.name"
    >
    </vue-select>
    <button
      type="button"
      class="btn btn-primary"
    >
      {{ $t('generic.personify') }}
    </button>
  </div>
</template>

<script>
export default {
  name: "Personify",
  propr: ['devs'],
  components: {},
  data() {
    return {
      devs,
      currentDev,
    };
  },
  methods: {
    setIsPersonufying() {
      this.$store.state.isPesonifying = true;
    },
  },
  async mounted() {},
  computed: {},
};
</script>
