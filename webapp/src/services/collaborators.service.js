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
const MODEL = 'collaborators';

const Collaborators = {
  getQuantityOfPages: async function (name) {
    const { data } = await axios.get(`${API + MODEL}/quantity-of-pages${name ? '?name=' + name : ''}`, { headers: generateHeader() });
    return data;
  },
  getByCompany: async function (page, name) {
    const { data } = await axios.get(`${API + MODEL}?page=${page}${name ? '&name=' + name : ''}`,{ headers: generateHeader() });
    return data;
  },
  getByIdUser: async function (id) {
    const { data } = await axios.get(`${API + MODEL}/by-id/${id}`, { headers: generateHeader() });
    return data;
  },
  createUser: async function (payload) {
    const { data } = await axios.post(`${API + MODEL}`, payload, { headers: generateHeader() });
    return data;
  },
  editUser: async function (id, payload) {
    const { data } = await axios.put(`${API + MODEL}/${id}`, payload, { headers: generateHeader() });
    return data;
  },
  inactivateUser: async function (id) {
    const { data } = await axios.delete(`${API + MODEL}/${id}`, { headers: generateHeader() });
    return data;
  }
};

export default Collaborators;
