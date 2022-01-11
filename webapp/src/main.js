import Vue from 'vue';
import vSelect from 'vue-select';
import Toasted from 'vue-toasted';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import Vuex from 'vuex';
import App from './App.vue';
import router from './router';
import 'vue-select/dist/vue-select.css';
import translations from './data/translate';

Vue.config.productionTip = false;

Vue.use(Toasted, { router });
Vue.use(VueI18n);
Vue.use(VueRouter);
Vue.use(Vuex);

const i18n = new VueI18n({
  locale: 'en',
  messages: translations,
});

const store = new Vuex.Store({
  state: {
    language: 'en',
  },
  mutations: {
    SET_LANGUAGE (state, lang) {
      state.language = lang;
    }
  },
  actions: {
    changeLang({ commit }, lang) {
      commit('SET_LANGUAGE', lang);
    },
  },
});

new Vue({
  router,
  i18n,
  store,
  render: (h) => h(App),
}).$mount('#app');

Vue.component('v-select', vSelect);
