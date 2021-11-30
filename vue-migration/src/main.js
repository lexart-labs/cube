import { createApp } from 'vue';
import vSelect from 'vue-select';
import Toaster from '@meforma/vue-toaster';
import App from './App.vue';
import router from './router';

createApp(App)
  .use(router)
  .use(Toaster)
  .component('v-select', vSelect)
  .mount('#app');
