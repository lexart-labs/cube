/* eslint-disable func-names */
import axios from 'axios';

import { APP_NAME, API } from '../../env';

const buildHeaders = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);
  const lexToken = localStorage.getItem('lexToken');

  const headers = {
    token,
    'user-id': userId,
    'company_slug': localStorage.getItem("_company-slug"),
    lexToken,
  };

  return headers;
};

const UserService = function () {
  const model = 'users/';
  return {
    getUserById(id, cb) {
      const headers = buildHeaders();

      axios.get(API + model + id, { headers }).then((res) => {
        cb(res.data);
      });
    },
    getAllUsers(page = 0, query, cb) {
      const headers = buildHeaders();

      const sql = query
        ? `${API + model}all?page=${page}&query=${query}`
        : `${API + model}all?page=${page}`;
      
      

      axios.get(sql, { headers }).then((res) => {
        cb(res.data);
      });
    },
    getAllUsersLextracking(cb, minified = false) {
      const headers = buildHeaders();
      const endpoint = `${API + model}lextracking/all`

      axios.get(`${endpoint}${minified ? '?minified=true' : ''}`, { headers }).then((res) => {
        cb(res.data);
      });
    },
    upsertUser(user, cb) {
      const headers = buildHeaders();

      axios.post(`${API + model}upsert`, user, { headers }).then((res) => {
        cb(res.data);
      });
    },
    upsertMyUser(user, cb) {
      const headers   = buildHeaders();
      const cubeUser  = JSON.parse(localStorage.getItem('cubeUser'))
      // headers['user-id'] = cubeUser.idUser

      user.lead = { id: cubeUser.idUser }

      console.log("headers", headers)
      axios.post(`${API + model}upsert`, user, { headers }).then((res) => {
        cb(res.data);
      });
    },
    getPagesLength(query = '', cb) {
      const headers = buildHeaders();

      axios.get(`${API + model}count?q=${query}`, { headers }).then((res) => {
        cb(res.data);
      });
    },
    getLeaders() {
      const headers = buildHeaders();

      return axios.get(`${API + model}leads`, { headers });
    },
    listLeadDevs() {
      const headers = buildHeaders();

      return axios.get(`${API + model}lead-tree`, { headers });
    },
    getLeaderDevs(idLead) {
      const headers = buildHeaders();

      return axios.get(`${API + model}lead-tree/${idLead}`, { headers });
    },
    allDevIndicators(year, techs, page, cb) {
      const headers = buildHeaders();

      const endpoint = year
        ? `${API + model}dev-indexes?year=${year}&page=${page}`
        : `${API + model}dev-indexes?page=${page}`;

      axios.post(endpoint, { techs }, { headers }).then(({ data }) => cb(data))
    },
    countDevs(techs, cb) {
      const headers = buildHeaders();
      axios.post(`${API + model}dev-indexes/count`, { techs }, { headers }).then(({data}) => {
        cb(data)
      });
    },
    getUnasigned: async () => {
      const headers = buildHeaders();
      const { data } = await axios.get(`${API + model}unasigned`, { headers });
      return data.response ? data.response : [];
    },
  }
};

export default UserService;
