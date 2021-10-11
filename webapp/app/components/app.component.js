const AppComponent = Vue.component('app-component', function (callback) {
	let viewUrl = './app/components/appView.html'

	axios.get(viewUrl).then( function (result){
		let view = result.data;

		callback({
			data: function () {
				return {}
			},
			methods: {
				
			},
			mounted: function (){},
			template: view
		})
	})
})