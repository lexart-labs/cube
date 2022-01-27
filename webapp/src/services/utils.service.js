const UtilsServices = {
	copy: function (obj) {
		return JSON.parse( JSON.stringify(obj) );
	}
}

export default UtilsServices;