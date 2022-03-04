import axios from 'axios';
import { APP_NAME, API } from '../../env';

const generateHeader = () => {
    const token = localStorage.getItem(`token-app-${APP_NAME}`);
    const userId = localStorage.getItem(`id-${APP_NAME}`);

    return { 
        token,
        'user-id': userId,
        'company_slug': localStorage.getItem("_company-slug")
    };
};

const headers = generateHeader();
const MODEL = 'collaborators/';

const Collaborators = {
  getByCompany: async function () {
    const { data } = await axios.get(`${API + MODEL}`, { headers });
    return data.response ? data.response : [];
  },
  getByIdUser: async function (id) {
    const { data } = await axios.get(`${API + MODEL}/${id}`, { headers });
    return data.response ? data.response : [];
  },
  createUser: async function (payload) {
    const { data } = await axios.post(`${API + MODEL}`, { payload }, { headers });
    return data;
  },
  editUser: async function (id, payload) {
    const { data } = await axios.put(`${API + MODEL}/${id}`, { payload }, { headers });
    return data;
  },
  inactivateUser: async function (id) {
    const { data } = await axios.delete(`${API + MODEL}/${id}`, { headers });
    return data;
  }
};

export default Collaborators;
