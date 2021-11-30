<template>
  <div>
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />
  </div>
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
