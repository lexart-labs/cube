/* eslint-disable func-names */
import axios from 'axios';

require('dotenv').config();

const { APP_NAME, API } = process.env;

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
    getAllCourses(cb) {
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
  };
};

export default CourseService;
