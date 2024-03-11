/* eslint-disable func-names */
import axios from 'axios';

import { API, APP_NAME } from '../../env';

const BurnoutTestService = function () {
  const model = 'burnout_tests/';
  return {
    getById(id, cb) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        'user-id': userId,
      };

      axios.get(API + model + id, { headers }).then((res) => {
        cb(res.data);
      });
    },
    all(page, query = '') {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        'user-id': userId,
      };

      const endpoint = query
        ? `${API + model}all?page=${page}&query=${query}`
        : `${API + model}all?page=${page}`

      return axios.get(endpoint, { headers });
        // .then((res) => {cb(res.data);});
    },
    upsert(item, cb) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        'user-id': userId,
      };

      axios.post(`${API + model}upsert`, item, { headers }).then((res) => {
        cb(res.data);
      });
    },
    getPagesLength: async function(query) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        'user-id': userId,
      };

      const endpoint = query ? `${API + model}count?query=${query}` : `${API + model}count`; 

      return axios.get(endpoint, { headers });
        // .then((res) => {cb(res.data);});
    },
  };
};

export default BurnoutTestService;
