import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);

  return { token, 'user-id': userId };
};

const headers = generateHeader();
const MODEL = 'technologies/';

const TechnologiesService = {
  getAll: async function () {
    const { data } = await axios.get(`${API + MODEL}`, { headers });
    return data;
  },
  getByUser: async function (idUser) {
    const { data } = await axios.get(`${API}users/skills/${idUser}`, { headers });
    return data;
  },
  asignNew: async function (idUser, idTech) {
    const { data } = await axios.post(`${API}users/skills/${idUser}/${idTech}`, {}, { headers });
    return data;
  },
  remove: async function (idUser, idTech) {
    const { data } = await axios.delete(`${API}users/skills/${idUser}/${idTech}`, {}, { headers });
    return data;
  },
};

export default TechnologiesService;
