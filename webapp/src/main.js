import Vue from 'vue';
import vSelect from 'vue-select';
import Toasted from 'vue-toasted';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import App from './App.vue';
import router from './router';
import 'vue-select/dist/vue-select.css';
import translations from './data/translate';

Vue.config.productionTip = false;

Vue.use(Toasted, { router });
Vue.use(VueRouter);
Vue.use(VueI18n);

const i18n = new VueI18n({
  locale: 'en',
  translations,
});

new Vue({
  router,
  i18n,
  render: (h) => h(App),
}).$mount('#app');

Vue.component('v-select', vSelect);
