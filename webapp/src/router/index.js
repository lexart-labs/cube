import VueRouter from 'vue-router';

import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Evaluations from '../views/Evaluations.vue';
import Admin from '../views/Admin/Admin.vue';
import Users from '../views/Admin/Users.vue';
import EvaluationsAdmin from '../views/Admin/Evaluations.vue';
import Technologies from '../views/Admin/Technologies.vue';
import Origin from '../views/Admin/Origins.vue';
import AppComponent from '../views/AppComponent.vue';
import RegisterCompany from '../views/RegisterCompany.vue';
import Continuity from '../views/Admin/Continuity.vue';
import Collaborators from '../views/Admin/Collaborators.vue';
import Payments from '../views/Admin/Payments.vue';
import Levels from '../views/Admin/Levels.vue'
import CareerType from '../views/Admin/CareerType';

const routes = [
  { path: '/:slug/login', name: 'Login', component: Login },
  { path: '/rcompany', name: 'Register Company', component: RegisterCompany },
  { path: '/:slug/', name: 'Login2', component: Login },
  {
    path: '/app',
    component: AppComponent,
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
            path: 'collaborators',
            component: Collaborators,
          },
          {
            path: 'evaluaciones',
            component: EvaluationsAdmin,
          },
          {
            path: 'continuity',
            component: Continuity,
          },
          {
            path: 'payments',
            component: Payments,
          },
          {
            path: 'technologies',
            component: Technologies,
          },
          {
            path: 'origins',
            component: Origin,
          },
          {
            path: 'levels',
            component: Levels
          },
          {
            path: 'career-type',
            component: CareerType,
          }
        ],
      },
    ],
  },
  { path: '*', redirect: '/login'}
];

const router = new VueRouter({
  history: 'history',
  routes,
  base: process.env.BASE_URL,
  linkActiveClass: 'active',
});

export default router;
