import axios from 'axios';
import { APP_NAME, API } from '../../env';

const MODEL = 'companies/';

const buildHeaders = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);
  const lexToken = localStorage.getItem('lexToken');

  const headers = {
    token,
    'user-id': userId,
    'company_slug': localStorage.getItem("_company-slug"),
    lexToken,
  };

  return headers;
};

const headers = buildHeaders();

const Companies = {
  getAll: async function () {
    const { data } = await axios.get(`${API + MODEL}`);
    return data;
  },
  getById: async function (id) {
    const { data } = await axios.get(`${API + MODEL + id}`, { headers });
    return data.response ? data.response[0] : { name: '' };
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
  verify: async function (company) {
    const { data } = await axios.post(`${API + MODEL}/verify`, { company }, { headers });
    return data;
  },
};

export default Companies;
