const DashboardComp = Vue.component('dashboard-component', function (callback) {
	let viewUrl = './app/components/dashboard/dashboardView.html'

	axios.get(viewUrl).then( function (result){
		let view = result.data;

		callback({
			data: function () {
				return {
					title: 'Mis Cursos',
					courses: [],
					isLoading: true,
					searchQuery: null,
					error: ''
				}
			},
			methods: {
				
			},
			mounted: function (){
				
				let id    = localStorage.getItem('id-' + APP_NAME);
				let token = localStorage.getItem('token-app-' + APP_NAME);
				let userId= localStorage.getItem('id-' + APP_NAME);

				// Verifico el token
				verifyToken(token)

				const headers = {
					token: token,
					'user-id': userId
				}

				if(id){
					// Obtener los datos del lextracking
					let userLextracking = JSON.parse(localStorage.getItem('_lextracking_user-' + APP_NAME))
					console.log("userLextracking: ", userLextracking)

					axios.get(API + 'courses/by-user/' + id, 
						{headers: headers}).then( (res) => {

						this.isLoading = false;

						console.log("res: ", res)

						if(!res.data.error){
							let courses  = res.data.response;
							this.courses = courses;
						} else {
							this.error = res.data.error
						}
					})
				}
			},
			template: view,
			computed: {
			    resultQuery: function () {
			      if(this.searchQuery){
				      return this.courses.filter((item)=>{
				        return this.searchQuery.toLowerCase().split(' ').every(v => item.name.toLowerCase().includes(v))
				      })
			      } else {
			        return this.courses;
			      }
			    }
			}
		})
	})
})