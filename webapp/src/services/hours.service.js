import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);

  return { token, 'user-id': userId };
};
const MODEL = 'hours';
const CURRENT_YEAR = (new Date()).getFullYear();

const HoursService = {
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
  getAll: async (idCompany, month, year, page) => {
    const headers = generateHeader();
    const { data } = await axios.get(`${API + MODEL}?p=${page}&month=${month}&year=${year}&idCompany=${idCompany}`, { headers });
    return data.response ? data.response : [];
  },
  getOne: async (id) => {
    const headers = generateHeader();
    const { data } = await axios.get(`${API + MODEL}/${id}`, { headers });
    return data.response ? data.response[0] : {};
  },
  countPages: async (m = 0, y = CURRENT_YEAR) => {
    const headers = generateHeader();
    const { data } = await axios.get(`${API + MODEL}/count?month=${m}&year=${y}`, { headers });
    return data.response ? data.response : 1;
  },
  userYearHours: async (id, year = CURRENT_YEAR) => {
    const headers = generateHeader();
    const { data } = await axios.get(`${API + MODEL}/all-year-hours/${id}/${year}`, { headers });
    return data.response ? data.response : [];
  },
};

export default HoursService