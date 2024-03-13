import { createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.prototype.$t = msg => msg;

export default localVue;