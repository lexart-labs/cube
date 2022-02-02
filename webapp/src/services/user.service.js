/* eslint-disable func-names */
import axios from 'axios';

import { APP_NAME, API } from '../../env';

const buildHeaders = () => {
  const token = localStorage.getItem(`token-app-${APP_NAME}`);
  const userId = localStorage.getItem(`id-${APP_NAME}`);

  const headers = {
    token,
    'user-id': userId,
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
    allDevIndicators(year, cb) {
      const headers = buildHeaders();

      const endpoint = year
        ? `${API + model}dev-indexes?year=${year}`
        : `${API + model}dev-indexes`
      axios.get(endpoint, { headers }).then(({ data }) => cb(data))
    }
  };
};

export default UserService;
