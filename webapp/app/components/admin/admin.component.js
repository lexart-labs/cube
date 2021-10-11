const AdminComp = Vue.component('admin-component', function (callback) {
	let viewUrl = './app/components/admin/adminView.html'

	axios.get(viewUrl).then( function (result){
		let view = result.data;

		callback({
			data: function () {
				return {
					title: 'Administración',
					resources: [],
					error: '',
					isLoading: true,
					searchQuery: null,
					curso: null
				}
			},
			methods: {
				
			},
			mounted: function (){
				
				let id    	= app._route.params.id ? app._route.params.id : undefined
				this.curso 	= app._route.params.curso ? decodeURIComponent(app._route.params.curso) : undefined
				let token 	= localStorage.getItem('token-app-' + APP_NAME);
				let userId 	= localStorage.getItem('id-' + APP_NAME);

				// Verifico el token
				verifyToken(token)

				this.isLoading = false;

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