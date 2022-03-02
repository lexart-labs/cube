import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);

  return { token, 'user-id': userId };
};
const MODEL = 'hours';

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
  getAll: async (idCompany, month, year) => {
    const headers = generateHeader();
    const { data } = await axios.get(`${API + MODEL}?month=${month}&year=${year}`, { headers: { ...headers, idCompany } });
    return data.response ? data.response : [];
  },
  getOne: async (id) => {
    const headers = generateHeader();
    const { data } = await axios.get(`${API + MODEL}/${id}`, { headers });
    return data.response ? data.response[0] : {};
  },
};

export default HoursService