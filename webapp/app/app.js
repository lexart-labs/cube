let copy = function (obj){
	return JSON.parse( JSON.stringify(obj) )
}

const verifyToken = function (token) {
	if(token == undefined || token == ''){
		window.location.href = '/'
		window.localStorage.clear()
		return false;
	}
}

const kickOut = function () {
	window.location.href = '/'
	window.localStorage.clear()
}

// Definir los componentes de forma dinámica
const Login   	= LoginComp;
const AppComp   = AppComponent;
const Evaluations 	= EvaluationsComp;
const Dashboard = DashboardComp;
const Admin 	= AdminComp;
const Users 	= UsersComp;
const EvaluationsAdmin = EvaluationsAdminComp;

const routes = [
  { path: '/:token?', component: Login },
  { path: '/app', component: AppComp, 
  	children: [
  		{ path: 'dashboard', component: Dashboard },
  		{ path: 'evaluations/:id/:curso', component: Evaluations },
  		{ path: 'administration', component: Admin,  
		  	children: [
			    {
			      path: 'users',
			      component: Users
			    },
			    {
			      path: 'evaluaciones',
			      component: EvaluationsAdmin
			    }
			]
		}
  	]
  }
]

const router = new VueRouter({
  routes,
  linkActiveClass: "active"
})

const app = new Vue({
	router,
	data: {
		title: 'Mi blog',
		state: 'listado',
		articulo: undefined
	},
	methods: {
		changeState: function (state, obj){
			this.state = state;
			
			if(obj){
				this.articulo = obj;
			}
		}
	}
}).$mount('#app')
Vue.use(Toasted);
Vue.component('v-select', VueSelect.VueSelect);