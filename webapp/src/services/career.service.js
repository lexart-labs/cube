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
    getByCareerType: async function (idCareerType) {
      const headers = generateHeader();
      const { data } = await axios.get(`${API + MODEL}byIdCareerType/${idCareerType}`, { headers });
      return data;
    },
  };
};

export default CareerService;
