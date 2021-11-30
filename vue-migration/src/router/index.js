import { createRouter, createWebHistory } from 'vue-router';

import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Evaluations from '../views/Evaluations.vue';
import Admin from '../views/Admin/Admin.vue';
import Users from '../views/Admin/Users.vue';
import EvaluationsAdmin from '../views/Admin/Evaluations.vue';
import AppComp from '../App.vue';

const routes = [
  { path: '/:token?', name: 'Login', component: Login },
  {
    path: '/app',
    component: AppComp,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'evaluations/:id/:curso', component: Evaluations },
      {
        path: 'administration',
        component: Admin,
        children: [
          {
            path: 'users',
            component: Users,
          },
          {
            path: 'evaluaciones',
            component: EvaluationsAdmin,
          },
        ],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
