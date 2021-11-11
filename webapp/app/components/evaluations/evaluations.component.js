const EvaluationsComp = Vue.component('evaluations-component', function (callback) {
	let viewUrl = './app/components/evaluations/evaluationsView.html'

	axios.get(viewUrl).then( function (result){
		let view = result.data;

		callback({
			data: function () {
				return {
					title: 'Curso',
					resources: [],
					clases: [],
					pagos: [],
					evaluaciones: [],
					error: '',
					isLoading: true,
					searchQuery: null,
					curso: null,
					types: {
						'video':{
							text: "Ver video",
							color: "alert-primary",
							icon: "bi-play-btn-fill"
						},
						'material':{
							text: "Ver material",
							color: "alert-secondary",
							icon: "bi-file-earmark-text-fill"
						}
					},
					tabs: {
						general: true, 
						clases: false,
						pagos: false
					}
				}
			},
			methods: {
				activeTab: function (tab){
					// Set all to false
					for (const key in this.tabs) {
						this.$set(this.tabs, key, false)
					}
					this.$set(this.tabs, tab, true)
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
				
				let id    	= app._route.params.id ? app._route.params.id : undefined
				this.curso 	= app._route.params.curso ? decodeURIComponent(app._route.params.curso) : undefined
				let token 	= localStorage.getItem('token-app-' + APP_NAME);
				let userId 	= localStorage.getItem('id-' + APP_NAME);
				// Corro la fecha de hoy a la timezone del alumno
				let tzoffset = (new Date()).getTimezoneOffset() * 60000
				let today 	= (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1)

				// Verifico el token
				verifyToken(token)

				const headers = {
					token: token,
					'user-id': userId
				}

				if(id){
					axios.get(API + 'resources/by-course/' + id, 
						{headers: headers}).then( (res) => {
						this.isLoading = false;
						if(!res.data.error){
							let data  = res.data.response;
							this.resources = data.resources;
							this.clases    = data.clases;
							this.pagos 	   = data.pagos;
							this.evaluaciones = data.evaluaciones

							this.clases.map(clase => {
								// Disable all clases
								clase.enableClase = false

								// Check if date is the same as today
								const claseDate = clase.fecha.split('T')[0]
								console.log(today, claseDate)
								if(today.includes(claseDate)){
									clase.enableClase = true
								}

								// Convert SQL date to UY date
								clase.fecha = this.formatDate(clase.fecha)
							})

							this.pagos.map(pago => {
								// Convert SQL date to UY date
								pago.fecha 	 = this.formatDate(pago.fecha)
								pago.userPay = false
								
								// Revisar al usuario
								pago.users.map(user => {
									if(user.id == userId && user.pagar == true){
										pago.userPay = true
									}
								})
							})

							this.evaluaciones.map(evaluacion => {
								// Convert SQL date to UY date
								evaluacion.fecha 	 = this.formatDate(evaluacion.fecha)
								if(evaluacion.userId == userId){
									evaluacion.userEvaluado = true
								}
							})
							
						} else {
							this.error 	   = res.data.error;
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