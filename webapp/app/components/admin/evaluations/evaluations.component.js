const EvaluationsAdminComp = Vue.component('evaluations-admin-component', function (callback) {
	let viewUrl = './app/components/admin/evaluations/evaluationsView.html'

	axios.get(viewUrl).then( function (result){
		let view = result.data;

		callback({
			data: function () {
				return {
					title: 'Administración de evaluaciones',
					courses: [],
					error: '',
					isLoading: true,
					searchQuery: null,
					resource: {
						active: 1,
						type: 'video',
						link: ''
					},
					course: {
						id: 0,
						fecha: '',
						indicadores: {}
					},
					evaluacion: {},
					pago: {},
					users: [],
					deletedResources: [],
					tabs: {
						general: true, 
						clases: false,
						pagos: false,
						evaluaciones: false,
						examenes: false
					},
					tabItems: [
						{name: 'Desempeño', tab: 'clases'},
						{name: 'Factor Humano', tab: 'pagos'},
						{name: 'Habilidades', tab: 'evaluaciones'}
					],
					clase: {},
					claseAsiste: {},
					pagoAsiste: {},
					usersInCourse: [],
					claseSelected: 0,
					pagoSelected: 0,
					claseIsSelected: false,
					pagoIsSelected: false,
					toggleItem: {
						recursos: false,
						alumnos: false
					},
					indicadores: {},
					MAX_EVALUACION: 135,
					MAX_POINTS: 5
				}
			},
			methods: {
				newCourse: function (){
					this.course = {
						id: 0,
						active: 1,
						fecha: new Date().toISOString().slice(0,19)
					}
					this.error = ''
					// console.log("evaluación :: ", this.course)
				},
				activeTab: function (tab){
					// Set all to false
					for (const key in this.tabs) {
						this.$set(this.tabs, key, false)
					}
					this.$set(this.tabs, tab, true)
				},
				asisteClase: function(item, key){
					// console.log("asistencia: ", item)
					$('#asistenciasBackdrop').modal('show')
					
					const claseItem  = copy(item)
					this.claseAsiste = claseItem
					this.claseSelected = key
					this.claseIsSelected = true
				},
				asistePago: function(item, key){
					// console.log("asistencia: ", item)
					$('#pagosBackdrop').modal('show')
					
					const pagoItem  = copy(item)
					this.pagoAsiste = pagoItem
					this.pagoSelected = key
					this.pagoIsSelected = true
				},
				confiraAsisteClase: function (){
					// console.log("this.claseAsiste: ", this.claseAsiste)
					$('#asistenciasBackdrop').modal('hide')
					
					setTimeout( () => {
						this.claseIsSelected = false
					}, 10)
					
				},
				confiraPagoClase: function (){
					// console.log("this.claseAsiste: ", this.pagoAsiste)
					$('#pagosBackdrop').modal('hide')
					
					setTimeout( () => {
						this.pagoIsSelected = false
					}, 10)
					
				},
				getCourseById: function (id){
					this.course = {
						clases: [],
						users: [],
						pagos: []
					}
					this.tabs = {
						general: true, 
						clases: false,
						pagos: false
					}

					this.claseSelected = 0
					this.pagoSelected = 0

					this.users.map( user => {
						user.inCourse = false
					})
					
					CourseService().getCourseById(id, (res) => {
						if(!res.error){
							this.course = res.response;
							// console.log("this.course: ", this.course)
							if(!this.course.resources){
								this.course.resources = []
							}

							if(!this.course.indicadores){
								this.course.indicadores = this.indicadores
							}

							if(!this.course.pagos){
								this.$set(this.course, 'pagos', [])
							}

							if(!this.course.evaluaciones){
								this.$set(this.course, 'evaluaciones', [])
							}

							// Reviso que alumnos están en el curso
							if(this.course.users && this.course.users.length > 0){
								// console.log("this.users: ", this.users)
								this.course.users.map( item => {
									this.users.map( user => {
										if(user.id == item.idUser){
											user.inCourse = true
										}
									})
								})
								// Map clases y add alumnos							
								this.course.clases.map( clase => {
									if(!clase.users){
										clase.users = []
										clase.users = copy(this.users.filter( user => user.inCourse == true))
										clase.asistencias = 0
									} else {
										let countAsistencias = 0
										clase.users.map(item => {
											if(item.asiste == true){
												countAsistencias++
											}
										})
										clase.asistencias = countAsistencias

										if(countAsistencias == 0){
											clase.users = copy(this.users.filter( user => user.inCourse == true))
										}
									}
								})

								this.course.pagos.map( pago => {
									if(!pago.users){
										pago.users = []
										pago.users = copy(this.users.filter( user => user.inCourse == true))
										pago.pagaron = 0
									} else {
										let countAsistencias = 0
										// Aux users
										let userArr = copy(this.users.filter( user => user.inCourse == true))

										userArr.map( (user, i) => {
											pago.users.map(item => {
												if(item.pagar == true && user.id == item.id){
													user.pagar = true
													countAsistencias++
												}
											})
										})

										// Copio lo nuevo
										pago.users   = copy(userArr)
										pago.pagaron = countAsistencias

										if(countAsistencias == 0){
											pago.users = copy(this.users.filter( user => user.inCourse == true))
										}
									}
								})

							} else {
								this.course.users = []
								this.users.map( user => {
									user.inCourse = false
								})
							}
						}
					})
				},
				upsertCourse: function (){
					// Verifico que los usuarios estén dentro del curso sino los agrego
					let activeUsers = []

					this.users.map( (item) => {
						if(item.inCourse == true){
							const alumno = {
								idUser: item.id,
								idCourse: this.course.id,
								active: 1
							}
							activeUsers.push(alumno)
						}
					})
					// console.log("this.users upsert: ", this.users)
					this.course.users = activeUsers;
					
					// console.log("this.course: ", this.course)

					CourseService().upsertCourse(this.course, (res)=> {
						// console.log("res course: ", res)
						if(res.response){
							$('#staticBackdrop').modal('hide')
							// Disparo el toast
							Vue.toasted.show(res.response, {
								type: 'success',
								duration: 2000
							});

							// Get all courses again 
							CourseService().getAllCourses( (res) => {
								this.isLoading = false;
								if(!res.error){
									let courses  = res.response;
									this.courses = courses;
								} else {
									this.error = res.error;
								}
							})
						}
					})
				},
				removeHTTP: function (url, model, prop){
					this.$set(this[model], prop, url.replace('http://','').replace('https://',''))
				},
				addResource: function (){
					let resource = this.resource;
					const protocol = 'https://'
					if(resource.link && (!resource.link.includes('http://') || !resource.link.includes('https://'))){
						resource.link = protocol + resource.link
					}
					this.course.resources.push(resource)

					this.resource = {
						active: 1,
						type: 'video',
						link: ''
					}
				},
				deleteResource: function (item, key){
					const deleted = {
						id: item.id ? item.id : null,
						idCourse: item.idCourse
					}
					
					// Item no descartable
					if(deleted.id !== null){
						this.deletedResources.push(deleted)
					}
					this.course.resources.splice(key, 1)
				},
				addClase: function (){
					const clase = this.clase;
					const protocol = 'https://'
					if(clase.meet && (!clase.meet.includes('http://') || !clase.meet.includes('https://'))){
						clase.meet = protocol + clase.meet
					}
					
					if(!this.course.clases){
						this.course.clases = []
					}
					this.course.clases.push(clase)

					this.clase = {}
				},
				addPago: function (){
					const pago = this.pago;
					const protocol = 'https://'
					if(pago.link && (!pago.link.includes('http://') || !pago.link.includes('https://'))){
						pago.link = protocol + pago.link
					}
					// pago.pagaron = 0

					if(!this.course.pagos){
						this.course.pagos = []
					}
					this.course.pagos.push(pago)

					this.pago = {}
				},
				addEvaluacion: function (){
					const evaluacion = this.evaluacion;

					if(!this.course.evaluaciones){
						this.course.evaluaciones = []
					}
					this.course.evaluaciones.push(evaluacion)

					this.evaluacion = {}
				},
				deleteClase: function (item, key){
					
					this.course.clases.splice(key, 1)
					// console.log("this.course.clases: ", this.course.clases)
				},
				deletePago: function (item, key){
					this.course.pagos.splice(key, 1)
					// console.log("this.course.pago: ", this.course.pagos)
				},
				deleteEvaluacion: function (item, key){
					this.course.evaluaciones.splice(key, 1)
				}
			},
			mounted: function (){
				
				let id    	= app._route.params.id ? app._route.params.id : undefined
				this.curso 	= app._route.params.curso ? decodeURIComponent(app._route.params.curso) : undefined
				let token 	= localStorage.getItem('token-app-' + APP_NAME);
				let userId 	= localStorage.getItem('id-' + APP_NAME);

				const headers = {
					token: token,
					'user-id': userId
				}

				// Verifico el token
				verifyToken(token)

				CourseService().getAllCourses( (res) => {
					this.isLoading = false;
					if(!res.error){
						let courses  = res.response;
						this.courses = courses;
					} else {
						this.error = res.error;
					}
				})

				UserService().getAllUsers( (res) => {
					this.isLoading = false;
					if(!res.error){
						let users  = res.response;
						this.users = users;
					} else {
						this.error = res.error;
					}
				})

				// Obtengo indicadores desde el JSON
				axios.get('./data/indicadores.json').then( res => {
					// console.log("cargo los indicadores: ", res)
					this.indicadores = res.data
					this.course.indicadores = res.data
				})

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