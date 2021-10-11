const CourseService = function (){
	const model = 'courses/'
	return {
		getCourseById: function (id, cb){
			const token 	= localStorage.getItem('token-app-' + APP_NAME);
			const userId 	= localStorage.getItem('id-' + APP_NAME);

			const headers = {
				token: token,
				'user-id': userId
			}

			axios.get(API + model + id, {headers: headers}).then( function (res){
				cb(res.data)
			})
		},
		getAllCourses: function (cb){
			const token 	= localStorage.getItem('token-app-' + APP_NAME);
			const userId 	= localStorage.getItem('id-' + APP_NAME);

			const headers = {
				token: token,
				'user-id': userId
			}

			axios.get(API + model + 'all', {headers: headers}).then( function (res){
				cb(res.data)
			})
		},
		upsertCourse: function (user, cb){
			const token 	= localStorage.getItem('token-app-' + APP_NAME);
			const userId 	= localStorage.getItem('id-' + APP_NAME);

			const headers = {
				token: token,
				'user-id': userId
			}

			axios.post(API + model + 'upsert', user, {headers: headers}).then( function (res){
				cb(res.data)
			})
		}
	}
}