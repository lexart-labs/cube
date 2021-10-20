Vue.component('menu-component', function (callback) {
	let viewUrl = './app/shared/menuView.html'

	axios.get(viewUrl).then( function (result){
		let view = result.data;

		callback({
			data: function () {
				return {
					isAdmin: false,
					setting: {
						web: '',
						escuela: '',
						logo: ''
					},
					api: API
				}
			},
			methods: {
				
			},
			mounted: function (){
				let token 	= localStorage.getItem('token-app-' + APP_NAME);
				try {
					let setting = JSON.parse( localStorage.getItem('_setting-' + APP_NAME) );
					if(setting){
						this.setting = setting
					}
				} catch(e){}
				

				// Verifico el token
				verifyToken(token)
				
				// Check if user isAdmin
				AuthService().checkType( (type) => {
					this.isAdmin = type.response == 'admin' ? true : false;
				})
			},
			template: view
		})
	})
})