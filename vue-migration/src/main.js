import Vue, { createApp } from 'vue';
import vSelect from "vue-select-3";
import Toasted from 'vue-toasted';
import App from './App.vue';
import router from './router';

createApp(App)
  .use(router)
  .use(Toasted)
  .mount('#app');

Vue.component("v-select", vSelect);
