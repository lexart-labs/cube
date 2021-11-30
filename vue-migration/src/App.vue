<template>
  <router-view />
</template>

<script>
export default {
  data() {
    return {
      title: 'Mi blog',
      state: 'listado',
      articulo: undefined,
    };
  },
  methods: {
    changeState(state, obj) {
      this.state = state;

      if (obj) {
        this.articulo = obj;
      }
    },
  },
};
</script>

<style>
</style>
