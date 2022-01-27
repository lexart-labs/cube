const express = require('express');
const router = express.Router();
const Resource = require('../services/resources.service')


router.get('/by-course/:id', Mdl.middleware, Mdl.middlewareCourse, async function (req, res) {
	let id   = req.params.id;

	let response = await Resource.getResourcesByCourse(id);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

module.exports = router;
