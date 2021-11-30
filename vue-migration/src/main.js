import { createApp } from 'vue';
import Toasted from 'vue-toasted';
import App from './App.vue';
import router from './router';

createApp(App)
  .use(router)
  .use(Toasted)
  .mount('#app');
