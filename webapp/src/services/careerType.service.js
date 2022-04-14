import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);
  const company_slug = localStorage.getItem(`_company-slug`);
  
  return { token, 'user-id': userId, company_slug};
};

const CareerTypeService = function () {
  const MODEL = 'careers/type';
  return {
    getByIdCompany: async function () {
      const headers = generateHeader();
      const { data } = await axios.get(`${API + MODEL}`, { headers });
      return data;
    },
  };
};

export default CareerTypeService;
