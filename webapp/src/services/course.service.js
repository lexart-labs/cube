/* eslint-disable func-names */
import axios from 'axios';

import { APP_NAME, API } from '../../env';

const CourseService = function () {
  const model = 'courses/';
  return {
    getCourseById(id, cb) {
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
    getAllCourses(page, query = '') {
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
    upsertCourse(user, cb) {
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
    getPagesLength: async function() {
      const token = localStorage.getItem(`token-app-${APP_NAME}`);
      const userId = localStorage.getItem(`id-${APP_NAME}`);

      const headers = {
        token,
        'user-id': userId,
      };

      return axios.get(`${API + model}count`, { headers });
        // .then((res) => {cb(res.data);});
    },
  };
};

export default CourseService;
