/* eslint-disable func-names */
import axios from 'axios';

require('dotenv').config();

const { APP_NAME, API } = process.env;

const AuthService = function () {
  return {
    checkType(cb) {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const user = {
        token,
        userId,
      };

      const headers = {
        token,
        'user-id': userId,
      };

      axios.post(`${API}users/check-type`, user, { headers }).then((res) => {
        cb(res.data);
      });
    },
  };
};

export default AuthService;
