/* eslint-disable func-names */
import axios from 'axios';

import { APP_NAME, API } from '../../env';

const UserService = function () {
  const model = 'users/';
  return {
    getUserById(id, cb) {
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
    getAllUsers(cb) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        'user-id': userId,
      };

      axios.get(`${API + model}all`, { headers }).then((res) => {
        cb(res.data);
      });
    },
    getAllUsersLextracking(cb) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        'user-id': userId,
      };

      axios.get(`${API + model}lextracking/all`, { headers }).then((res) => {
        cb(res.data);
      });
    },
    upsertUser(user, cb) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        'user-id': userId,
      };

      axios.post(`${API + model}upsert`, user, { headers }).then((res) => {
        cb(res.data);
      });
    },
  };
};

export default UserService;
