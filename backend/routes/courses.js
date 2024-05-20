const express = require('express');
const router = express.Router();
const Course = require('../services/courses.service');

router.get('/all', Mdl.middleware, async function (req, res) {
	const { page, query } = req.query;
	let response = await Course.all(req.headers['user-id'], page || 0, query);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/count', Mdl.middleware, async function (req, res) {
	const { query } = req.query;
	let response = await Course.countResults(req.headers['user-id'], query);
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

router.post('/copy/:id', Mdl.middleware, async function (req, res) {
	const id = req.params.id;
	const response = await Course.copy(id, req.headers['user-id']);

	res.set(['Content-Type', 'application/json']);
		res.send(response);
})

router.get('/by-user/:id', Mdl.middleware, async function (req, res) {
	let id   = req.params.id;
	const { year } = req.query;

	let response = await Course.courses(id, year);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

router.get('/years/:id', Mdl.middleware, async function (req, res) {
	const { id } = req.params;
	let response = await Course.getYears(id);

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

module.exports = router;
