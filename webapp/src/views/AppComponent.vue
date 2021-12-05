<template>
  <div id="app--component">
    <Menu />
    <router-view />
  </div>
</template>

<script>
import Menu from '../components/Menu.vue';

export default {
  name: 'AppComponent',
  components: { Menu },
  data() {
    return {};
  },
  methods: {},
  mounted() {},
};
</script>
