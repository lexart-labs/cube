const UsersComp = Vue.component('users-component', function (callback) {
	let viewUrl = './app/components/admin/users/usersView.html'

	axios.get(viewUrl).then( function (result){
		let view = result.data;

		callback({
			data: function () {
				return {
					title: 'Administración de usuarios',
					users: [],
					error: '',
					isLoading: true,
					searchQuery: null,
					curso: null,
					user: {},
					api: API
				}
			},
			methods: {
				newUser: function (){
					this.user = {}
				},
				getUserById: function (id){
					UserService().getUserById(id, (res) => {
						if(!res.error){
							this.user = res.response;
						}
					})
				},
				upsertUser: function (){
					UserService().upsertUser( this.user, (res) => {
						if(!res.error){
							$('#staticBackdrop').modal('hide')
							
							Vue.toasted.show('Usuario editado/creado correctamente', {
								type: 'success',
								duration: 2000
							});
							
							setTimeout( () => {
								window.location.reload()
							}, 1000)

						} else {
							this.error = res.error;
						}
					})
				},
				uploadFile: function (){
					
					let logoFile = this.$refs.logo.files[0];
					let bgFile   = this.$refs.background.files[0];

					let formLogo = new FormData();
					let formBg 	 = new FormData()
					formLogo.append('file-image', logoFile);
					formBg.append('file-image', bgFile);

					if(logoFile){
						// Upload logo
						axios.post( API + 'upload-file',
							formLogo,
							{
								headers: {
									'Content-Type': 'multipart/form-data'
								}
							}
						).then((sucess) => {
							console.log('success logo: ', sucess);
							
							this.user.logo = sucess.data.response.url

							Vue.toasted.show('Logo subido correctamente', {
								type: 'success',
								duration: 2000
							});
						})
					}

					if(bgFile){
						// Upload background
						axios.post( API + 'upload-file',
							formBg,
							{
								headers: {
									'Content-Type': 'multipart/form-data'
								}
							}
						).then((sucess) => {
							console.log('success background: ', sucess);
							this.user.background = sucess.data.response.url

							Vue.toasted.show('Background subido correctamente', {
								type: 'success',
								duration: 2000
							});
						})
					}
				},
				silentFunction: function (){
					console.log(this.$refs.logo.files);
					console.log(this.$refs.background.files);
				}
			},
			mounted: function (){
				
				let token 	= localStorage.getItem('token-app-' + APP_NAME);

				// Verifico el token
				verifyToken(token)

				UserService().getAllUsers( (res) => {
					this.isLoading = false;
					if(!res.error){
						let users  = res.response;
						this.users = users;
					} else {
						this.error = res.error;
					}
				})
			},
			template: view,
			computed: {
			    resultQuery: function () {
			      if(this.searchQuery){
				      return this.users.filter((item)=>{
				        return this.searchQuery.toLowerCase().split(' ').every(v => item.name.toLowerCase().includes(v))
				      })
			      } else {
			        return this.users;
			      }
			    }
			}
		})
	})
})