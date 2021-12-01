const LoginComp = Vue.component('login-component', function (callback) {
	let viewUrl = './app/components/login/loginView.html'

	axios.get(viewUrl).then( function (result){
		let view = result.data;

		callback({
			data: function () {
				return {
					usr: {},
					error: '',
					isLoading: false,
					api: API, 
					setting: {
						background: '',
						logo: ''
					}
				}
			},
			methods: {
				loginUser: function () {
					this.isLoading = true
					const user = copy(this.usr);

					axios.post(API + 'users/login', user).then( (res) => {
						let rs = res.data;
						this.isLoading = false

						if(!rs.error){
							// Guardar en el localStorage
							// Token del response
							localStorage.setItem('token-app-' + APP_NAME, rs.response.token)
							localStorage.setItem('id-' + APP_NAME, rs.response.idLextracking)

							window.localStorage.setItem('_lextracking_user-' + APP_NAME, JSON.stringify(rs.response))
							
							router.push('/app/dashboard');
						} else {
							this.error = rs.error;
						}

					}, (err) => {
						this.error = "Error de servidor. Contacte al administrador";
						this.isLoading = false
					})
				}
			},
			mounted: function (){
				localStorage.clear()

				// Obtengo la información de la escuela si tengo token
				let token = app._route.params.token
				if(token){
					axios.get(API + 'users/school/' + token).then( (res) => {
						if(!res.data.error){
							this.setting = res.data.response
							// Bypass del token al storage
							this.setting.token = token
							window.localStorage.setItem('_setting-' + APP_NAME, JSON.stringify(this.setting))
						} else {
							Vue.toasted.show('Error en obtener la institución', {
								type: 'error',
								duration: 2000
							});
						}
					}, (err) => {
						Vue.toasted.show('Error en obtener la institución', {
							type: 'error',
							duration: 2000
						});
					})
				}
			},
			template: view
		})
	})
})