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
					success: '',
					resources: []
				}
			},
			methods: {
				syncUsuario: function (){
					// Obtener los datos del lextracking
					let userLextracking = JSON.parse(localStorage.getItem('_lextracking_user-' + APP_NAME))
					userLextracking.type = userLextracking.role
					userLextracking.sync = (userLextracking.cubeExist && userLextracking.cubeExist == true) ? false : true

					this.isSync = true
					UserService().upsertUser( userLextracking, (res) => {
						this.isSync = false
						if(!res.error){
							
							Vue.toasted.show('Usuario sincronizado correctamente', {
								type: 'success',
								duration: 2000
							});

							this.error = ''
							this.success = 'Usuario sincronizado 👏'
							let id    	 = localStorage.getItem('id-' + APP_NAME);

							// Obtenemos evaluaciones de un usuario
							// this.obtenerEvaluaciones(id)
							window.location.reload()

						} else {
							this.error = res.error;

							Vue.toasted.show('Error al sincronizar el usuario', {
								type: 'error',
								duration: 2000
							});
						}
					})

				},
				obtenerEvaluaciones: function (id){
					let token 	= localStorage.getItem('token-app-' + APP_NAME);
					let userId 	= localStorage.getItem('id-' + APP_NAME);

					const headers = {
						token: token,
						'user-id': userId
					}
					axios.get(API + 'courses/by-user/' + id, 
						{headers: headers}).then( (res) => {
						this.isLoading = false;
						if(!res.data.error){
							let data  = res.data.response;
							this.resources = data
						} else {
							Vue.toasted.show('Error no se encontró evaluaciones', {
								type: 'error',
								duration: 2000
							});
						}
					})
				},
				formatDate: function (date){
					// Format SQL to UY date
					let newDate = date.split('T')
					// 0 index correspond to raw date after split
					let uyDate  = newDate[0].split('-')
					// 2 index - year
					// 1 index - month
					// 0 index - day
					uyDate = uyDate[2] + '/' + uyDate[1] + '/' + uyDate[0]
					// sum full year UY format with hour after split - index 0
					uyDate = uyDate + ' ' + newDate[1]

					return uyDate
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


						if(!res.data.error){
							// let courses  = res.data.response;
							// this.courses = courses;
							this.success = 'Usuario sincronizado 👏'

							// Obtenemos evaluaciones de un usuario
							this.obtenerEvaluaciones(id)
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
				      return this.resources.filter((item)=>{
				        return this.searchQuery.toLowerCase().split(' ').every(v => item.name.toLowerCase().includes(v))
				      })
			      } else {
			        return this.resources;
			      }
			    }
			}
		})
	})
})