import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);

  return { token, 'user-id': userId };
};

const headers = generateHeader();

const TechnologiesService = function () {
  const MODEL = 'technologies/';
  return {
    getAll: async function () {
      const { data } = await axios.get(`${API + MODEL}`, { headers });
      return data;
    },
    getByUser: async function(idUser) {
      const { data } = await axios.get(`${API}/skills/${idUser}`, { headers });
      return data;
    },
    asignNew: async function (idUser, idTech) {
      const {data} = await axios.post(`${API}/skills/${idUser}/${idTech}`, {}, { headers });
      return data;
    },
    remove: async function (idUser, idTech) {
      const {data} = await axios.delete(`${API}/skills/${idUser}/${idTech}`, {}, { headers });
      return data;
    },
  };
};

export default TechnologiesService;
