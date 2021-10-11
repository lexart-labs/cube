const AuthService = function (){
	return {
		checkType: function (cb){
			const token 	= localStorage.getItem('token-app-' + APP_NAME);
			const userId 	= localStorage.getItem('id-' + APP_NAME);

			const user = {
				token: token,
				userId: userId
			}
			
			const headers = {
				token: token,
				'user-id': userId
			}

			axios.post(API + 'users/check-type', user, {headers: headers}).then( function (res){
				cb(res.data)
			})
		}
	}
}