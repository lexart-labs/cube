import Vue from 'vue';
import vSelect from 'vue-select';
import Toasted from 'vue-toasted';
import VueRouter from 'vue-router';
import App from './App.vue';
import router from './router';
import 'vue-select/dist/vue-select.css';

Vue.config.productionTip = false;

Vue.use(Toasted, { router });
Vue.use(VueRouter);

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');

Vue.component('v-select', vSelect);
