const express = require('express');
const router = express.Router();
const Course = require('../services/courses.service')
const User   = require('../services/users.service')

router.get('/all', Mdl.middleware, async function (req, res) {
	let response = await Course.all(req.headers['user-id']);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/:id', Mdl.middleware, async function (req, res) {
	let response = await Course.one(req.params.id);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.post('/upsert', Mdl.middleware, async function (req, res) {
	let post 	 = req.body;
	let response = await Course.upsert(post, req.headers['user-id']);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/by-user/:id', Mdl.middleware, async function (req, res) {
	let id   = req.params.id;

	let response = await Course.courses(id);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

module.exports = router;