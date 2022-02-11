import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);

  return { token, 'user-id': userId };
};
const MODEL = 'teams/';

const TeamService = {
  getAll: async function () {
    const headers = generateHeader();
    const { data } = await axios.get(`${API + MODEL}`, { headers });
    return data;
  },
  updateOne: async function (id, payload) {
    const headers = generateHeader();
    const { data } = await axios.put(`${API + MODEL}${id}`, payload, { headers });
    return data;
  },
  insertOne: async function (payload) {
    const headers = generateHeader();
    const { data } = await axios.post(`${API + MODEL}`, payload, { headers });
    return data;
  },
  remove: async function (id) {
    const headers = generateHeader();
    const { data } = await axios.delete(`${API + MODEL}${id}`, { headers });
    return data;
  },
};

export default TeamService;
