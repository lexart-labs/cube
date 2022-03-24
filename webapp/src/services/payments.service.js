import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);
  const company_slug = localStorage.getItem('_company-slug');

  return { token, 'user-id': userId, company_slug };
};
const MODEL = 'payments';
const CURRENT_YEAR = (new Date()).getFullYear();

const PaymentsService = {
  update: async (id, payload) => {
    const headers = generateHeader();
    const { data } = await axios.put(`${API + MODEL}/${id}`, payload, { headers });
    return data;
  },
  insert: async (payload) => {
    const headers = generateHeader();
    const { data } = await axios.post(`${API + MODEL}/`, payload, { headers });
    return data;
  },
  remove: async (id) => {
    const headers = generateHeader();
    const { data } = await axios.delete(`${API + MODEL}/${id}`, payload, { headers });
    return data;
  },
  getAll: async (year = CURRENT_YEAR, page, idUser = 0) => {
    const headers = generateHeader();
    const { data } = await axios.get(`${API + MODEL}?p=${page}&idUser=${idUser}&year=${year}`, { headers });
    return data.response ? data.response : [];
  },
  getOne: async (id) => {
    const headers = generateHeader();
    const { data } = await axios.get(`${API + MODEL}/${id}`, { headers });
    return data.response ? data.response[0] : {};
  },
  countPages: async (year = CURRENT_YEAR, idUser = 0) => {
    const headers = generateHeader();
    const { data } = await axios.get(`${API + MODEL}/count?idUser=${idUser}&year=${year}`, { headers });
    return data.response ? data.response : 1;
  },
};

export default PaymentsService