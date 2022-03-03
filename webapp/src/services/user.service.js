/* eslint-disable func-names */
import axios from 'axios';

import { APP_NAME, API } from '../../env';

const buildHeaders = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);

  const headers = {
    token,
    'user-id': userId,
    'company_slug': localStorage.getItem("_company-slug")
  };

  return headers;
};

const UserService = function () {
  const model = 'users/';
  return {
    getUserById(id, cb) {
      const headers = buildHeaders();
      console.log(headers)

      axios.get(API + model + id, { headers }).then((res) => {
        cb(res.data);
      });
    },
    getAllUsers(page, cb) {
      const headers = buildHeaders();

      const sql = page == null
        ? `${API + model}all`
        : `${API + model}all?page=${page}`

      axios.get(sql, { headers }).then((res) => {
        cb(res.data);
      });
    },
    getAllUsersLextracking(cb) {
      const headers = buildHeaders();

      axios.get(`${API + model}lextracking/all`, { headers }).then((res) => {
        cb(res.data);
      });
    },
    upsertUser(user, cb) {
      const headers = buildHeaders();

      axios.post(`${API + model}upsert`, user, { headers }).then((res) => {
        cb(res.data);
      });
    },
    getPagesLength(cb) {
      const headers = buildHeaders();

      axios.get(`${API + model}count`, { headers }).then((res) => {
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
    getByCompany: async (idLead, isCompany) => {
      const headers = buildHeaders();
      const { data } = await axios.get(`${API + model}by-company?l=${idLead}&cp=${isCompany}`, { headers });
      return data.response ? data.response : [];
    },
  };
};

export default UserService;
