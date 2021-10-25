const UserService = function (){
	const model = 'users/'
	return {
		getUserById: function (id, cb){
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
		getAllUsers: function (cb){
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
		getAllUsersLextracking: function (cb){
			const token 	= localStorage.getItem('token-app-' + APP_NAME);
			const userId 	= localStorage.getItem('id-' + APP_NAME);

			const headers = {
				token: token,
				'user-id': userId
			}

			axios.get(API + model + 'lextracking/all', {headers: headers}).then( function (res){
				cb(res.data)
			})
		},
		upsertUser: function (user, cb){
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