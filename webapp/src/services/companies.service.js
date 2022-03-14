import axios from 'axios';
import { APP_NAME, API } from '../../env';

const MODEL = 'companies/';

const Companies = {
  getAll: async function () {
    const { data } = await axios.get(`${API + MODEL}`);
    return data;
  },
  getById: async function (id) {
    const { data } = await axios.get(`${API + MODEL}/${id}`, { headers });
    return data;
  },
  insert: async function (payload) {
    const { data } = await axios.post(`${API + MODEL}`, payload);
    return data;
  },
  update: async function (id, company) {
    const { data } = await axios.put(`${API + MODEL}/${id}`, { company }, { headers });
    return data;
  },
  remove: async function (id) {
    const { data } = await axios.delete(`${API + MODEL}/${id}`, { headers });
    return data;
  },
};

export default Companies;
