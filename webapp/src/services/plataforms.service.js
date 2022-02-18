import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);

  return { token, 'user-id': userId };
};

const headers = generateHeader();
const MODEL = 'plataforms/';

const DevOriginsService = {
  getAll: async function () {
    const { data } = await axios.get(`${API + MODEL}`, { headers });
    return data.response ? data.response : [];
  },
  getById: async function (id) {
    const { data } = await axios.get(`${API + MODEL}/${id}`, { headers });
    return data;
  },
  update: async function (id, plataform) {
    const { data } = await axios.put(`${API + MODEL}/${id}`, { plataform }, { headers });
    return data;
  },
  remove: async function (id) {
    const { data } = await axios.delete(`${API + MODEL}/${id}`, { headers });
    return data;
  },
  insert: async function (plataform) {
    const { data } = await axios.post(`${API + MODEL}`, { plataform }, { headers });
    return data;
  },
};

export default DevOriginsService;
