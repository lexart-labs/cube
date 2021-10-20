const DashboardComp = Vue.component('dashboard-component', function (callback) {
	let viewUrl = './app/components/dashboard/dashboardView.html'

	axios.get(viewUrl).then( function (result){
		let view = result.data;

		callback({
			data: function () {
				return {
					title: 'Dashboard',
					courses: [],
					isLoading: true,
					isSync: false,
					searchQuery: null,
					error: '',
					success: ''
				}
			},
			methods: {
				syncUsuario: function (){
					// Obtener los datos del lextracking
					let userLextracking = JSON.parse(localStorage.getItem('_lextracking_user-' + APP_NAME))
					userLextracking.type = userLextracking.role
					userLextracking.sync = true

					this.isSync = true
					UserService().upsertUser( userLextracking, (res) => {
						this.isSync = false
						if(!res.error){
							
							Vue.toasted.show('Usuario sincronizado correctamente', {
								type: 'success',
								duration: 2000
							});

							this.error = ''

						} else {
							this.error = res.error;

							Vue.toasted.show('Error al sincronizar el usuario', {
								type: 'error',
								duration: 2000
							});
						}
					})

					console.log("userLextracking: ", userLextracking)
				}
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

					axios.get(API + 'users/' + id, 
						{headers: headers}).then( (res) => {

						this.isLoading = false;

						console.log("res: ", res)

						if(!res.data.error){
							// let courses  = res.data.response;
							// this.courses = courses;
							console.log("res: ", res.data)
							this.success = 'Usuario sincronizado 👏'
						} else {
							// Si no obtengo el usuario en la base, deberíamos cargarnos
							this.error = "¡Tu usuario no está sincronizado!"
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