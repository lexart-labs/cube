import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);
  const company_slug = localStorage.getItem('_company-slug');

  return { token, 'user-id': userId, company_slug };
};

const CareerService = function () {
  const MODEL = 'careers/';
  return {
    getAll: async function () {
      const headers = generateHeader();
      const { data } = await axios.get(`${API + MODEL}`, { headers });
      return data;
    },

    new: async function (body) {
      const headers = generateHeader();
      const { data } = await axios.post(`${API + MODEL}`, body,{ headers });
      return data;
    },

    put: async function (id, body) {
      const headers = generateHeader();
      const { data } = await axios.put(`${API + MODEL + id}`, body,{ headers });
      return data;
    },

    del: async function (id) {
      console.log(id);
      const headers = generateHeader();
      const { data } = await axios.delete(`${API + MODEL + id}`,{ headers });
      return data;
    },
    getByCareerType: async function (idCareerType) {
      const headers = generateHeader();
      const { data } = await axios.get(`${API + MODEL}byIdCareerType/${idCareerType}`, { headers });
      return data;
    },

    getByIdCompany: async function () {
      const headers = generateHeader();
      const { data } = await axios.get(`${API + MODEL}/byCompany`, { headers });
      return data;
    },
  };
};

export default CareerService;
